"use client";

import { useMemo, useState } from "react";
import type { DealDTO, RatesDTO } from "@/lib/data";
import {
  computeEstimate,
  computeResaleMargin,
  isValidPostal,
  isCanadianPostal,
} from "@/lib/estimator";
import {
  SALES_CHANNELS,
  CHANNEL_LABELS,
  BUDGET_BANDS,
  PURCHASE_FREQUENCIES,
  type SalesChannel,
  type PurchaseFrequency,
} from "@/lib/channels";
import { money, money2, num, pct } from "@/lib/format";

interface Props {
  deal: DealDTO;
  rates: RatesDTO;
}

interface SuccessState {
  ref: string;
  estLow: number;
  estHigh: number;
  perUnit: number;
  restrictedHit: string[];
}

export function Estimator({ deal, rates }: Props) {
  // --- form state ---
  const [buyerName, setBuyerName] = useState("");
  const [quantity, setQuantity] = useState<number>(deal.moq);
  const [channels, setChannels] = useState<SalesChannel[]>([]);
  const [managedByGws, setManagedByGws] = useState(true);
  const [postal, setPostal] = useState("");
  const [frequency, setFrequency] = useState<PurchaseFrequency>("One-time");
  const [hasLoadingDock, setHasLoadingDock] = useState(false);
  const [hasForklift, setHasForklift] = useState(false);
  const [requiresLiftgate, setRequiresLiftgate] = useState(false);
  const [budgetBand, setBudgetBand] = useState<string>(BUDGET_BANDS[1]);
  const [insurance, setInsurance] = useState(true);

  const [showResale, setShowResale] = useState(false);
  const [resalePrice, setResalePrice] = useState<number>(
    Math.round(deal.retailRef * 0.7)
  );

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  // --- validation ---
  const qtyError =
    !Number.isFinite(quantity) || quantity < deal.moq
      ? `Minimum order is ${num(deal.moq)} ${deal.unit}s.`
      : null;
  const postalError =
    postal.length === 0
      ? "Enter a destination postal code."
      : !isValidPostal(postal)
      ? "Enter a US ZIP (12345) or CA postal (A1A 1A1)."
      : null;
  const channelError = channels.length === 0 ? "Pick at least one channel." : null;

  const canEstimate = !qtyError && !postalError;
  const canSubmit = canEstimate && !channelError && buyerName.trim().length > 0;

  const restrictedHit = channels.filter((c) =>
    deal.restrictedChannels.includes(c)
  );

  // --- live estimate ---
  const est = useMemo(() => {
    if (!canEstimate) return null;
    return computeEstimate(
      {
        listedUnitPrice: deal.listedUnitPrice,
        unitWeightLb: deal.unitWeightLb,
        quantity,
        postal,
        managedByGws,
        requiresLiftgate,
        hasLoadingDock,
        hasForklift,
        insurance,
      },
      rates
    );
  }, [
    canEstimate,
    deal.listedUnitPrice,
    deal.unitWeightLb,
    quantity,
    postal,
    managedByGws,
    requiresLiftgate,
    hasLoadingDock,
    hasForklift,
    insurance,
    rates,
  ]);

  const resale = useMemo(() => {
    if (!est) return null;
    return computeResaleMargin(resalePrice, est.perUnit, channels);
  }, [est, resalePrice, channels]);

  function toggleChannel(c: SalesChannel) {
    setChannels((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    const buyerId =
      buyerName
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 40) || "buyer";
    const body = {
      buyer_id: buyerId,
      buyer_name: buyerName.trim(),
      deal_id: deal.id,
      sales_channels: channels,
      quantity,
      logistics: {
        managed_by_gws: managedByGws,
        destination_postal_code: postal.trim(),
        site_requirements: {
          has_loading_dock: hasLoadingDock,
          has_forklift: hasForklift,
          requires_liftgate: requiresLiftgate,
        },
      },
      purchase_frequency: frequency,
      budget_band: budgetBand,
      insurance,
    };
    try {
      const res = await fetch("/api/quote-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data.error || "Something went wrong. Please try again.");
      } else {
        setSuccess({
          ref: data.ref,
          estLow: data.estLow,
          estHigh: data.estHigh,
          perUnit: data.perUnit,
          restrictedHit: data.restrictedHit || [],
        });
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <SuccessPanel
        success={success}
        deal={deal}
        quantity={quantity}
        onReset={() => setSuccess(null)}
      />
    );
  }

  const zoneIsCA = postal && isCanadianPostal(postal);

  return (
    <div className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
      {/* -------- Form -------- */}
      <div className="card p-5 sm:p-6">
        <div className="space-y-5">
          {/* Buyer */}
          <div>
            <label className="label" htmlFor="buyerName">
              Your company / buyer name
            </label>
            <input
              id="buyerName"
              className="input"
              placeholder="e.g. Northgate Resale Co."
              value={buyerName}
              onChange={(e) => setBuyerName(e.target.value)}
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="label" htmlFor="qty">
              Quantity ({deal.unit}s) · MOQ {num(deal.moq)}
            </label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn-ghost px-3"
                onClick={() =>
                  setQuantity((q) => Math.max(deal.moq, (q || deal.moq) - deal.unitsPerPallet))
                }
                aria-label="Decrease by one pallet"
              >
                −
              </button>
              <input
                id="qty"
                type="number"
                min={deal.moq}
                className={`input tnum text-center ${qtyError ? "input-error" : ""}`}
                value={Number.isFinite(quantity) ? quantity : ""}
                onChange={(e) => setQuantity(parseInt(e.target.value, 10))}
              />
              <button
                type="button"
                className="btn-ghost px-3"
                onClick={() =>
                  setQuantity((q) => (q || deal.moq) + deal.unitsPerPallet)
                }
                aria-label="Increase by one pallet"
              >
                +
              </button>
            </div>
            {qtyError ? (
              <p className="mt-1 text-xs text-amber">{qtyError}</p>
            ) : (
              <p className="mt-1 text-xs text-muted">
                ≈ {num(Math.ceil(quantity / deal.unitsPerPallet))} pallet(s)
              </p>
            )}
          </div>

          {/* Channels */}
          <div>
            <label className="label">Sales channels</label>
            <div className="flex flex-wrap gap-2">
              {SALES_CHANNELS.map((c) => {
                const active = channels.includes(c);
                const restricted = deal.restrictedChannels.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    className="chip"
                    data-active={active}
                    onClick={() => toggleChannel(c)}
                    aria-pressed={active}
                  >
                    {restricted && (
                      <span title="Resale restriction" className="text-amber">
                        ⚠
                      </span>
                    )}
                    {CHANNEL_LABELS[c]}
                  </button>
                );
              })}
            </div>
            {channelError && (
              <p className="mt-1 text-xs text-amber">{channelError}</p>
            )}
          </div>

          {/* Logistics toggle */}
          <div>
            <label className="label">Logistics</label>
            <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-white/[0.02] p-1">
              <SegBtn
                active={managedByGws}
                onClick={() => setManagedByGws(true)}
              >
                🚚 GWS managed
              </SegBtn>
              <SegBtn
                active={!managedByGws}
                onClick={() => setManagedByGws(false)}
              >
                🏭 Self pickup
              </SegBtn>
            </div>
          </div>

          {/* Postal + frequency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="postal">
                Destination postal
              </label>
              <input
                id="postal"
                className={`input tnum ${postalError && postal ? "input-error" : ""}`}
                placeholder="30301 or M5V 2T6"
                value={postal}
                onChange={(e) => setPostal(e.target.value)}
              />
              {postal && postalError ? (
                <p className="mt-1 text-xs text-amber">{postalError}</p>
              ) : zoneIsCA ? (
                <p className="mt-1 text-xs text-cyan">
                  Canada zone · cross-border duty applies
                </p>
              ) : null}
            </div>
            <div>
              <label className="label" htmlFor="freq">
                Order frequency
              </label>
              <select
                id="freq"
                className="input"
                value={frequency}
                onChange={(e) =>
                  setFrequency(e.target.value as PurchaseFrequency)
                }
              >
                {PURCHASE_FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Receiving site */}
          <div>
            <label className="label">
              Receiving site {managedByGws ? "" : "(applies to GWS delivery)"}
            </label>
            <div className="flex flex-wrap gap-2">
              <Check
                label="Loading dock"
                checked={hasLoadingDock}
                onChange={setHasLoadingDock}
              />
              <Check
                label="Forklift on site"
                checked={hasForklift}
                onChange={setHasForklift}
              />
              <Check
                label="Requires liftgate"
                checked={requiresLiftgate}
                onChange={setRequiresLiftgate}
              />
            </div>
            {managedByGws && !hasLoadingDock && !hasForklift && (
              <p className="mt-1 text-xs text-muted">
                No dock or forklift → a no-dock handling fee is added.
              </p>
            )}
          </div>

          {/* Budget + insurance */}
          <div className="grid grid-cols-2 items-end gap-4">
            <div>
              <label className="label" htmlFor="budget">
                Budget band
              </label>
              <select
                id="budget"
                className="input"
                value={budgetBand}
                onChange={(e) => setBudgetBand(e.target.value)}
              >
                {BUDGET_BANDS.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex cursor-pointer items-center justify-between rounded-xl border border-line bg-white/[0.02] px-3 py-2.5">
              <span className="text-sm font-semibold">Add cargo insurance</span>
              <Toggle checked={insurance} onChange={setInsurance} />
            </label>
          </div>
        </div>
      </div>

      {/* -------- Live panel -------- */}
      <div className="lg:sticky lg:top-20 lg:self-start">
        <div className="card overflow-hidden">
          <div className="border-b border-line px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Itemized landed cost
          </div>

          {!est ? (
            <div className="px-5 py-10 text-center text-sm text-muted">
              Fill in a valid quantity and destination to see your instant
              estimate.
            </div>
          ) : (
            <div className="px-5 py-4">
              <div className="space-y-1.5 text-sm">
                <Line label={`Goods (${num(quantity)} × ${money2(deal.listedUnitPrice)})`} value={est.lines.goods} />
                <Line label="Freight" value={est.lines.freight} muted={!managedByGws} />
                <Line label="Duty (cross-border)" value={est.lines.duty} muted={est.lines.duty === 0} />
                <Line label="Liftgate" value={est.lines.liftgate} muted={est.lines.liftgate === 0} />
                <Line label="No-dock handling" value={est.lines.handling} muted={est.lines.handling === 0} />
                <Line label="Insurance" value={est.lines.insurance} muted={est.lines.insurance === 0} />
                <Line label="Logistics fee" value={est.lines.logisticsFee} muted={est.lines.logisticsFee === 0} />
                <Line label="Service fee" value={est.lines.managedService} />
              </div>

              {/* Range box */}
              <div className="mt-4 rounded-xl border border-blue/30 bg-blue/10 p-4">
                <div className="text-[11px] uppercase tracking-wider text-muted">
                  Estimated landed total ({pct(rates.rangeBandPct)} band)
                </div>
                <div className="tnum mt-1 font-display text-2xl font-extrabold sm:text-3xl">
                  {money(est.low)} – {money(est.high)}
                </div>
                <div className="tnum mt-1 text-sm text-muted">
                  Per unit {money2(est.perUnitLow)} – {money2(est.perUnitHigh)}
                </div>
              </div>

              {/* Restriction warning */}
              {restrictedHit.length > 0 && (
                <div className="mt-3 rounded-xl border border-amber/40 bg-amber/10 p-3 text-xs text-amber">
                  <strong>⚠ Compliance flag:</strong> manufacturer resale
                  restriction on {restrictedHit.map((c) => CHANNEL_LABELS[c as SalesChannel]).join(", ")}. You can still submit — the request will be flagged for review.
                </div>
              )}

              {/* Resale margin */}
              <button
                type="button"
                className="mt-3 flex w-full items-center justify-between text-left text-sm font-semibold text-cyan"
                onClick={() => setShowResale((v) => !v)}
                aria-expanded={showResale}
              >
                Check my resale margin
                <span>{showResale ? "▲" : "▼"}</span>
              </button>
              {showResale && (
                <div className="mt-2 rounded-xl border border-line bg-white/[0.02] p-3">
                  <label className="label" htmlFor="resale">
                    Expected resale price / unit
                  </label>
                  <input
                    id="resale"
                    type="number"
                    className="input tnum"
                    value={Number.isFinite(resalePrice) ? resalePrice : ""}
                    onChange={(e) =>
                      setResalePrice(parseFloat(e.target.value))
                    }
                  />
                  {resale && (
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                      <Stat label="Channel fee" value={pct(resale.fee)} />
                      <Stat label="Net / unit" value={money2(resale.net)} tone={resale.net >= 0 ? "green" : "amber"} />
                      <Stat label="Margin" value={pct(resale.margin)} tone={resale.margin >= 0 ? "green" : "amber"} />
                    </div>
                  )}
                  {channels.length === 0 && (
                    <p className="mt-2 text-xs text-muted">
                      Select channels above to apply marketplace fees.
                    </p>
                  )}
                </div>
              )}

              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                Estimate only. GWS confirms final pricing against a live lot
                before any purchase.
              </p>
            </div>
          )}

          {/* CTA */}
          <div className="border-t border-line p-4">
            {submitError && (
              <p className="mb-2 text-xs text-amber">{submitError}</p>
            )}
            <button
              type="button"
              className="btn-primary w-full"
              disabled={!canSubmit || submitting}
              onClick={handleSubmit}
            >
              {submitting
                ? "Submitting…"
                : "I'm interested, request this pricing"}
            </button>
            {!canSubmit && (
              <p className="mt-2 text-center text-[11px] text-muted">
                {buyerName.trim().length === 0
                  ? "Add your company name to continue."
                  : channelError
                  ? channelError
                  : "Complete the required fields to submit."}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- small UI pieces ---------- */

function Line({
  label,
  value,
  muted = false,
}: {
  label: string;
  value: number;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between ${
        muted ? "text-muted" : ""
      }`}
    >
      <span>{label}</span>
      <span className="tnum font-medium">{money2(value)}</span>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
        active
          ? "bg-blue/20 text-text shadow-[inset_0_0_0_1px_var(--blue)]"
          : "text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      className="chip"
      data-active={checked}
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
    >
      <span className="text-xs">{checked ? "☑" : "☐"}</span>
      {label}
    </button>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${
        checked ? "bg-green" : "bg-white/15"
      }`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
          checked ? "left-[22px]" : "left-0.5"
        }`}
      />
    </button>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "green" | "amber";
}) {
  return (
    <div className="rounded-lg border border-line bg-white/[0.02] px-1 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div
        className={`tnum mt-0.5 font-semibold ${
          tone === "green"
            ? "text-green"
            : tone === "amber"
            ? "text-amber"
            : ""
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function SuccessPanel({
  success,
  deal,
  quantity,
  onReset,
}: {
  success: SuccessState;
  deal: DealDTO;
  quantity: number;
  onReset: () => void;
}) {
  return (
    <div className="card mx-auto max-w-xl p-6 text-center sm:p-8">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green/15 text-3xl">
        ✅
      </div>
      <h3 className="mt-4 font-display text-2xl font-extrabold">
        Request received
      </h3>
      <p className="mt-1 text-sm text-muted">
        Our team has your fully-qualified request and will confirm final pricing
        against a live lot.
      </p>

      <div className="mt-5 rounded-xl border border-line bg-white/[0.02] p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted">
          Reference code
        </div>
        <div className="tnum mt-1 font-mono text-xl font-bold text-cyan">
          {success.ref}
        </div>
      </div>

      <div className="mt-3 rounded-xl border border-blue/30 bg-blue/10 p-4">
        <div className="text-[11px] uppercase tracking-wider text-muted">
          Your estimated landed total
        </div>
        <div className="tnum mt-1 font-display text-2xl font-extrabold">
          {money(success.estLow)} – {money(success.estHigh)}
        </div>
        <div className="tnum mt-1 text-sm text-muted">
          {money2(success.perUnit)} / unit · {num(quantity)} {deal.unit}s
        </div>
      </div>

      {success.restrictedHit.length > 0 && (
        <p className="mt-3 text-xs text-amber">
          ⚠ Flagged for resale-restriction review on{" "}
          {success.restrictedHit
            .map((c) => CHANNEL_LABELS[c as SalesChannel] ?? c)
            .join(", ")}
          .
        </p>
      )}

      <button type="button" className="btn-ghost mt-6" onClick={onReset}>
        Start another estimate
      </button>
    </div>
  );
}
