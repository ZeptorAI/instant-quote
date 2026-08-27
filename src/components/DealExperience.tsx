"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import type { DealDTO, RatesDTO } from "@/lib/data";
import { Estimator } from "@/components/Estimator";
import { money, money2, num, pct } from "@/lib/format";

const FLAGS: Record<string, string> = {
  "United States": "🇺🇸",
  Canada: "🇨🇦",
  "United Kingdom": "🇬🇧",
};

export function DealExperience({
  deal,
  rates,
}: {
  deal: DealDTO;
  rates: RatesDTO;
}) {
  const [showQuote, setShowQuote] = useState(false);
  const [imgOk, setImgOk] = useState(true);
  const quoteRef = useRef<HTMLDivElement>(null);

  const margin = deal.retailRef > 0 ? 1 - deal.listedUnitPrice / deal.retailRef : 0;
  const flag = FLAGS[deal.country] ?? "🏳️";

  function generateQuote() {
    setShowQuote(true);
    // wait for the section to mount, then scroll to it
    requestAnimationFrame(() => {
      quoteRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <>
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-text"
      >
        <span aria-hidden>←</span> Back to All Deals
      </Link>

      {/* ---------- Hero ---------- */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Image */}
        <div className="card relative flex min-h-[340px] items-center justify-center overflow-hidden p-8">
          <span
            className="badge absolute right-4 top-4 z-10"
            style={{ background: "var(--green)", color: "#052e1f" }}
          >
            ↗ Profit Margin {pct(margin)}
          </span>
          {deal.imageUrl && imgOk ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={deal.imageUrl}
              alt={deal.name}
              onError={() => setImgOk(false)}
              className="relative max-h-[380px] w-auto rounded-xl object-contain"
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-br from-blue/10 via-transparent to-cyan/10" />
              <div className="relative text-center">
                <div className="text-[128px] leading-none">
                  {deal.imageEmoji}
                </div>
                <div className="mt-4 text-xs uppercase tracking-widest text-muted">
                  {deal.category} · Lot preview
                </div>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-[34px]">
            {deal.name}
          </h1>

          {/* Tags */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-muted">
              🏷 {deal.category}
            </span>
            <span className="rounded-full bg-white/[0.06] px-3 py-1 text-xs font-semibold text-muted">
              {flag} {deal.country}
            </span>
            <span className="rounded-full bg-white/[0.12] px-3 py-1 text-xs font-bold text-text">
              {deal.condition}
            </span>
          </div>

          {/* Pricing card */}
          <div className="mt-5 rounded-2xl border border-green/30 bg-green/[0.08] p-5">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="text-[11px] uppercase tracking-wider text-muted">
                  SRP / Retail
                </div>
                <div className="tnum text-xl text-muted line-through">
                  {money2(deal.retailRef)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-green">
                  GWS Wholesale Price
                </div>
                <div className="flex items-baseline justify-end gap-1.5">
                  <span className="tnum font-display text-4xl font-extrabold">
                    {money2(deal.listedUnitPrice)}
                  </span>
                  <span className="text-sm text-muted">per {deal.unit}</span>
                </div>
              </div>
            </div>
            <div className="mt-3">
              <span className="badge bg-green/20 text-green">
                ↗ Profit Margin {pct(margin)}
              </span>
            </div>
            <p className="mt-3 text-[11px] leading-relaxed text-muted">
              FOB {deal.country} — shipping, duties &amp; taxes additional.
              Margin shown is before landed costs.
            </p>
          </div>

          {/* Stat boxes */}
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-line bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Available Quantity
              </div>
              <div className="tnum mt-0.5 text-lg font-bold">
                {num(deal.availableQty)} {deal.unit}s
              </div>
            </div>
            <div className="rounded-xl border border-line bg-white/[0.02] px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-muted">
                Minimum Order
              </div>
              <div className="tnum mt-0.5 text-lg font-bold">
                {num(deal.moq)} {deal.unit}s
              </div>
            </div>
          </div>

          {/* CTAs */}
          <button
            type="button"
            onClick={generateQuote}
            className="btn-gold mt-4 w-full text-base"
          >
            Generate me an instant Quote →
          </button>
          <button type="button" className="btn-ghost mt-3 w-full">
            Apply for Full Membership Access
          </button>

          {/* Trust row */}
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Trust icon="🛡" label="Verified Supplier" />
            <Trust icon="🔒" label="Escrow Protected" />
            <Trust icon="🚚" label="Managed Shipping" />
          </div>
        </div>
      </section>

      {/* ---------- Instant quote (revealed on CTA) ---------- */}
      {showQuote && (
        <section ref={quoteRef} className="mt-10 scroll-mt-24">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-2xl font-bold">
              Your instant landed-cost quote
            </h2>
            <span className="badge bg-cyan/15 text-cyan">Live</span>
          </div>
          <p className="mb-4 max-w-2xl text-sm text-muted">
            Tell us how you&apos;ll receive and resell this lot. We&apos;ll price
            the full landed cost instantly — freight, duties, handling and fees —
            then forward your qualified request to the GWS team.
          </p>
          <Estimator deal={deal} rates={rates} />
        </section>
      )}
    </>
  );
}

function Trust({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-lg border border-line bg-white/[0.02] px-2 py-2.5 text-center">
      <span className="text-base">{icon}</span>
      <span className="text-[11px] font-medium text-muted">{label}</span>
    </div>
  );
}
