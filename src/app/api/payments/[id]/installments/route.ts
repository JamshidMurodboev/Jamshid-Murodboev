import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { computeStatus } from "@/lib/payment-utils";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireSession();
    const { id: paymentId } = await params;
    const data = await req.json();

    await db.installment.create({
      data: {
        paymentId,
        amount: parseFloat(data.amount),
        paidDate: new Date(data.paidDate),
        notes: data.notes ?? null,
      },
    });

    // Recompute amountPaid from all installments
    const allInstallments = await db.installment.findMany({ where: { paymentId } });
    const totalPaid = allInstallments.reduce((sum, i) => sum + i.amount, 0);

    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const lastPaidDate = allInstallments
      .map((i) => i.paidDate)
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        amountPaid: totalPaid,
        paidDate: totalPaid >= payment.amountDue ? lastPaidDate : null,
        status: computeStatus(payment.amountDue, totalPaid, payment.dueDate),
      },
      include: { installments: { orderBy: { paidDate: "asc" } } },
    });

    return NextResponse.json(updated, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to add installment" }, { status: 500 });
  }
}
