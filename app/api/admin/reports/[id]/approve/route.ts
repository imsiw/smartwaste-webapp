import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role, ReportStatus, TaskStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const admin = await requireRole(initData, [Role.ADMIN]);
    const reportId = Number(params.id);

    const report = await prisma.report.findUnique({ where: { id: reportId } });
    if (!report) return NextResponse.json({ ok: false, error: "Репорт не найден" }, { status: 404 });

    const result = await prisma.$transaction(async (tx) => {
      const updatedReport = await tx.report.update({
        where: { id: reportId },
        data: {
          status: ReportStatus.APPROVED,
          approvedByUserId: admin.id,
          approvedAt: new Date(),
        },
      });

      const task = await tx.task.upsert({
        where: { reportId },
        update: {},
        create: {
          reportId,
          createdByUserId: report.createdByUserId,
          comment: report.comment,
          photoPath: report.photoPath,
          lat: report.lat,
          lon: report.lon,
          acc: report.acc,
          status: TaskStatus.NEW,
        },
      });

      return { updatedReport, task };
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
