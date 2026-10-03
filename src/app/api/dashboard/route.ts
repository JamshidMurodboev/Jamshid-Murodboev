import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function GET() {
  try {
    await requireSession();

    const [batches, students, payments] = await Promise.all([
      db.batch.findMany({ orderBy: { startDate: "desc" } }),
      db.student.findMany({
        where: { archived: false },
        select: { id: true, batchId: true, package: true, finalResult: true },
      }),
      db.payment.findMany({
        where: { student: { archived: false } },
        select: { studentId: true, amountDue: true, amountPaid: true, status: true,
          student: { select: { batchId: true } } },
      }),
    ]);

    // Per-batch revenue
    const batchRevenue = batches.map((b) => {
      const batchPayments = payments.filter((p) => p.student.batchId === b.id);
      const due = batchPayments.reduce((s, p) => s + p.amountDue, 0);
      const collected = batchPayments.reduce((s, p) => s + p.amountPaid, 0);
      const studentCount = students.filter((s) => s.batchId === b.id).length;
      return {
        id: b.id,
        name: b.name,
        status: b.status,
        studentCount,
        due,
        collected,
        outstanding: due - collected,
        rate: due > 0 ? Math.round((collected / due) * 100) : null,
      };
    });

    const totalDue = payments.reduce((s, p) => s + p.amountDue, 0);
    const totalCollected = payments.reduce((s, p) => s + p.amountPaid, 0);

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
      totalDue,
      totalCollected,
      outstanding: totalDue - totalCollected,
      paymentStatusBreakdown,
      winRate,
      studentsWithResult: studentsWithResult.length,
      won,
      packageBreakdown,
      batchRevenue,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
