import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession, requireAdmin } from "@/lib/auth";

export async function GET(req: Request) {
  try {
    await requireSession();
    const { searchParams } = new URL(req.url);
    const batchId = searchParams.get("batchId");
    if (!batchId) return NextResponse.json({ error: "batchId required" }, { status: 400 });

    const marks = await db.mark.findMany({
      where: { lesson: { batchId } },
      select: { id: true, lessonId: true, studentId: true, attendance: true, assignment: true },
    });
    return NextResponse.json(marks);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAdmin();
    const { lessonId, studentId, attendance, assignment } = await req.json();
    if (!lessonId || !studentId) {
      return NextResponse.json({ error: "lessonId and studentId required" }, { status: 400 });
    }

    const mark = await db.mark.upsert({
      where: { lessonId_studentId: { lessonId, studentId } },
      create: {
        lessonId,
        studentId,
        attendance: attendance ?? null,
        assignment: assignment ?? null,
        updatedBy: session.userId,
      },
      update: {
        attendance: attendance ?? null,
        assignment: assignment ?? null,
        updatedBy: session.userId,
      },
      select: { id: true, lessonId: true, studentId: true, attendance: true, assignment: true },
    });
    return NextResponse.json(mark);
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
