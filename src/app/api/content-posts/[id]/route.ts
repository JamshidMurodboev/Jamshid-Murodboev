import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateKeyToStoredDate } from "@/lib/content-digest";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();
    const post = await db.contentPost.update({
      where: { id },
      data: {
        ...(data.date ? { date: dateKeyToStoredDate(String(data.date)) } : {}),
        ...(data.time !== undefined ? { time: data.time || null } : {}),
        ...(data.title ? { title: String(data.title) } : {}),
        ...(data.type ? { type: String(data.type) } : {}),
        ...(data.format ? { format: String(data.format) } : {}),
        ...(data.body ? { body: String(data.body) } : {}),
      },
    });
    return NextResponse.json(post);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.contentPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
