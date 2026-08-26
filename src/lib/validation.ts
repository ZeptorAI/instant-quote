import { z } from "zod";
import { SALES_CHANNELS, PURCHASE_FREQUENCIES } from "./channels";

const US_ZIP = /^[0-9]{5}$/;
const CA_POSTAL = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;

/**
 * Validates the exact QuoteRequest payload shape the team already consumes.
 * The `destination_postal_code` accepts a US ZIP or a CA postal code.
 */
export const quoteRequestSchema = z.object({
  buyer_id: z.string().min(1),
  deal_id: z.string().min(1),
  sales_channels: z.array(z.enum(SALES_CHANNELS)).min(1),
  quantity: z.number().int().positive(),
  logistics: z.object({
    managed_by_gws: z.boolean(),
    destination_postal_code: z
      .string()
      .refine((v) => US_ZIP.test(v) || CA_POSTAL.test(v), {
        message: "Must be a US ZIP (12345) or CA postal code (A1A 1A1).",
      }),
    site_requirements: z.object({
      has_loading_dock: z.boolean(),
      has_forklift: z.boolean(),
      requires_liftgate: z.boolean(),
    }),
  }),
  purchase_frequency: z.enum(PURCHASE_FREQUENCIES),
  budget_band: z.string().min(1),
  insurance: z.boolean(),
});

export type QuoteRequestPayload = z.infer<typeof quoteRequestSchema>;

// The full submit body also carries a buyer display name for the lead record.
export const submitBodySchema = quoteRequestSchema.extend({
  buyer_name: z.string().min(1).optional(),
});

export type SubmitBody = z.infer<typeof submitBodySchema>;

// --- Admin mutation schemas ---

export const dealUpdateSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  condition: z.string().min(1),
  listedUnitPrice: z.number().nonnegative(),
  retailRef: z.number().nonnegative(),
  unit: z.string().min(1),
  unitsPerPallet: z.number().int().positive(),
  moq: z.number().int().positive(),
  availableQty: z.number().int().positive(),
  unitWeightLb: z.number().positive(),
  restrictedChannels: z.array(z.enum(SALES_CHANNELS)),
  imageEmoji: z.string().min(1).max(8),
});

export const ratesUpdateSchema = z.object({
  dutyRatePct: z.number().min(0).max(1),
  insurancePct: z.number().min(0).max(1),
  logisticsFeePct: z.number().min(0).max(1),
  managedServicePct: z.number().min(0).max(1),
  freightPerLb: z.number().min(0),
  zoneMultCA: z.number().min(1),
  liftgateSurcharge: z.number().min(0),
  noDockHandling: z.number().min(0),
  minFreight: z.number().min(0),
  rangeBandPct: z.number().min(0).max(0.9),
});
