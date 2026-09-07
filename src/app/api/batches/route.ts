import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();
    const batches = await db.batch.findMany({
      include: {
        scholarships: { include: { scholarship: true } },
        packages: true,
        _count: { select: { students: { where: { archived: false } } } },
      },
      orderBy: { startDate: "desc" },
    });
    return NextResponse.json(batches);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    await requireSession();
    const data = await req.json();
    const batch = await db.batch.create({
      data: {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status ?? "ACTIVE",
        notes: data.notes ?? null,
        scholarships: data.scholarshipIds?.length
          ? { create: data.scholarshipIds.map((id: string) => ({ scholarshipId: id })) }
          : undefined,
      },
      include: { scholarships: { include: { scholarship: true } }, packages: true },
    });
    return NextResponse.json(batch, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create batch" }, { status: 500 });
  }
}
