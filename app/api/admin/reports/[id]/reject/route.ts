import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role, ReportStatus } from "@prisma/client";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, [Role.ADMIN]);
    const { id } = await context.params;

    const reportId = Number(id);

    const updatedReport = await prisma.report.update({
      where: { id: reportId },
      data: {
        status: ReportStatus.REJECTED,
        rejectedAt: new Date(),
      },
    });

    return NextResponse.json({ ok: true, updatedReport });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}