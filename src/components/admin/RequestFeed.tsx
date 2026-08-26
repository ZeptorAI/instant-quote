"use client";

import { useState } from "react";
import type { RequestDTO } from "./AdminClient";
import { CHANNEL_LABELS, type SalesChannel } from "@/lib/channels";
import { money, money2, num } from "@/lib/format";

export function RequestFeed({ requests }: { requests: RequestDTO[] }) {
  if (requests.length === 0) {
    return (
      <div className="card p-10 text-center text-sm text-muted">
        No requests yet. Submit one from a product page.
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {requests.map((r) => (
        <Row key={r.id} r={r} />
      ))}
    </div>
  );
}

function Row({ r }: { r: RequestDTO }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const mid = (r.estLow + r.estHigh) / 2;
  const when = new Date(r.createdAt);

  async function copyPayload() {
    try {
      await navigator.clipboard.writeText(pretty(r.payload));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold">{r.buyerName}</span>
            <span className="font-mono text-xs text-cyan">{r.ref}</span>
            <span className="badge bg-blue/15 text-blue">{r.status}</span>
            {r.purchaseFrequency === "Recurring" && (
              <span className="badge bg-green/15 text-green">Recurring</span>
            )}
            {r.restrictedHit.length > 0 && (
              <span className="badge bg-amber/15 text-amber">
                ⚠ Restriction
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>
              {num(r.quantity)} units · {r.managedByGws ? "GWS managed" : "Self pickup"}
            </span>
            <span>→ {r.destinationPostalCode}</span>
            <span>{r.salesChannels.map((c) => CHANNEL_LABELS[c]).join(", ")}</span>
            <span>{when.toLocaleString()}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="tnum font-display text-lg font-extrabold">
            {money(r.estLow)}–{money(r.estHigh)}
          </div>
          <div className="tnum text-[11px] text-muted">
            mid {money(mid)} · {money2(r.perUnit)}/u
          </div>
        </div>
        <span className="ml-1 text-muted">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-line px-4 py-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 text-sm">
              <Detail k="Buyer ID" v={r.buyerId} mono />
              <Detail k="Deal" v={r.dealId} mono />
              <Detail
                k="Channels"
                v={r.salesChannels
                  .map(
                    (c) =>
                      CHANNEL_LABELS[c] +
                      (r.restrictedHit.includes(c as SalesChannel) ? " ⚠" : "")
                  )
                  .join(", ")}
              />
              <Detail k="Quantity" v={`${num(r.quantity)} units`} />
              <Detail
                k="Logistics"
                v={r.managedByGws ? "GWS managed" : "Self pickup"}
              />
              <Detail k="Destination" v={r.destinationPostalCode} />
              <Detail
                k="Site"
                v={[
                  r.hasLoadingDock && "dock",
                  r.hasForklift && "forklift",
                  r.requiresLiftgate && "liftgate",
                ]
                  .filter(Boolean)
                  .join(", ") || "none"}
              />
              <Detail k="Frequency" v={String(r.purchaseFrequency)} />
              <Detail k="Budget band" v={r.budgetBand} />
              <Detail k="Insurance" v={r.insurance ? "Yes" : "No"} />
              <Detail
                k="Estimate"
                v={`${money(r.estLow)} – ${money(r.estHigh)} · ${money2(
                  r.perUnit
                )}/unit`}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-wider text-muted">
                  Raw payload (what the team receives)
                </span>
                <button
                  type="button"
                  onClick={copyPayload}
                  className="btn-ghost px-2 py-1 text-xs"
                >
                  {copied ? "Copied ✓" : "Copy"}
                </button>
              </div>
              <pre className="max-h-80 overflow-auto rounded-xl border border-line bg-black/30 p-3 text-[11px] leading-relaxed text-muted">
                {pretty(r.payload)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function pretty(json: string): string {
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

function Detail({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-line/60 pb-1.5">
      <span className="text-muted">{k}</span>
      <span className={`text-right ${mono ? "font-mono text-xs" : ""}`}>
        {v}
      </span>
    </div>
  );
}
