import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");

    const studentFilter = {
      archived: false,
      ...(batchId && batchId !== "all" ? { batchId } : {}),
    };

    const [students, payments, batches] = await Promise.all([
      db.student.findMany({
        where: studentFilter,
        include: {
          package: true,
          payments: true,
        },
      }),
      db.payment.findMany({
        where: {
          student: studentFilter,
        },
      }),
      db.batch.findMany({ orderBy: { startDate: "desc" } }),
    ]);

    const totalExpected = payments.reduce((sum, p) => sum + p.amountDue, 0);
    const totalCollected = payments.reduce((sum, p) => sum + p.amountPaid, 0);

    const paymentStatusBreakdown = {
      paid: payments.filter((p) => p.status === "PAID").length,
      pending: payments.filter((p) => p.status === "PENDING").length,
      overdue: payments.filter((p) => p.status === "OVERDUE").length,
    };

    const studentsWithResult = students.filter((s) => s.finalResult !== "PENDING");
    const won = students.filter((s) => s.finalResult === "WON").length;
    const winRate = studentsWithResult.length > 0
      ? Math.round((won / studentsWithResult.length) * 100)
      : null;

    const packageBreakdown = students.reduce(
      (acc, s) => {
        const name = s.package?.name ?? "No Package";
        acc[name] = (acc[name] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return NextResponse.json({
      totalStudents: students.length,
      totalExpected,
      totalCollected,
      outstanding: totalExpected - totalCollected,
      paymentStatusBreakdown,
      winRate,
      studentsWithResult: studentsWithResult.length,
      won,
      packageBreakdown,
      batches,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
