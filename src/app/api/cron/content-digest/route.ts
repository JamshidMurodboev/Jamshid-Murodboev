import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDigestSettings,
  getDailySettings,
  isDigestDue,
  getAdminChatIds,
  sendDigest,
  buildDailyMessages,
  sendMessages,
  tashkentDateKey,
} from "@/lib/content-digest";

// Runs once a day at 04:00 UTC = 07:00 Istanbul = 09:00 Tashkent (see vercel.json;
// Vercel Hobby only allows daily cron jobs). It does two things:
//  1. Daily reminder: today's posts with full text (skipped on days the weekly
//     digest goes out, since that already contains them).
//  2. Weekly digest: the next 7 days, on the chosen weekday after the chosen time.
// The endpoint can also be called hourly by an external scheduler with the same CRON_SECRET.
async function markSent(key: string, value: string) {
  await db.appSetting.upsert({ where: { key }, update: { value }, create: { key, value } });
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const today = tashkentDateKey(now);
  const chatIds = await getAdminChatIds();
  if (chatIds.length === 0) {
    return NextResponse.json({ sent: false, reason: "no admin Telegram chat IDs" });
  }

  const result: Record<string, unknown> = {};

  const weekly = await getDigestSettings();
  const weeklyDue = isDigestDue(weekly, now);
  if (weeklyDue) {
    await markSent("content_digest_last_sent", today); // mark first so overlapping runs can't double-send
    result.weekly = await sendDigest(chatIds, now);
  }

  const daily = await getDailySettings();
  if (daily.enabled && daily.lastSent !== today && !weeklyDue) {
    const messages = await buildDailyMessages(now);
    await markSent("content_daily_last_sent", today);
    if (messages.length > 0) {
      await sendMessages(chatIds, messages);
      result.daily = messages.length;
    } else {
      result.daily = "no posts today";
    }
  }

  return NextResponse.json({ sent: true, ...result });
}
