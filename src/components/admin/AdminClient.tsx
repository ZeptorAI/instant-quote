"use client";

import { useState } from "react";
import type { DealDTO, RatesDTO } from "@/lib/data";
import type { SalesChannel, PurchaseFrequency } from "@/lib/channels";
import { RequestFeed } from "./RequestFeed";
import { PricingControls } from "./PricingControls";

export interface RequestDTO {
  id: string;
  ref: string;
  createdAt: string;
  buyerId: string;
  buyerName: string;
  dealId: string;
  salesChannels: SalesChannel[];
  quantity: number;
  managedByGws: boolean;
  destinationPostalCode: string;
  hasLoadingDock: boolean;
  hasForklift: boolean;
  requiresLiftgate: boolean;
  purchaseFrequency: PurchaseFrequency | string;
  budgetBand: string;
  insurance: boolean;
  estLow: number;
  estHigh: number;
  perUnit: number;
  restrictedHit: SalesChannel[];
  status: string;
  payload: string;
}

type Tab = "requests" | "pricing";

export function AdminClient({
  requests,
  deal,
  rates,
}: {
  requests: RequestDTO[];
  deal: DealDTO;
  rates: RatesDTO;
}) {
  const [tab, setTab] = useState<Tab>("requests");

  return (
    <div className="mt-6">
      <div className="mb-4 inline-flex gap-1 rounded-xl border border-line bg-white/[0.02] p-1">
        <TabBtn active={tab === "requests"} onClick={() => setTab("requests")}>
          Requests
          <span className="ml-1.5 rounded-md bg-white/10 px-1.5 py-0.5 text-[11px]">
            {requests.length}
          </span>
        </TabBtn>
        <TabBtn active={tab === "pricing"} onClick={() => setTab("pricing")}>
          Pricing controls
        </TabBtn>
      </div>

      {tab === "requests" ? (
        <RequestFeed requests={requests} />
      ) : (
        <PricingControls deal={deal} rates={rates} />
      )}
    </div>
  );
}

function TabBtn({
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
      className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-blue/20 text-text shadow-[inset_0_0_0_1px_var(--blue)]"
          : "text-muted hover:text-text"
      }`}
    >
      {children}
    </button>
  );
}
