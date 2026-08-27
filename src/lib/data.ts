import fs from "fs";
import path from "path";
import { prisma } from "./prisma";
import { DEFAULT_DEAL, DEFAULT_RATES } from "./defaults";
import type { RateInputs } from "./estimator";
import type { SalesChannel } from "./channels";
import { SALES_CHANNELS } from "./channels";

export interface DealDTO {
  id: string;
  name: string;
  category: string;
  condition: string;
  listedUnitPrice: number;
  retailRef: number;
  unit: string;
  unitsPerPallet: number;
  moq: number;
  availableQty: number;
  country: string;
  unitWeightLb: number;
  restrictedChannels: SalesChannel[];
  imageEmoji: string;
  imageUrl: string;
}

export interface RatesDTO extends RateInputs {
  id: string;
}

/** Only surface a /public image path if the file actually exists on disk. */
function resolveImageUrl(url: string): string {
  if (!url || !url.startsWith("/")) return "";
  const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  try {
    return fs.existsSync(filePath) ? url : "";
  } catch {
    return "";
  }
}

function parseChannels(json: string): SalesChannel[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter((c): c is SalesChannel =>
      (SALES_CHANNELS as readonly string[]).includes(c)
    );
  } catch {
    return [];
  }
}

/** Fetch a deal by id, or null if missing. Ensures the default deal exists. */
export async function getDeal(id: string): Promise<DealDTO | null> {
  const row = await prisma.deal.findUnique({ where: { id } });
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    condition: row.condition,
    listedUnitPrice: row.listedUnitPrice,
    retailRef: row.retailRef,
    unit: row.unit,
    unitsPerPallet: row.unitsPerPallet,
    moq: row.moq,
    availableQty: row.availableQty,
    country: row.country,
    unitWeightLb: row.unitWeightLb,
    restrictedChannels: parseChannels(row.restrictedChannels),
    imageEmoji: row.imageEmoji,
    imageUrl: resolveImageUrl(row.imageUrl),
  };
}

/** Fetch the single Rates config row, creating it from defaults if missing. */
export async function getRates(): Promise<RatesDTO> {
  const existing = await prisma.rates.findUnique({ where: { id: "default" } });
  if (existing) {
    const { updatedAt, ...rest } = existing;
    void updatedAt;
    return rest;
  }
  const created = await prisma.rates.create({
    data: { id: "default", ...DEFAULT_RATES },
  });
  const { updatedAt, ...rest } = created;
  void updatedAt;
  return rest;
}

export { DEFAULT_DEAL, DEFAULT_RATES };
