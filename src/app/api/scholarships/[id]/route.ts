import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const s = await db.scholarship.update({
      where: { id },
      data: {
        name: data.name,
        shortCode: data.shortCode?.toUpperCase(),
        active: data.active,
      },
    });
    return NextResponse.json(s);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.scholarship.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to deactivate" }, { status: 500 });
  }
}
