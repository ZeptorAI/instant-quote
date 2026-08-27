// Default seed values for the Deal and Rates. Used by the seed script and by
// the admin "reset to defaults" action.

import type { RateInputs } from "./estimator";

export const DEFAULT_RATES: RateInputs = {
  dutyRatePct: 0.045, // 4.5% duty on cross-border goods
  insurancePct: 0.012, // 1.2% of goods
  logisticsFeePct: 0.09, // 9% managed-logistics coordination fee
  managedServicePct: 0.06, // 6% marketplace / managed-service fee
  freightPerLb: 0.62, // $/lb
  zoneMultCA: 1.35, // Canada zone multiplier
  liftgateSurcharge: 145,
  noDockHandling: 220,
  minFreight: 350,
  rangeBandPct: 0.08, // ±8% range band
};

export const DEFAULT_DEAL = {
  id: "GWS-DEAL-50",
  name: '36" TV Stand with Electric Fireplace',
  category: "Electronics Gadgets",
  condition: "Closeout Deal",
  country: "United States",
  listedUnitPrice: 77.0, // GWS wholesale price / unit
  retailRef: 299.0, // SRP / retail
  unit: "unit",
  unitsPerPallet: 20,
  moq: 20,
  availableQty: 100,
  unitWeightLb: 58.0,
  restrictedChannels: ["Amazon"] as string[],
  imageEmoji: "🔥",
  imageUrl: "/product.jpg", // drop the photo at public/product.jpg
};
