import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const data = await req.json();
    const pkg = await db.package.update({
      where: { id },
      data: {
        name: data.name,
        listPrice: data.listPrice !== undefined ? parseFloat(data.listPrice) : undefined,
        earlyBirdPrice: data.earlyBirdPrice !== undefined ? parseFloat(data.earlyBirdPrice) : undefined,
        description: data.description,
      },
    });
    return NextResponse.json(pkg);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await db.package.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
