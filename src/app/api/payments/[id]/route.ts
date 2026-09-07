import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

function computeStatus(due: number, paid: number, dueDate: Date): "PAID" | "PENDING" | "OVERDUE" {
  if (paid >= due) return "PAID";
  if (new Date() > dueDate) return "OVERDUE";
  return "PENDING";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    const data = await req.json();

    const existing = await db.payment.findUniqueOrThrow({ where: { id } });
    const amountDue = data.amountDue !== undefined ? parseFloat(data.amountDue) : existing.amountDue;
    const amountPaid = data.amountPaid !== undefined ? parseFloat(data.amountPaid) : existing.amountPaid;
    const dueDate = data.dueDate ? new Date(data.dueDate) : existing.dueDate;

    const payment = await db.payment.update({
      where: { id },
      data: {
        amountDue,
        amountPaid,
        dueDate,
        paidDate: data.paidDate !== undefined ? (data.paidDate ? new Date(data.paidDate) : null) : existing.paidDate,
        status: computeStatus(amountDue, amountPaid, dueDate),
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });
    return NextResponse.json(payment);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id } = await params;
    await db.payment.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
