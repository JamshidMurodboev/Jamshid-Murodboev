import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getDigestSettings,
  isDigestDue,
  getAdminChatIds,
  sendDigest,
  tashkentDateKey,
} from "@/lib/content-digest";

// Runs once a day at 04:00 UTC = 09:00 Tashkent (see vercel.json; Vercel Hobby
// only allows daily cron jobs). Sends the weekly content digest once, on the
// chosen weekday, at the first run after the chosen Tashkent time. The endpoint
// can also be called hourly by an external scheduler with the same CRON_SECRET.
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const settings = await getDigestSettings();
  if (!isDigestDue(settings, now)) {
    return NextResponse.json({ sent: false, reason: "not due" });
  }

  const chatIds = await getAdminChatIds();
  if (chatIds.length === 0) {
    return NextResponse.json({ sent: false, reason: "no admin Telegram chat IDs" });
  }

  // Mark first so an overlapping run can't send twice.
  await db.appSetting.upsert({
    where: { key: "content_digest_last_sent" },
    update: { value: tashkentDateKey(now) },
    create: { key: "content_digest_last_sent", value: tashkentDateKey(now) },
  });

  const messages = await sendDigest(chatIds, now);
  return NextResponse.json({ sent: true, recipients: chatIds.length, messages });
}
