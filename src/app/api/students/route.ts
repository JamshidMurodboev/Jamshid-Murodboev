import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    const stage = searchParams.get("stage");
    const search = searchParams.get("search");

    const students = await db.student.findMany({
      where: {
        archived: false,
        ...(batchId && { batchId }),
        ...(stage && { progressStageId: stage }),
        ...(search && {
          fullName: { contains: search, mode: "insensitive" },
        }),
      },
      include: {
        batch: { select: { id: true, name: true } },
        package: { select: { id: true, name: true, listPrice: true } },
        progressStage: true,
        discountType: true,
        scholarships: { include: { scholarship: true } },
        payments: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(students);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireSession();
    const data = await req.json();

    const priceCharged = data.priceCharged ? parseFloat(data.priceCharged) : null;

    const student = await db.$transaction(async (tx) => {
      const s = await tx.student.create({
        data: {
          fullName: data.fullName,
          dob: data.dob ? new Date(data.dob) : null,
          phone: data.phone ?? null,
          batchId: data.batchId,
          packageId: data.packageId ?? null,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          major: data.major ?? null,
          degree: data.degree ?? null,
          priceCharged,
          priceCurrency: data.priceCurrency ?? "UZS",
          priceOriginalAmount: data.priceOriginalAmount ? parseFloat(data.priceOriginalAmount) : null,
          discountTypeId: data.discountTypeId ?? null,
          progressStageId: data.progressStageId ?? null,
          finalResult: data.finalResult ?? "PENDING",
          documentLinks: data.documentLinks ?? [],
          notes: data.notes ?? null,
          createdById: session.userId,
          updatedById: session.userId,
          ...(data.scholarshipIds?.length && {
            scholarships: {
              create: data.scholarshipIds.map((id: string) => ({ scholarshipId: id })),
            },
          }),
        },
        include: {
          batch: { select: { id: true, name: true } },
          package: true,
          progressStage: true,
          discountType: true,
          scholarships: { include: { scholarship: true } },
          payments: true,
        },
      });

      if (data.paidInFull && priceCharged && priceCharged > 0 && data.paymentDate) {
        const pd = new Date(data.paymentDate);
        await tx.payment.create({
          data: {
            studentId: s.id,
            amountDue: priceCharged,
            amountPaid: priceCharged,
            dueDate: pd,
            paidDate: pd,
            status: "PAID",
            notes: data.paymentNotes ?? null,
          },
        });
        // Re-fetch with the new payment included
        return tx.student.findUniqueOrThrow({
          where: { id: s.id },
          include: {
            batch: { select: { id: true, name: true } },
            package: true,
            progressStage: true,
            discountType: true,
            scholarships: { include: { scholarship: true } },
            payments: true,
          },
        });
      }

      return s;
    });

    return NextResponse.json(student, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create student" }, { status: 500 });
  }
}
