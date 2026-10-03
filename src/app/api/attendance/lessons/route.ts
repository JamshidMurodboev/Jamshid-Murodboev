import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    const lessons = await db.lesson.findMany({
      where: { batchId },
      orderBy: { order: "asc" },
    });
    return NextResponse.json(lessons);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdmin();
    const { batchId } = await req.json();
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    const existing = await db.lesson.findMany({ where: { batchId }, orderBy: { order: "asc" } });
    const nextNumber = existing.length + 1;
    const nextOrder = existing.length > 0 ? existing[existing.length - 1].order + 1 : 0;

    const lesson = await db.lesson.create({
      data: {
        batchId,
        number: nextNumber,
        title: null,
        order: nextOrder,
      },
    });
    void session;
    return NextResponse.json(lesson, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
