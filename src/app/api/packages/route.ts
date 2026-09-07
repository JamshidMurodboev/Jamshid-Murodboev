import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await requireSession();
    const data = await req.json();
    const pkg = await db.package.create({
      data: {
        batchId: data.batchId,
        name: data.name,
        listPrice: parseFloat(data.listPrice),
        earlyBirdPrice: data.earlyBirdPrice ? parseFloat(data.earlyBirdPrice) : null,
        description: data.description ?? null,
      },
    });
    return NextResponse.json(pkg, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to create package" }, { status: 500 });
  }
}
