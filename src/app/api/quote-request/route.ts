import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getDeal, getRates } from "@/lib/data";
import { computeEstimate } from "@/lib/estimator";
import { submitBodySchema } from "@/lib/validation";
import { makeRef } from "@/lib/ref";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let json: unknown;
  try { json = await req.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 }); }

  const parsed = submitBodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed.", issues: parsed.error.flatten() }, { status: 422 });
  }
  const body = parsed.data;

  const deal = await getDeal(body.deal_id);
  if (!deal) return NextResponse.json({ error: `Unknown deal: ${body.deal_id}` }, { status: 404 });
  const rates = await getRates();

  if (body.quantity < deal.moq) {
    return NextResponse.json({ error: `Quantity must be at least the MOQ of ${deal.moq}.` }, { status: 422 });
  }

  const site = body.logistics.site_requirements;
  const estimate = computeEstimate({
    listedUnitPrice: deal.listedUnitPrice,
    unitWeightLb: deal.unitWeightLb,
    quantity: body.quantity,
    postal: body.logistics.destination_postal_code,
    managedByGws: body.logistics.managed_by_gws,
    requiresLiftgate: site.requires_liftgate,
    hasLoadingDock: site.has_loading_dock,
    hasForklift: site.has_forklift,
    insurance: body.insurance,
  }, rates);

  const restrictedHit = body.sales_channels.filter((c) => deal.restrictedChannels.includes(c));
  const ref = makeRef();
  const payload = {
    buyer_id: body.buyer_id, deal_id: body.deal_id, sales_channels: body.sales_channels,
    quantity: body.quantity, logistics: body.logistics, purchase_frequency: body.purchase_frequency,
    budget_band: body.budget_band, insurance: body.insurance,
  };
  const forwarded = {
    ref, received_at: new Date().toISOString(), ...payload,
    estimate: { estLow: estimate.low, estHigh: estimate.high, perUnit: estimate.perUnit, total: estimate.total, lines: estimate.lines },
    restricted_channels_hit: restrictedHit,
  };

  // Persistence is optional for the prospect demo. Vercel/Netlify serverless hosts do not
  // provide a persistent local SQLite database, so return a successful quote even when the
  // DATABASE_URL is not configured. When a database is configured, requests are still saved.
  if (process.env.DATABASE_URL) {
    try {
      await prisma.quoteRequest.create({
        data: {
          ref, buyerId: body.buyer_id, buyerName: body.buyer_name?.trim() || body.buyer_id,
          dealId: body.deal_id, salesChannels: JSON.stringify(body.sales_channels), quantity: body.quantity,
          managedByGws: body.logistics.managed_by_gws, destinationPostalCode: body.logistics.destination_postal_code,
          hasLoadingDock: site.has_loading_dock, hasForklift: site.has_forklift, requiresLiftgate: site.requires_liftgate,
          purchaseFrequency: body.purchase_frequency, budgetBand: body.budget_band, insurance: body.insurance,
          estLow: estimate.low, estHigh: estimate.high, perUnit: estimate.perUnit,
          restrictedHit: JSON.stringify(restrictedHit), status: "New", payload: JSON.stringify(forwarded),
        },
      });
    } catch (error) {
      console.warn("[quote-request] Database unavailable; continuing as demo mode.", error);
    }
  }

  void forwardToWebhook(forwarded);
  return NextResponse.json({
    ok: true, ref, estLow: estimate.low, estHigh: estimate.high,
    perUnit: estimate.perUnit, perUnitLow: estimate.perUnitLow,
    perUnitHigh: estimate.perUnitHigh, restrictedHit,
  }, { status: 201 });
}

async function forwardToWebhook(payload: unknown) {
  const url = process.env.QUOTE_WEBHOOK_URL;
  if (!url || url.includes("your-uuid-here")) {
    console.warn("[quote-request] QUOTE_WEBHOOK_URL not configured; skipping forward.");
    return;
  }
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) console.error(`[quote-request] webhook responded ${res.status}`);
  } catch (err) { console.error("[quote-request] webhook forward failed:", err); }
}
