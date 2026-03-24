import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { removeBlobByUrl } from "@/lib/blob";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    await requireRole(initData, [Role.ADMIN]);

    const taskId = Number(params.id);
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { report: true },
    });

    if (!task) {
      return NextResponse.json({ ok: false, error: "Задача не найдена" }, { status: 404 });
    }

    if (task.report) {
      await prisma.report.delete({ where: { id: task.report.id } });
      await removeBlobByUrl(task.report.photoPath);
    } else {
      await prisma.task.delete({ where: { id: taskId } });
      await removeBlobByUrl(task.photoPath);
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
