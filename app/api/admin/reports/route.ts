import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role, ReportStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, [Role.ADMIN]);

    const onlyPending = req.nextUrl.searchParams.get("pendingOnly") !== "false";
    const reports = await prisma.report.findMany({
      where: onlyPending ? { status: ReportStatus.PENDING } : {},
      include: { createdBy: true, task: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, reports });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }
}
