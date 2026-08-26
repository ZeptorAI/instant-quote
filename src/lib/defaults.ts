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
  name: 'Apple iPad (9th Gen) 10.2" Wi-Fi 64GB — Customer Returns Pallet',
  category: "Consumer Electronics",
  condition: "Customer Returns — Tested Working",
  listedUnitPrice: 149.0,
  retailRef: 329.0,
  unit: "unit",
  unitsPerPallet: 48,
  moq: 48,
  unitWeightLb: 1.6,
  restrictedChannels: ["Amazon"] as string[],
  imageEmoji: "📱",
};
