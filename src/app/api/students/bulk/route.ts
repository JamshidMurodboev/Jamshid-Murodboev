import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function PATCH(req: Request) {
  try {
    const session = await requireSession();
    const { studentIds, action, value } = await req.json();

    if (!studentIds?.length) {
      return NextResponse.json({ error: "No students selected" }, { status: 400 });
    }

    if (action === "stage") {
      await db.student.updateMany({
        where: { id: { in: studentIds } },
        data: { progressStageId: value || null, updatedById: session.userId },
      });
    } else if (action === "batch") {
      await db.student.updateMany({
        where: { id: { in: studentIds } },
        data: { batchId: value, updatedById: session.userId },
      });
    } else if (action === "scholarship") {
      await Promise.all(
        studentIds.map((studentId: string) =>
          db.studentScholarship.upsert({
            where: { studentId_scholarshipId: { studentId, scholarshipId: value } },
            create: { studentId, scholarshipId: value },
            update: {},
          })
        )
      );
    } else {
      return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, count: studentIds.length });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to bulk update" }, { status: 500 });
  }
}
