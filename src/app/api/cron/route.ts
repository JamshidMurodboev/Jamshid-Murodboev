import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { broadcastToAdmins } from "@/lib/telegram";
import { formatDate, formatCurrency } from "@/lib/utils";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const settingsRows = await db.appSetting.findMany();
  const settings = Object.fromEntries(settingsRows.map((s) => [s.key, s.value]));

  const daysBefore = parseInt(settings.telegram_alert_days_before ?? "3", 10);

  const now = new Date();
  const alertDate = new Date(now);
  alertDate.setDate(alertDate.getDate() + daysBefore);

  // Fix: only fetch payments that haven't had a reminder sent yet
  const dueSoon = await db.payment.findMany({
    where: {
      status: "PENDING",
      dueDate: { gte: now, lte: alertDate },
      reminderSentAt: null,
    },
    include: { student: { select: { fullName: true } } },
  });

  // Mark overdue statuses first so the notification includes freshly-overdue payments
  await db.payment.updateMany({
    where: { status: "PENDING", dueDate: { lt: now } },
    data: { status: "OVERDUE" },
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

  const dailyMessages: string[] = [];

  if (dueSoon.length > 0) {
    const lines = dueSoon
      .map((p) => `• ${p.student.fullName}: <b>${formatCurrency(p.amountDue - p.amountPaid)}</b> due ${formatDate(p.dueDate)}`)
      .join("\n");
    dailyMessages.push(`🔔 <b>Payments due soon (within ${daysBefore} days):</b>\n${lines}`);

    // Mark reminders as sent
    await db.payment.updateMany({
      where: { id: { in: dueSoon.map((p) => p.id) } },
      data: { reminderSentAt: now },
    });
  }

  if (overdue.length > 0) {
    const lines = overdue
      .map((p) => `• ${p.student.fullName}: <b>${formatCurrency(p.amountDue - p.amountPaid)}</b> (due ${formatDate(p.dueDate)})`)
      .join("\n");
    dailyMessages.push(`🚨 <b>Overdue payments (${overdue.length}):</b>\n${lines}`);
  }

  if (chatIds.length > 0 && dailyMessages.length > 0) {
    await broadcastToAdmins(chatIds, dailyMessages.join("\n\n"));
  }

  // Weekly summary check
  const weeklyEnabled = settings.weekly_summary_enabled === "true";
  let weeklySent = false;

  if (weeklyEnabled && chatIds.length > 0) {
    const summaryDay = parseInt(settings.weekly_summary_day ?? "1", 10); // 0=Sun, 1=Mon
    const nowDay = now.getDay();

    // Fire if today matches the configured day (cron runs once daily so no time check needed)
    if (nowDay === summaryDay) {
      const allPending = await db.payment.findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        include: { student: { select: { fullName: true } } },
        orderBy: { dueDate: "asc" },
      });

      if (allPending.length > 0) {
        const lines = allPending
          .map((p) => {
            const icon = p.status === "OVERDUE" ? "🚨" : "📅";
            const remaining = formatCurrency(p.amountDue - p.amountPaid);
            return `${icon} ${p.student.fullName}: <b>${remaining}</b> — ${p.status === "OVERDUE" ? "OVERDUE" : `due ${formatDate(p.dueDate)}`}`;
          })
          .join("\n");
        const summary = `📊 <b>Weekly Payment Summary (${allPending.length} pending):</b>\n\n${lines}`;
        await broadcastToAdmins(chatIds, summary);
        weeklySent = true;
      }
    }
  }

  return NextResponse.json({
    sent: chatIds.length,
    dueSoon: dueSoon.length,
    overdue: overdue.length,
    weeklySent,
  });
}
