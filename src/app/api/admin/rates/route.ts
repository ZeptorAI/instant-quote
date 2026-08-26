import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ratesUpdateSchema } from "@/lib/validation";
import { DEFAULT_RATES } from "@/lib/defaults";

export const runtime = "nodejs";

// Update the single Rates config row.
export async function PUT(req: NextRequest) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = ratesUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }

  const updated = await prisma.rates.upsert({
    where: { id: "default" },
    update: { ...parsed.data },
    create: { id: "default", ...parsed.data },
  });
  return NextResponse.json({ ok: true, id: updated.id });
}

// Reset the Rates row to defaults.
export async function POST() {
  const updated = await prisma.rates.upsert({
    where: { id: "default" },
    update: { ...DEFAULT_RATES },
    create: { id: "default", ...DEFAULT_RATES },
  });
  return NextResponse.json({ ok: true, id: updated.id, reset: true });
}
