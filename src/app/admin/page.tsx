import { prisma } from "@/lib/prisma";
import { getDeal, getRates } from "@/lib/data";
import { DEFAULT_DEAL } from "@/lib/defaults";
import { SiteHeader } from "@/components/SiteHeader";
import { AdminClient, type RequestDTO } from "@/components/admin/AdminClient";
import { money, num } from "@/lib/format";
import type { SalesChannel } from "@/lib/channels";

export const dynamic = "force-dynamic";

function parseArr(json: string): string[] {
  try {
    const a = JSON.parse(json);
    return Array.isArray(a) ? a : [];
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const [rows, deal, rates] = await Promise.all([
    prisma.quoteRequest.findMany({ orderBy: { createdAt: "desc" } }),
    getDeal(DEFAULT_DEAL.id),
    getRates(),
  ]);

  const requests: RequestDTO[] = rows.map((r) => ({
    id: r.id,
    ref: r.ref,
    createdAt: r.createdAt.toISOString(),
    buyerId: r.buyerId,
    buyerName: r.buyerName,
    dealId: r.dealId,
    salesChannels: parseArr(r.salesChannels) as SalesChannel[],
    quantity: r.quantity,
    managedByGws: r.managedByGws,
    destinationPostalCode: r.destinationPostalCode,
    hasLoadingDock: r.hasLoadingDock,
    hasForklift: r.hasForklift,
    requiresLiftgate: r.requiresLiftgate,
    purchaseFrequency: r.purchaseFrequency,
    budgetBand: r.budgetBand,
    insurance: r.insurance,
    estLow: r.estLow,
    estHigh: r.estHigh,
    perUnit: r.perUnit,
    restrictedHit: parseArr(r.restrictedHit) as SalesChannel[],
    status: r.status,
    payload: r.payload,
  }));

  // --- stats ---
  const total = requests.length;
  const pipeline = requests.reduce((s, r) => s + (r.estLow + r.estHigh) / 2, 0);
  const avgQty =
    total > 0
      ? Math.round(requests.reduce((s, r) => s + r.quantity, 0) / total)
      : 0;
  const recurringBuyers = new Set(
    requests.filter((r) => r.purchaseFrequency === "Recurring").map((r) => r.buyerId)
  ).size;

  return (
    <div className="min-h-screen">
      <SiteHeader admin />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-2xl font-extrabold">
              Admin portal
            </h1>
            <p className="text-sm text-muted">
              Incoming pricing requests and the live pricing engine.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total requests" value={num(total)} accent="blue" />
          <StatCard
            label="Pipeline value"
            value={money(pipeline)}
            accent="green"
            hint="Σ range midpoints"
          />
          <StatCard label="Avg order qty" value={num(avgQty)} accent="cyan" />
          <StatCard
            label="Recurring buyers"
            value={num(recurringBuyers)}
            accent="amber"
          />
        </div>

        {deal ? (
          <AdminClient requests={requests} deal={deal} rates={rates} />
        ) : (
          <p className="mt-6 text-sm text-amber">
            No deal found. Run <code>npm run db:seed</code>.
          </p>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: string;
  accent: "blue" | "green" | "cyan" | "amber";
  hint?: string;
}) {
  const ring = {
    blue: "border-blue/30",
    green: "border-green/30",
    cyan: "border-cyan/30",
    amber: "border-amber/30",
  }[accent];
  const text = {
    blue: "text-blue",
    green: "text-green",
    cyan: "text-cyan",
    amber: "text-amber",
  }[accent];
  return (
    <div className={`card p-4 ${ring}`}>
      <div className="text-[11px] uppercase tracking-wider text-muted">
        {label}
      </div>
      <div className={`tnum mt-1 font-display text-2xl font-extrabold ${text}`}>
        {value}
      </div>
      {hint && <div className="mt-0.5 text-[10px] text-muted">{hint}</div>}
    </div>
  );
}
