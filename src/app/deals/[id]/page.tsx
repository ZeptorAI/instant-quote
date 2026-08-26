import { notFound } from "next/navigation";
import { getDeal, getRates } from "@/lib/data";
import { SiteHeader } from "@/components/SiteHeader";
import { DealExperience } from "@/components/DealExperience";

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

  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <DealExperience deal={deal} rates={rates} />
      </main>
    </div>
  );
}
