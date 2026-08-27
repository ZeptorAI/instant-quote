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

export interface RatesDTO extends RateInputs { id: string; }

function resolveImageUrl(url: string): string {
  if (!url || !url.startsWith("/")) return "";
  const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
  try { return fs.existsSync(filePath) ? url : ""; } catch { return ""; }
}

function parseChannels(json: string): SalesChannel[] {
  try {
    const arr = JSON.parse(json);
    if (!Array.isArray(arr)) return [];
    return arr.filter((c): c is SalesChannel => (SALES_CHANNELS as readonly string[]).includes(c));
  } catch { return []; }
}

function defaultDeal(): DealDTO {
  return {
    ...DEFAULT_DEAL,
    restrictedChannels: parseChannels(JSON.stringify(DEFAULT_DEAL.restrictedChannels)),
    imageUrl: resolveImageUrl(DEFAULT_DEAL.imageUrl),
  };
}

export async function getDeal(id: string): Promise<DealDTO | null> {
  if (!process.env.DATABASE_URL) return id === DEFAULT_DEAL.id ? defaultDeal() : null;
  try {
    const row = await prisma.deal.findUnique({ where: { id } });
    if (!row) return null;
    return {
      id: row.id, name: row.name, category: row.category, condition: row.condition,
      listedUnitPrice: row.listedUnitPrice, retailRef: row.retailRef, unit: row.unit,
      unitsPerPallet: row.unitsPerPallet, moq: row.moq, availableQty: row.availableQty,
      country: row.country, unitWeightLb: row.unitWeightLb,
      restrictedChannels: parseChannels(row.restrictedChannels), imageEmoji: row.imageEmoji,
      imageUrl: resolveImageUrl(row.imageUrl),
    };
  } catch (error) {
    console.warn("[data] Database unavailable; using demo deal defaults.", error);
    return id === DEFAULT_DEAL.id ? defaultDeal() : null;
  }
}

export async function getRates(): Promise<RatesDTO> {
  if (!process.env.DATABASE_URL) return { id: "default", ...DEFAULT_RATES };
  try {
    const existing = await prisma.rates.findUnique({ where: { id: "default" } });
    if (existing) {
      const { updatedAt, ...rest } = existing;
      void updatedAt;
      return rest;
    }
    const created = await prisma.rates.create({ data: { id: "default", ...DEFAULT_RATES } });
    const { updatedAt, ...rest } = created;
    void updatedAt;
    return rest;
  } catch (error) {
    console.warn("[data] Database unavailable; using demo rate defaults.", error);
    return { id: "default", ...DEFAULT_RATES };
  }
}

export { DEFAULT_DEAL, DEFAULT_RATES };
