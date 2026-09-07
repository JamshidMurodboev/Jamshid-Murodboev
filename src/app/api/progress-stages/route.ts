import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const stages = await db.progressStage.findMany({ orderBy: { order: "asc" } });
    return NextResponse.json(stages);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();
    const maxOrder = await db.progressStage.aggregate({ _max: { order: true } });
    const stage = await db.progressStage.create({
      data: { name: data.name, order: (maxOrder._max.order ?? -1) + 1 },
    });
    return NextResponse.json(stage, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const data: { id: string; order: number }[] = await req.json();
    await Promise.all(
      data.map(({ id, order }) => db.progressStage.update({ where: { id }, data: { order } }))
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to reorder" }, { status: 500 });
  }
}
