import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const student = await db.student.findUnique({
      where: { id },
      include: {
        batch: true,
        package: true,
        progressStage: true,
        discountType: true,
        scholarships: { include: { scholarship: true } },
        payments: { orderBy: { dueDate: "asc" } },
        createdBy: { select: { name: true } },
        updatedBy: { select: { name: true } },
      },
    });
    if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const data = await req.json();

    const student = await db.student.update({
      where: { id },
      data: {
        fullName: data.fullName,
        dob: data.dob !== undefined ? (data.dob ? new Date(data.dob) : null) : undefined,
        phone: data.phone,
        batchId: data.batchId,
        packageId: data.packageId ?? null,
        joiningDate: data.joiningDate ? new Date(data.joiningDate) : undefined,
        major: data.major,
        degree: data.degree ?? null,
        priceCharged: data.priceCharged !== undefined ? parseFloat(data.priceCharged) : undefined,
        discountTypeId: data.discountTypeId ?? null,
        progressStageId: data.progressStageId ?? null,
        finalResult: data.finalResult,
        documentLinks: data.documentLinks,
        notes: data.notes,
        archived: data.archived,
        updatedById: session.userId,
        ...(data.scholarshipIds !== undefined && {
          scholarships: {
            deleteMany: {},
            create: data.scholarshipIds.map((sid: string) => ({ scholarshipId: sid })),
          },
        }),
      },
      include: {
        batch: { select: { id: true, name: true } },
        package: true,
        progressStage: true,
        discountType: true,
        scholarships: { include: { scholarship: true } },
        payments: { orderBy: { dueDate: "asc" } },
      },
    });
    return NextResponse.json(student);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await db.student.update({ where: { id }, data: { archived: true } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to archive" }, { status: 500 });
  }
}
