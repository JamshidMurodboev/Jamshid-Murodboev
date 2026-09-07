import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const users = await db.user.findMany({
      select: { id: true, name: true, email: true, role: true, telegramChatId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(users);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(req: Request) {
  try {
    await requireAdmin();
    const data = await req.json();
    const hash = await bcrypt.hash(data.password, 12);
    const user = await db.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash: hash,
        role: data.role ?? "ASSISTANT",
        telegramChatId: data.telegramChatId ?? null,
      },
      select: { id: true, name: true, email: true, role: true, telegramChatId: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
  }
}
