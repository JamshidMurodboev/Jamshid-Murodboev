import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { getAdminChatIds, sendDigest } from "@/lib/content-digest";

// Sends this week's digest right now, without affecting the weekly schedule.
export async function POST() {
  try {
    await requireAdmin();
    const chatIds = await getAdminChatIds();
    if (chatIds.length === 0) {
      return NextResponse.json(
        { error: "No admin has a Telegram chat ID. Add it in Settings → Users." },
        { status: 400 }
      );
    }
    const messages = await sendDigest(chatIds);
    return NextResponse.json({ recipients: chatIds.length, messages });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
