import { PrismaClient } from "@prisma/client";
import { DEFAULT_DEAL, DEFAULT_RATES } from "../src/lib/defaults";
import { computeEstimate, type RateInputs } from "../src/lib/estimator";
import { makeRef } from "../src/lib/ref";
import type { SalesChannel } from "../src/lib/channels";

const prisma = new PrismaClient();

interface SeedRequest {
  buyerId: string;
  buyerName: string;
  salesChannels: SalesChannel[];
  quantity: number;
  managedByGws: boolean;
  destinationPostalCode: string;
  hasLoadingDock: boolean;
  hasForklift: boolean;
  requiresLiftgate: boolean;
  purchaseFrequency: "One-time" | "Recurring";
  budgetBand: string;
  insurance: boolean;
}

const SEED_REQUESTS: SeedRequest[] = [
  {
    buyerId: "buyer_northgate",
    buyerName: "Northgate Resale Co.",
    salesChannels: ["Walmart", "eBay"],
    quantity: 40,
    managedByGws: true,
    destinationPostalCode: "30301",
    hasLoadingDock: true,
    hasForklift: true,
    requiresLiftgate: false,
    purchaseFrequency: "Recurring",
    budgetBand: "$15k–$50k",
    insurance: true,
  },
  {
    buyerId: "buyer_maple",
    buyerName: "Maple Liquidators (Toronto)",
    salesChannels: ["Shopify", "Amazon"],
    quantity: 80,
    managedByGws: true,
    destinationPostalCode: "M5V 2T6",
    hasLoadingDock: false,
    hasForklift: false,
    requiresLiftgate: true,
    purchaseFrequency: "Recurring",
    budgetBand: "$50k–$150k",
    insurance: true,
  },
  {
    buyerId: "buyer_soloflip",
    buyerName: "SoloFlip Store",
    salesChannels: ["eBay"],
    quantity: 20,
    managedByGws: false,
    destinationPostalCode: "94103",
    hasLoadingDock: false,
    hasForklift: false,
    requiresLiftgate: false,
    purchaseFrequency: "One-time",
    budgetBand: "$5k–$15k",
    insurance: false,
  },
];

async function main() {
  console.log("Seeding GWS Instant Quote…");

  // --- Deal ---
  const deal = await prisma.deal.upsert({
    where: { id: DEFAULT_DEAL.id },
    update: {
      name: DEFAULT_DEAL.name,
      category: DEFAULT_DEAL.category,
      condition: DEFAULT_DEAL.condition,
      country: DEFAULT_DEAL.country,
      listedUnitPrice: DEFAULT_DEAL.listedUnitPrice,
      retailRef: DEFAULT_DEAL.retailRef,
      unit: DEFAULT_DEAL.unit,
      unitsPerPallet: DEFAULT_DEAL.unitsPerPallet,
      moq: DEFAULT_DEAL.moq,
      availableQty: DEFAULT_DEAL.availableQty,
      unitWeightLb: DEFAULT_DEAL.unitWeightLb,
      restrictedChannels: JSON.stringify(DEFAULT_DEAL.restrictedChannels),
      imageEmoji: DEFAULT_DEAL.imageEmoji,
      imageUrl: DEFAULT_DEAL.imageUrl,
    },
    create: {
      id: DEFAULT_DEAL.id,
      name: DEFAULT_DEAL.name,
      category: DEFAULT_DEAL.category,
      condition: DEFAULT_DEAL.condition,
      country: DEFAULT_DEAL.country,
      listedUnitPrice: DEFAULT_DEAL.listedUnitPrice,
      retailRef: DEFAULT_DEAL.retailRef,
      unit: DEFAULT_DEAL.unit,
      unitsPerPallet: DEFAULT_DEAL.unitsPerPallet,
      moq: DEFAULT_DEAL.moq,
      availableQty: DEFAULT_DEAL.availableQty,
      unitWeightLb: DEFAULT_DEAL.unitWeightLb,
      restrictedChannels: JSON.stringify(DEFAULT_DEAL.restrictedChannels),
      imageEmoji: DEFAULT_DEAL.imageEmoji,
      imageUrl: DEFAULT_DEAL.imageUrl,
    },
  });
  console.log(`  ✓ Deal ${deal.id}`);

  // --- Rates (single row) ---
  const rates = await prisma.rates.upsert({
    where: { id: "default" },
    update: { ...DEFAULT_RATES },
    create: { id: "default", ...DEFAULT_RATES },
  });
  console.log("  ✓ Rates (default)");

  const rateInputs: RateInputs = DEFAULT_RATES;
  const restrictedChannels: string[] = DEFAULT_DEAL.restrictedChannels;

  // --- Example requests ---
  await prisma.quoteRequest.deleteMany({});
  let n = 0;
  for (const r of SEED_REQUESTS) {
    const est = computeEstimate(
      {
        listedUnitPrice: deal.listedUnitPrice,
        unitWeightLb: deal.unitWeightLb,
        quantity: r.quantity,
        postal: r.destinationPostalCode,
        managedByGws: r.managedByGws,
        requiresLiftgate: r.requiresLiftgate,
        hasLoadingDock: r.hasLoadingDock,
        hasForklift: r.hasForklift,
        insurance: r.insurance,
      },
      rateInputs
    );

    const restrictedHit = r.salesChannels.filter((c) =>
      restrictedChannels.includes(c)
    );

    const payload = {
      buyer_id: r.buyerId,
      deal_id: deal.id,
      sales_channels: r.salesChannels,
      quantity: r.quantity,
      logistics: {
        managed_by_gws: r.managedByGws,
        destination_postal_code: r.destinationPostalCode,
        site_requirements: {
          has_loading_dock: r.hasLoadingDock,
          has_forklift: r.hasForklift,
          requires_liftgate: r.requiresLiftgate,
        },
      },
      purchase_frequency: r.purchaseFrequency,
      budget_band: r.budgetBand,
      insurance: r.insurance,
    };

    await prisma.quoteRequest.create({
      data: {
        ref: makeRef(),
        buyerId: r.buyerId,
        buyerName: r.buyerName,
        dealId: deal.id,
        salesChannels: JSON.stringify(r.salesChannels),
        quantity: r.quantity,
        managedByGws: r.managedByGws,
        destinationPostalCode: r.destinationPostalCode,
        hasLoadingDock: r.hasLoadingDock,
        hasForklift: r.hasForklift,
        requiresLiftgate: r.requiresLiftgate,
        purchaseFrequency: r.purchaseFrequency,
        budgetBand: r.budgetBand,
        insurance: r.insurance,
        estLow: est.low,
        estHigh: est.high,
        perUnit: est.perUnit,
        restrictedHit: JSON.stringify(restrictedHit),
        status: "New",
        payload: JSON.stringify({ ...payload, estimate: est }),
      },
    });
    n++;
  }
  console.log(`  ✓ ${n} example quote requests`);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
