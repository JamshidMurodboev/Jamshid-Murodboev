import { db } from "@/lib/db";
import { sendTelegramMessage } from "@/lib/telegram";

// Tashkent is UTC+5 all year (no daylight saving).
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

export const DIGEST_DEFAULTS = {
  enabled: "true",
  day: "6", // 0 = Sunday … 6 = Saturday
  time: "09:00", // HH:MM, Tashkent
};

const UZ_WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];
const UZ_MONTHS = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];

/** "Wall clock" in Tashkent, expressed as a Date whose UTC fields hold Tashkent values. */
export function tashkentNow(now: Date = new Date()): Date {
  return new Date(now.getTime() + TASHKENT_OFFSET_MS);
}

/** YYYY-MM-DD of the Tashkent calendar day. */
export function tashkentDateKey(now: Date = new Date()): string {
  return tashkentNow(now).toISOString().slice(0, 10);
}

/** Posts are stored at 00:00 UTC of their Tashkent calendar date. */
export function dateKeyToStoredDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

export function formatPostDay(date: Date): string {
  return `${UZ_WEEKDAYS[date.getUTCDay()]}, ${date.getUTCDate()}-${UZ_MONTHS[date.getUTCMonth()]}`;
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function getDigestSettings() {
  const rows = await db.appSetting.findMany({
    where: { key: { startsWith: "content_digest_" } },
  });
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return {
    enabled: (s.content_digest_enabled ?? DIGEST_DEFAULTS.enabled) === "true",
    day: parseInt(s.content_digest_day ?? DIGEST_DEFAULTS.day, 10),
    time: s.content_digest_time ?? DIGEST_DEFAULTS.time,
    lastSent: s.content_digest_last_sent ?? null,
  };
}

/** True when today (Tashkent) is the digest day, the chosen time has passed, and it hasn't gone out today. */
export function isDigestDue(
  settings: { enabled: boolean; day: number; time: string; lastSent: string | null },
  now: Date = new Date()
): boolean {
  if (!settings.enabled) return false;
  const t = tashkentNow(now);
  if (t.getUTCDay() !== settings.day) return false;
  const [h, m] = settings.time.split(":").map((x) => parseInt(x, 10));
  const minutesNow = t.getUTCHours() * 60 + t.getUTCMinutes();
  if (minutesNow < h * 60 + (m || 0)) return false;
  return settings.lastSent !== tashkentDateKey(now);
}

/** Posts scheduled from today (Tashkent) through the next 6 days. */
export async function getWeekPosts(now: Date = new Date()) {
  const start = dateKeyToStoredDate(tashkentDateKey(now));
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
  const posts = await db.contentPost.findMany({
    where: { date: { gte: start, lt: end } },
    orderBy: [{ date: "asc" }, { time: "asc" }],
  });
  return { posts, start, end };
}

function splitForTelegram(text: string, limit = 4000): string[] {
  if (text.length <= limit) return [text];
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > limit) {
    let cut = rest.lastIndexOf("\n", limit);
    if (cut < limit / 2) cut = limit;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut);
  }
  if (rest.trim()) chunks.push(rest);
  return chunks;
}

/** Builds the digest: one overview message, then one message per post with its full text. */
export async function buildDigestMessages(now: Date = new Date()): Promise<string[]> {
  const { posts, start, end } = await getWeekPosts(now);
  const last = new Date(end.getTime() - 24 * 60 * 60 * 1000);

  if (posts.length === 0) {
    return [
      `🗓 <b>Haftalik kontent reja</b> (${formatPostDay(start)} — ${formatPostDay(last)})\n\nBu hafta uchun rejalashtirilgan post yo'q.`,
    ];
  }

  const overview =
    `🗓 <b>Haftalik kontent reja</b> (${formatPostDay(start)} — ${formatPostDay(last)})\n` +
    `Jami: ${posts.length} ta post. Vaqtlar — Toshkent vaqti.\n\n` +
    posts
      .map(
        (p, i) =>
          `${i + 1}. <b>${formatPostDay(p.date)}, ${p.time ?? "webinar boshlanganda"}</b> — ${escapeHtml(p.title)}\n` +
          `    <i>${escapeHtml(p.type)} · ${escapeHtml(p.format)}</i>`
      )
      .join("\n") +
    `\n\n✏️ <code>[TO FILL]</code> belgilarini joylashdan oldin to'ldirishni unutmang.`;

  const perPost = posts.flatMap((p, i) => {
    const header =
      `📌 <b>${i + 1}/${posts.length} · ${formatPostDay(p.date)}, ${p.time ?? "webinar boshlanganda"}</b>\n` +
      `<i>${escapeHtml(p.type)} · ${escapeHtml(p.format)}</i> — ${escapeHtml(p.title)}\n\n`;
    return splitForTelegram(header + escapeHtml(p.body));
  });

  return [overview, ...perPost];
}

export async function getAdminChatIds(): Promise<string[]> {
  const admins = await db.user.findMany({
    where: { role: "ADMIN", telegramChatId: { not: null } },
    select: { telegramChatId: true },
  });
  return admins.map((a) => a.telegramChatId!).filter(Boolean);
}

/** Sends the digest to every admin with a Telegram chat ID. Messages go out in order. */
export async function sendDigest(chatIds: string[], now: Date = new Date()) {
  const messages = await buildDigestMessages(now);
  for (const chatId of chatIds) {
    for (const text of messages) {
      await sendTelegramMessage(chatId, text);
    }
  }
  return messages.length;
}
