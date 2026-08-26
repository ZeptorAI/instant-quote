// Sales channels and their marketplace fee rates (used by the resale-margin helper).

export const SALES_CHANNELS = [
  "Amazon",
  "Walmart",
  "Shopify",
  "eBay",
  "BrickAndMortar",
] as const;

export type SalesChannel = (typeof SALES_CHANNELS)[number];

export const CHANNEL_LABELS: Record<SalesChannel, string> = {
  Amazon: "Amazon",
  Walmart: "Walmart",
  Shopify: "Shopify",
  eBay: "eBay",
  BrickAndMortar: "Brick & Mortar",
};

// Per-channel resale fee used by the optional resale-margin helper.
export const CHANNEL_FEES: Record<SalesChannel, number> = {
  Amazon: 0.15,
  Walmart: 0.12,
  eBay: 0.13,
  Shopify: 0.029,
  BrickAndMortar: 0,
};

export const PURCHASE_FREQUENCIES = ["One-time", "Recurring"] as const;
export type PurchaseFrequency = (typeof PURCHASE_FREQUENCIES)[number];

export const BUDGET_BANDS = [
  "Under $5k",
  "$5k–$15k",
  "$15k–$50k",
  "$50k–$150k",
  "$150k+",
] as const;
export type BudgetBand = (typeof BUDGET_BANDS)[number];

// Highest resale fee among the selected channels (worst-case for margin).
export function maxChannelFee(channels: SalesChannel[]): number {
  if (channels.length === 0) return 0;
  return Math.max(...channels.map((c) => CHANNEL_FEES[c]));
}
