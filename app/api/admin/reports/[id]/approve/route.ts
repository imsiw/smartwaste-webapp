import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role, ReportStatus, TaskStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, [Role.ADMIN]);
    const { id } = await context.params;

    const reportId = Number(id);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });
    }

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.APPROVED,
        approvedAt: new Date(),
      },
    });

    const task = await prisma.task.create({
      data: {
        reportId: report.id,
        createdByUserId: report.createdByUserId,
        comment: report.comment,
        photoPath: report.photoPath,
        lat: report.lat,
        lon: report.lon,
        acc: report.acc,
        status: TaskStatus.NEW,
      },
    });

    return NextResponse.json({ ok: true, updatedReport, task });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}