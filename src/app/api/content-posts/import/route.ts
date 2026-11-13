import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { dateKeyToStoredDate } from "@/lib/content-digest";
import { CONTENT_PLAN_NOV_2026 } from "@/data/content-plan-2026-11";

// Loads the 14 Nov – 13 Dec 2026 plan. Safe to run more than once: posts are
// matched by key and updated in place.
export async function POST() {
  try {
    await requireAdmin();
    for (const p of CONTENT_PLAN_NOV_2026) {
      const data = {
        date: dateKeyToStoredDate(p.date),
        time: p.time,
        title: p.title,
        type: p.type,
        format: p.format,
        note: p.note || null,
        body: p.body,
      };
      await db.contentPost.upsert({
        where: { key: `nov2026-${p.key}` },
        update: data,
        create: { key: `nov2026-${p.key}`, ...data },
      });
    }
    return NextResponse.json({ imported: CONTENT_PLAN_NOV_2026.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to import" }, { status: 500 });
  }
}
