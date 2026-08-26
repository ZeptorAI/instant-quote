import { notFound } from "next/navigation";
import { getDeal, getRates } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { Estimator } from "@/components/Estimator";
import { money, num, pct } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = await getDeal(id);
  if (!deal) notFound();
  const rates = await getRates();

  const discount = 1 - deal.listedUnitPrice / deal.retailRef;

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* breadcrumb */}
        <div className="mb-4 text-xs text-muted">
          Deals <span className="mx-1.5">/</span>
          <span className="text-text">{deal.category}</span>
          <span className="mx-1.5">/</span>
          <span className="font-mono">{deal.id}</span>
        </div>

        {/* Hero */}
        <section className="grid gap-5 lg:grid-cols-[1.05fr,0.95fr]">
          {/* Lot image placeholder */}
          <div className="card relative flex min-h-[240px] items-center justify-center overflow-hidden p-6">
            <div className="absolute inset-0 bg-gradient-to-br from-blue/10 via-transparent to-cyan/10" />
            <div className="relative text-center">
              <div className="text-[96px] leading-none">{deal.imageEmoji}</div>
              <div className="mt-3 text-xs uppercase tracking-widest text-muted">
                Lot preview · {num(deal.unitsPerPallet)} {deal.unit}s / pallet
              </div>
            </div>
            <span className="badge absolute left-4 top-4 bg-green/15 text-green">
              {pct(discount)} below retail
            </span>
          </div>

          {/* Title + facts */}
          <div className="card flex flex-col p-6">
            <div className="flex items-center gap-2">
              <span className="badge bg-blue/15 text-blue">{deal.category}</span>
              <span className="badge bg-amber/15 text-amber">
                {deal.condition}
              </span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-extrabold leading-tight sm:text-[28px]">
              {deal.name}
            </h1>

            <div className="mt-4 flex items-end gap-3">
              <div className="tnum font-display text-4xl font-extrabold text-text">
                {money(deal.listedUnitPrice)}
              </div>
              <div className="tnum mb-1 text-lg text-muted line-through">
                {money(deal.retailRef)}
              </div>
              <div className="mb-1 text-sm text-muted">/ {deal.unit}</div>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <Fact label="Minimum order (MOQ)">
                {num(deal.moq)} {deal.unit}s
              </Fact>
              <Fact label="Units / pallet">{num(deal.unitsPerPallet)}</Fact>
              <Fact label="Unit weight">{deal.unitWeightLb} lb</Fact>
              <Fact label="Deal ID">
                <span className="font-mono">{deal.id}</span>
              </Fact>
            </dl>

            {/* Trust row */}
            <div className="mt-auto grid grid-cols-3 gap-2 pt-6">
              <Trust icon="🔒" label="Escrow protected" />
              <Trust icon="✅" label="Verified supplier" />
              <Trust icon="🚚" label="Managed logistics" />
            </div>
          </div>
        </section>

        {/* Estimator */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2">
            <h2 className="font-display text-xl font-bold">
              Instant landed-cost estimate
            </h2>
            <span className="badge bg-cyan/15 text-cyan">Live</span>
          </div>
          <Estimator deal={deal} rates={rates} />
        </section>
      </main>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-line bg-white/[0.02] px-3 py-2">
      <dt className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="tnum mt-0.5 font-semibold">{children}</dd>
    </div>
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
