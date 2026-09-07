import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId");
    const status = searchParams.get("status");

    const payments = await db.payment.findMany({
      where: {
        ...(studentId && { studentId }),
        ...(status && { status: status as "PENDING" | "PAID" | "OVERDUE" }),
      },
      include: {
        student: {
          select: {
            id: true,
            fullName: true,
            batch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { dueDate: "asc" },
    });
    return NextResponse.json(payments);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
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
