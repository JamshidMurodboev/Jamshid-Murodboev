import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminChatIds, sendDigest, buildDailyMessages, sendMessages } from "@/lib/content-digest";

// Sends the weekly digest (default) or today's posts (?mode=daily) right now,
// without affecting the schedule.
export async function POST(req: Request) {
  try {
    await requireAdmin();
    const chatIds = await getAdminChatIds();
    if (chatIds.length === 0) {
      return NextResponse.json(
        { error: "No admin has a Telegram chat ID. Add it in Settings → Users." },
        { status: 400 }
      );
    }
    const mode = new URL(req.url).searchParams.get("mode");
    if (mode === "daily") {
      const messages = await buildDailyMessages();
      if (messages.length === 0) {
        return NextResponse.json({ error: "Bugun uchun post yo'q" }, { status: 400 });
      }
      await sendMessages(chatIds, messages);
      return NextResponse.json({ recipients: chatIds.length, messages: messages.length });
    }
    const messages = await sendDigest(chatIds);
    return NextResponse.json({ recipients: chatIds.length, messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
