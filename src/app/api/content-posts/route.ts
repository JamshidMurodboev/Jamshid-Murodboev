import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateKeyToStoredDate } from "@/lib/content-digest";

export async function GET() {
  try {
    await requireAdmin();
    const posts = await db.contentPost.findMany({
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
    return NextResponse.json(posts);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();
    if (!data.date || !data.title || !data.body) {
      return NextResponse.json({ error: "date, title and body are required" }, { status: 400 });
    }
    const post = await db.contentPost.create({
      data: {
        date: dateKeyToStoredDate(String(data.date)),
        time: data.time || null,
        title: String(data.title),
        type: String(data.type || "Post"),
        format: String(data.format || "Text"),
        note: data.note || null,
        body: String(data.body),
      },
    });
    return NextResponse.json(post, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
