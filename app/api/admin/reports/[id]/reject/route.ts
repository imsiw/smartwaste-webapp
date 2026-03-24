import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { Role, ReportStatus } from "@prisma/client";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    await requireRole(initData, [Role.ADMIN]);

    const report = await prisma.report.update({
      where: { id: Number(params.id) },
      data: { status: ReportStatus.REJECTED, rejectedAt: new Date() },
    });

    return NextResponse.json({ ok: true, report });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
