import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const batch = await db.batch.findUnique({
      where: { id },
      include: {
        scholarships: { include: { scholarship: true } },
        packages: true,
        students: {
          where: { archived: false },
          include: {
            package: true,
            progressStage: true,
            discountType: true,
            scholarships: { include: { scholarship: true } },
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!batch) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(batch);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const data = await req.json();

    const batch = await db.batch.update({
      where: { id },
      data: {
        name: data.name,
        startDate: data.startDate ? new Date(data.startDate) : undefined,
        endDate: data.endDate ? new Date(data.endDate) : null,
        status: data.status,
        notes: data.notes,
        ...(data.scholarshipIds !== undefined && {
          scholarships: {
            deleteMany: {},
            create: data.scholarshipIds.map((sid: string) => ({ scholarshipId: sid })),
          },
        }),
      },
      include: { scholarships: { include: { scholarship: true } }, packages: true },
    });
    return NextResponse.json(batch);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await db.batch.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
