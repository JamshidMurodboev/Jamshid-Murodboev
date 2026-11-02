import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { computeStatus } from "@/lib/payment-utils";

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string; instId: string }> }
) {
  try {
    await requireSession();
    const { id: paymentId, instId } = await params;

    await db.installment.delete({ where: { id: instId } });

    // Recompute amountPaid
    const allInstallments = await db.installment.findMany({ where: { paymentId } });
    const totalPaid = allInstallments.reduce((sum, i) => sum + i.amount, 0);

    const payment = await db.payment.findUniqueOrThrow({ where: { id: paymentId } });
    const lastPaidDate =
      allInstallments.length > 0
        ? allInstallments.sort((a, b) => b.paidDate.getTime() - a.paidDate.getTime())[0].paidDate
        : null;

    const updated = await db.payment.update({
      where: { id: paymentId },
      data: {
        amountPaid: totalPaid,
        paidDate: totalPaid >= payment.amountDue ? lastPaidDate : null,
        status: computeStatus(payment.amountDue, totalPaid, payment.dueDate),
      },
      include: { installments: { orderBy: { paidDate: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete installment" }, { status: 500 });
  }
}
