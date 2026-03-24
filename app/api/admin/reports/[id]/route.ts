import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { removeBlobByUrl } from "@/lib/blob";
import { requireRole } from "@/lib/auth";
import { Role } from "@prisma/client";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    await requireRole(initData, [Role.ADMIN]);
    const reportId = Number(params.id);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
      include: { task: true },
    });

    if (!report) {
      return NextResponse.json({ ok: false, error: "Репорт не найден" }, { status: 404 });
    }

    await prisma.report.delete({ where: { id: reportId } });
    await removeBlobByUrl(report.photoPath);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
