import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const scholarships = await db.scholarship.findMany({ orderBy: { name: "asc" } });
    return NextResponse.json(scholarships);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();
    const s = await db.scholarship.create({
      data: { name: data.name, shortCode: data.shortCode.toUpperCase(), active: true },
    });
    return NextResponse.json(s, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
