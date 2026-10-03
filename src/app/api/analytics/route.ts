import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await requireSession();

    const [payments, students] = await Promise.all([
      db.payment.findMany({
        include: {
          student: {
            select: {
              batch: { select: { id: true, name: true } },
              package: { select: { name: true } },
            },
          },
        },
      }),
      db.student.findMany({
        where: { archived: false },
        include: {
          progressStage: { select: { name: true } },
          package: { select: { name: true } },
        },
      }),
    ]);

    const totalDue = payments.reduce((s, p) => s + p.amountDue, 0);
    const totalPaid = payments.reduce((s, p) => s + p.amountPaid, 0);
    const overdueCount = payments.filter((p) => p.status === "OVERDUE").length;

    // Revenue by batch
    const batchMap: Record<string, { name: string; due: number; paid: number }> = {};
    for (const p of payments) {
      const name = p.student.batch.name;
      if (!batchMap[name]) batchMap[name] = { name, due: 0, paid: 0 };
      batchMap[name].due += p.amountDue;
      batchMap[name].paid += p.amountPaid;
    }

    // Revenue by month
    const monthMap: Record<string, { month: string; due: number; paid: number }> = {};
    for (const p of payments) {
      const month = new Date(p.dueDate).toISOString().slice(0, 7);
      if (!monthMap[month]) monthMap[month] = { month, due: 0, paid: 0 };
      monthMap[month].due += p.amountDue;
      monthMap[month].paid += p.amountPaid;
    }

    // Revenue by package
    const pkgMap: Record<string, number> = {};
    for (const p of payments) {
      const name = p.student.package?.name ?? "No Package";
      pkgMap[name] = (pkgMap[name] ?? 0) + p.amountPaid;
    }

    // Students by stage
    const stageMap: Record<string, number> = {};
    for (const s of students) {
      const name = s.progressStage?.name ?? "No Stage";
      stageMap[name] = (stageMap[name] ?? 0) + 1;
    }

    // Payment status breakdown
    const statusCounts = { PAID: 0, PENDING: 0, OVERDUE: 0 };
    for (const p of payments) {
      statusCounts[p.status as keyof typeof statusCounts]++;
    }

    return NextResponse.json({
      totalDue,
      totalPaid,
      totalOutstanding: totalDue - totalPaid,
      collectionRate: totalDue > 0 ? Math.round((totalPaid / totalDue) * 100) : 0,
      overdueCount,
      totalStudents: students.length,
      revenueByBatch: Object.values(batchMap)
        .sort((a, b) => b.paid - a.paid)
        .slice(0, 10),
      revenueByMonth: Object.values(monthMap)
        .sort((a, b) => a.month.localeCompare(b.month))
        .slice(-12),
      revenueByPackage: Object.entries(pkgMap)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      studentsByStage: Object.entries(stageMap)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count),
      paymentStatus: Object.entries(statusCounts).map(([name, value]) => ({ name, value })),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
