import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const types = await db.discountType.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(types);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();
    const dt = await db.discountType.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        discountValue: parseFloat(data.discountValue),
        isPercentage: data.isPercentage ?? true,
        active: true,
      },
    });
    return NextResponse.json(dt, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
