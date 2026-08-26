"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DealDTO, RatesDTO } from "@/lib/data";
import {
  SALES_CHANNELS,
  CHANNEL_LABELS,
  type SalesChannel,
} from "@/lib/channels";

type Status = { kind: "idle" | "saving" | "ok" | "error"; msg?: string };

export function PricingControls({
  deal,
  rates,
}: {
  deal: DealDTO;
  rates: RatesDTO;
}) {
  const router = useRouter();

  // --- deal state ---
  const [d, setD] = useState({
    name: deal.name,
    category: deal.category,
    condition: deal.condition,
    listedUnitPrice: deal.listedUnitPrice,
    retailRef: deal.retailRef,
    unit: deal.unit,
    unitsPerPallet: deal.unitsPerPallet,
    moq: deal.moq,
    unitWeightLb: deal.unitWeightLb,
    imageEmoji: deal.imageEmoji,
  });
  const [restricted, setRestricted] = useState<SalesChannel[]>(
    deal.restrictedChannels
  );
  const [dealStatus, setDealStatus] = useState<Status>({ kind: "idle" });

  // --- rates state ---
  const [r, setR] = useState<RatesDTO>(rates);
  const [ratesStatus, setRatesStatus] = useState<Status>({ kind: "idle" });

  function toggleRestricted(c: SalesChannel) {
    setRestricted((prev) =>
      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]
    );
  }

  async function saveDeal() {
    setDealStatus({ kind: "saving" });
    try {
      const res = await fetch(`/api/admin/deal?id=${encodeURIComponent(deal.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...d, restrictedChannels: restricted }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setDealStatus({ kind: "error", msg: j.error || "Save failed." });
      } else {
        setDealStatus({ kind: "ok", msg: "Saved. Live estimates updated." });
        router.refresh();
      }
    } catch {
      setDealStatus({ kind: "error", msg: "Network error." });
    }
  }

  async function saveRates() {
    setRatesStatus({ kind: "saving" });
    try {
      const { id, ...body } = r;
      void id;
      const res = await fetch("/api/admin/rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setRatesStatus({ kind: "error", msg: j.error || "Save failed." });
      } else {
        setRatesStatus({ kind: "ok", msg: "Saved. Live estimates updated." });
        router.refresh();
      }
    } catch {
      setRatesStatus({ kind: "error", msg: "Network error." });
    }
  }

  async function resetRates() {
    setRatesStatus({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/rates", { method: "POST" });
      if (!res.ok) {
        setRatesStatus({ kind: "error", msg: "Reset failed." });
      } else {
        setRatesStatus({ kind: "ok", msg: "Reset to defaults." });
        router.refresh();
      }
    } catch {
      setRatesStatus({ kind: "error", msg: "Network error." });
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* -------- Deal -------- */}
      <div className="card p-5">
        <h3 className="font-display text-lg font-bold">
          Deal <span className="font-mono text-sm text-muted">{deal.id}</span>
        </h3>
        <div className="mt-4 space-y-4">
          <Field label="Product name">
            <input
              className="input"
              value={d.name}
              onChange={(e) => setD({ ...d, name: e.target.value })}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Category">
              <input
                className="input"
                value={d.category}
                onChange={(e) => setD({ ...d, category: e.target.value })}
              />
            </Field>
            <Field label="Condition">
              <input
                className="input"
                value={d.condition}
                onChange={(e) => setD({ ...d, condition: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label="Listed unit price ($)"
              value={d.listedUnitPrice}
              onChange={(v) => setD({ ...d, listedUnitPrice: v })}
            />
            <NumField
              label="Retail reference ($)"
              value={d.retailRef}
              onChange={(v) => setD({ ...d, retailRef: v })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <NumField
              label="MOQ"
              value={d.moq}
              step={1}
              onChange={(v) => setD({ ...d, moq: v })}
            />
            <NumField
              label="Units / pallet"
              value={d.unitsPerPallet}
              step={1}
              onChange={(v) => setD({ ...d, unitsPerPallet: v })}
            />
            <NumField
              label="Unit weight (lb)"
              value={d.unitWeightLb}
              step={0.1}
              onChange={(v) => setD({ ...d, unitWeightLb: v })}
            />
          </div>
          <div className="grid grid-cols-[1fr,auto] gap-3">
            <Field label="Unit noun">
              <input
                className="input"
                value={d.unit}
                onChange={(e) => setD({ ...d, unit: e.target.value })}
              />
            </Field>
            <Field label="Emoji">
              <input
                className="input w-20 text-center text-xl"
                value={d.imageEmoji}
                onChange={(e) => setD({ ...d, imageEmoji: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Restricted channels (resale restriction)">
            <div className="flex flex-wrap gap-2">
              {SALES_CHANNELS.map((c) => (
                <button
                  key={c}
                  type="button"
                  className="chip"
                  data-active={restricted.includes(c)}
                  onClick={() => toggleRestricted(c)}
                >
                  {CHANNEL_LABELS[c]}
                </button>
              ))}
            </div>
          </Field>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              className="btn-primary"
              onClick={saveDeal}
              disabled={dealStatus.kind === "saving"}
            >
              {dealStatus.kind === "saving" ? "Saving…" : "Save deal"}
            </button>
            <StatusText status={dealStatus} />
          </div>
        </div>
      </div>

      {/* -------- Rates -------- */}
      <div className="card p-5">
        <h3 className="font-display text-lg font-bold">Rates &amp; fees</h3>
        <p className="text-xs text-muted">
          Percentages are decimals (0.06 = 6%). Changes apply to future
          estimates immediately.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <NumField label="Duty rate (0–1)" value={r.dutyRatePct} step={0.005} onChange={(v) => setR({ ...r, dutyRatePct: v })} />
          <NumField label="Insurance (0–1)" value={r.insurancePct} step={0.001} onChange={(v) => setR({ ...r, insurancePct: v })} />
          <NumField label="Logistics fee (0–1)" value={r.logisticsFeePct} step={0.005} onChange={(v) => setR({ ...r, logisticsFeePct: v })} />
          <NumField label="Service fee (0–1)" value={r.managedServicePct} step={0.005} onChange={(v) => setR({ ...r, managedServicePct: v })} />
          <NumField label="Freight $/lb" value={r.freightPerLb} step={0.01} onChange={(v) => setR({ ...r, freightPerLb: v })} />
          <NumField label="CA zone mult (≥1)" value={r.zoneMultCA} step={0.05} onChange={(v) => setR({ ...r, zoneMultCA: v })} />
          <NumField label="Liftgate surcharge ($)" value={r.liftgateSurcharge} step={5} onChange={(v) => setR({ ...r, liftgateSurcharge: v })} />
          <NumField label="No-dock handling ($)" value={r.noDockHandling} step={5} onChange={(v) => setR({ ...r, noDockHandling: v })} />
          <NumField label="Min freight ($)" value={r.minFreight} step={10} onChange={(v) => setR({ ...r, minFreight: v })} />
          <NumField label="Range band (0–0.9)" value={r.rangeBandPct} step={0.01} onChange={(v) => setR({ ...r, rangeBandPct: v })} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={saveRates}
            disabled={ratesStatus.kind === "saving"}
          >
            {ratesStatus.kind === "saving" ? "Saving…" : "Save rates"}
          </button>
          <button type="button" className="btn-ghost" onClick={resetRates}>
            Reset to defaults
          </button>
          <StatusText status={ratesStatus} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label">{label}</label>
      {children}
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
  step = 0.01,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        step={step}
        className="input tnum"
        value={Number.isFinite(value) ? value : ""}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </Field>
  );
}

function StatusText({ status }: { status: Status }) {
  if (status.kind === "idle" || status.kind === "saving") return null;
  return (
    <span
      className={`text-xs ${
        status.kind === "ok" ? "text-green" : "text-amber"
      }`}
    >
      {status.msg}
    </span>
  );
}
