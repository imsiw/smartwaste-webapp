import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { removeBlobByUrl } from "@/lib/blob";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, [Role.ADMIN]);
    const { id } = await context.params;

    const taskId = Number(id);

    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Task not found" }, { status: 404 });
    }

    if (task.photoPath) {
      await removeBlobByUrl(task.photoPath);
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}