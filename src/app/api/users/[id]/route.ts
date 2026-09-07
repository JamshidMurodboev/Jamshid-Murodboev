import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await req.json();

    const updateData: Record<string, unknown> = {
      name: data.name,
      email: data.email,
      role: data.role,
      telegramChatId: data.telegramChatId,
    };
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 12);
    }

    const user = await db.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, telegramChatId: true },
    });
    return NextResponse.json(user);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await db.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
