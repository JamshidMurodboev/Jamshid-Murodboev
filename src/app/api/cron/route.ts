import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broadcastToAdmins } from "@/lib/telegram";
import { formatDate, formatCurrency } from "@/lib/utils";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const setting = await db.appSetting.findUnique({ where: { key: "telegram_alert_days_before" } });
  const daysBefore = parseInt(setting?.value ?? "3", 10);

  const now = new Date();
  const alertDate = new Date(now);
  alertDate.setDate(alertDate.getDate() + daysBefore);

  const dueSoon = await db.payment.findMany({
    where: {
      status: "PENDING",
      dueDate: { gte: now, lte: alertDate },
    },
    include: { student: { select: { fullName: true } } },
  });

  const overdue = await db.payment.findMany({
    where: { status: "OVERDUE" },
    include: { student: { select: { fullName: true } } },
  });

  const users = await db.user.findMany({
    where: { telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  const chatIds = users.map((u) => u.telegramChatId!);

  if (chatIds.length === 0) {
    return NextResponse.json({ sent: 0, note: "No telegram chat IDs configured" });
  }

  const messages: string[] = [];

  if (dueSoon.length > 0) {
    const lines = dueSoon
      .map((p) => `• ${p.student.fullName}: <b>${formatCurrency(p.amountDue - p.amountPaid)}</b> due ${formatDate(p.dueDate)}`)
      .join("\n");
    messages.push(`🔔 <b>Payments due in ${daysBefore} days:</b>\n${lines}`);
  }

  if (overdue.length > 0) {
    const lines = overdue
      .map((p) => `• ${p.student.fullName}: <b>${formatCurrency(p.amountDue - p.amountPaid)}</b> (due ${formatDate(p.dueDate)})`)
      .join("\n");
    messages.push(`🚨 <b>Overdue payments (${overdue.length}):</b>\n${lines}`);
  }

  if (messages.length === 0) {
    return NextResponse.json({ sent: 0, note: "Nothing to report" });
  }

  const text = messages.join("\n\n");
  await broadcastToAdmins(chatIds, text);

  // Update overdue statuses
  await db.payment.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
  });

  return NextResponse.json({ sent: chatIds.length, dueSoon: dueSoon.length, overdue: overdue.length });
}
