const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API_BASE = `https://api.telegram.org/bot${BOT_TOKEN}`;

export async function sendTelegramMessage(chatId: string, text: string) {
  if (!BOT_TOKEN) {
    console.warn("TELEGRAM_BOT_TOKEN not set — skipping notification");
    return;
  }
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  if (!res.ok) {
    console.error("Telegram send failed:", await res.text());
  }
}

export async function broadcastToAdmins(chatIds: string[], text: string) {
  await Promise.allSettled(chatIds.map((id) => sendTelegramMessage(id, text)));
}
