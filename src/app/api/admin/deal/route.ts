import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { dealUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

// Update the Deal (pricing controls). Query/body carries the deal id.
export async function PUT(req: NextRequest) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing deal id." }, { status: 400 });
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON." }, { status: 400 });
  }

  const parsed = dealUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", issues: parsed.error.flatten() },
      { status: 422 }
    );
  }
  const d = parsed.data;

  try {
    const updated = await prisma.deal.update({
      where: { id },
      data: {
        name: d.name,
        category: d.category,
        condition: d.condition,
        listedUnitPrice: d.listedUnitPrice,
        retailRef: d.retailRef,
        unit: d.unit,
        unitsPerPallet: d.unitsPerPallet,
        moq: d.moq,
        unitWeightLb: d.unitWeightLb,
        restrictedChannels: JSON.stringify(d.restrictedChannels),
        imageEmoji: d.imageEmoji,
      },
    });
    return NextResponse.json({ ok: true, id: updated.id });
  } catch {
    return NextResponse.json({ error: "Deal not found." }, { status: 404 });
  }
}
