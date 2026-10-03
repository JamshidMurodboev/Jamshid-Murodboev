import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const freeWhere = {
      archived: false,
      ...(studentId ? { id: studentId } : {}),
      OR: [{ priceCharged: 0 }, { priceCharged: null }] as { priceCharged: number | null }[],
      payments: { none: {} },
    };

    const studentInclude = {
      batch: { select: { id: true, name: true } },
      package: { select: { id: true, name: true } },
      discountType: { select: { id: true, name: true, discountValue: true, isPercentage: true } },
      scholarships: {
        select: { scholarship: { select: { id: true, name: true, shortCode: true } } },
      },
    };

    // FREE-only filter
    if (status === "FREE") {
      const freeStudents = await db.student.findMany({
        where: freeWhere,
        select: { id: true, fullName: true, priceCharged: true, ...studentInclude },
        orderBy: { fullName: "asc" },
      });
      return NextResponse.json(freeStudents.map(toFreeRow));
    }

    // Real payment rows
    const payments = await db.payment.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
        ...(status && status !== "all" ? { status: status as "PENDING" | "PAID" | "OVERDUE" } : {}),
        student: { archived: false },
      },
      include: {
        student: { select: { id: true, fullName: true, priceCharged: true, ...studentInclude } },
      },
      orderBy: { dueDate: "asc" },
    });

    const paymentRows = payments.map((p) => ({ ...p, type: "payment" as const }));

    // Include free-seat rows when fetching all
    if (!status || status === "all") {
      const freeStudents = await db.student.findMany({
        where: freeWhere,
        select: { id: true, fullName: true, priceCharged: true, ...studentInclude },
        orderBy: { fullName: "asc" },
      });
      return NextResponse.json([...paymentRows, ...freeStudents.map(toFreeRow)]);
    }

    return NextResponse.json(paymentRows);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

function toFreeRow(s: {
  id: string;
  fullName: string;
  priceCharged: number | null;
  batch: { id: string; name: string };
  package: { id: string; name: string } | null;
  discountType: { id: string; name: string; discountValue: number; isPercentage: boolean } | null;
  scholarships: { scholarship: { id: string; name: string; shortCode: string } }[];
}) {
  return {
    id: `free-${s.id}`,
    type: "free" as const,
    amountDue: 0,
    amountPaid: 0,
    dueDate: null,
    paidDate: null,
    status: "FREE" as const,
    notes: null,
    student: s,
  };
}

export async function POST(req: Request) {
  try {
    await requireSession();
    const data = await req.json();

    const payment = await db.payment.create({
      data: {
        studentId: data.studentId,
        amountDue: parseFloat(data.amountDue),
        dueDate: new Date(data.dueDate),
        amountPaid: parseFloat(data.amountPaid ?? 0),
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
        status: computeStatus(parseFloat(data.amountDue), parseFloat(data.amountPaid ?? 0), new Date(data.dueDate)),
        notes: data.notes ?? null,
      },
      include: { student: { select: { id: true, fullName: true } } },
    });
    return NextResponse.json(payment, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create payment" }, { status: 500 });
  }
}

function computeStatus(due: number, paid: number, dueDate: Date): "PAID" | "PENDING" | "OVERDUE" {
  if (paid >= due) return "PAID";
  if (new Date() > dueDate) return "OVERDUE";
  return "PENDING";
}
