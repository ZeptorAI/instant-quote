// GWS landed-cost estimator engine.
//
// This is a PURE function used by BOTH the live product-page UI and the API on
// submit. The API always recomputes with this — client math is never trusted.

import type { SalesChannel } from "./channels";
import { maxChannelFee } from "./channels";

/** US 5-digit ZIP or Canadian postal code (A1A 1A1). */
export function isCanadianPostal(postal: string): boolean {
  return /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/.test(postal.trim());
}

export function isUsPostal(postal: string): boolean {
  return /^[0-9]{5}$/.test(postal.trim());
}

export function isValidPostal(postal: string): boolean {
  return isUsPostal(postal) || isCanadianPostal(postal);
}

/** The rate/config inputs — mirrors the Rates row. */
export interface RateInputs {
  dutyRatePct: number;
  insurancePct: number;
  logisticsFeePct: number;
  managedServicePct: number;
  freightPerLb: number;
  zoneMultCA: number;
  liftgateSurcharge: number;
  noDockHandling: number;
  minFreight: number;
  rangeBandPct: number;
}

/** Per-order inputs from the buyer form. */
export interface EstimateInputs {
  listedUnitPrice: number;
  unitWeightLb: number;
  quantity: number;
  postal: string;
  managedByGws: boolean;
  requiresLiftgate: boolean;
  hasLoadingDock: boolean;
  hasForklift: boolean;
  insurance: boolean;
}

export interface EstimateLines {
  goods: number;
  freight: number;
  duty: number;
  liftgate: number;
  handling: number; // no-dock handling
  insurance: number;
  logisticsFee: number;
  managedService: number; // service fee (always applies)
}

export interface EstimateResult {
  lines: EstimateLines;
  weight: number;
  zone: number;
  total: number;
  low: number;
  high: number;
  perUnit: number;
  perUnitLow: number;
  perUnitHigh: number;
}

/**
 * Compute the itemized landed cost + range. Implements the spec exactly.
 */
export function computeEstimate(
  input: EstimateInputs,
  rates: RateInputs
): EstimateResult {
  const {
    listedUnitPrice,
    unitWeightLb,
    quantity,
    postal,
    managedByGws,
    requiresLiftgate,
    hasLoadingDock,
    hasForklift,
    insurance,
  } = input;

  const goods = listedUnitPrice * quantity;
  const weight = unitWeightLb * quantity;
  const zone = isCanadianPostal(postal) ? rates.zoneMultCA : 1.0;

  // Marketplace / managed-service fee — always applies.
  const managedService = goods * rates.managedServicePct;

  let freight = 0;
  let duty = 0;
  let liftgate = 0;
  let handling = 0;
  let logisticsFee = 0;

  if (managedByGws) {
    freight = Math.max(rates.minFreight, weight * rates.freightPerLb * zone);
    liftgate = requiresLiftgate ? rates.liftgateSurcharge : 0;
    handling = !hasLoadingDock && !hasForklift ? rates.noDockHandling : 0;
    duty = zone > 1 ? goods * rates.dutyRatePct : 0; // duty only cross-border
    logisticsFee = (freight + liftgate + handling) * rates.logisticsFeePct;
  }

  const insuranceCost = insurance ? goods * rates.insurancePct : 0;

  const total =
    goods +
    freight +
    duty +
    liftgate +
    handling +
    insuranceCost +
    logisticsFee +
    managedService;

  const low = total * (1 - rates.rangeBandPct);
  const high = total * (1 + rates.rangeBandPct);
  const perUnit = total / quantity;

  return {
    lines: {
      goods,
      freight,
      duty,
      liftgate,
      handling,
      insurance: insuranceCost,
      logisticsFee,
      managedService,
    },
    weight,
    zone,
    total,
    low,
    high,
    perUnit,
    perUnitLow: low / quantity,
    perUnitHigh: high / quantity,
  };
}

export interface ResaleMargin {
  fee: number;
  net: number;
  margin: number;
}

/**
 * Optional resale-margin helper. Uses the worst-case (highest) channel fee.
 */
export function computeResaleMargin(
  resale: number,
  perUnit: number,
  channels: SalesChannel[]
): ResaleMargin {
  const fee = maxChannelFee(channels);
  const net = resale - resale * fee - perUnit;
  const margin = resale > 0 ? net / resale : 0;
  return { fee, net, margin };
}
