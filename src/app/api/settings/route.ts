import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const settings = await db.appSetting.findMany();
    const result = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(req: Request) {
  try {
    await requireAdmin();
    const data: Record<string, string> = await req.json();
    await Promise.all(
      Object.entries(data).map(([key, value]) =>
        db.appSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        })
      )
    );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
