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

    const reportId = Number(id);

    const report = await prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      return NextResponse.json({ ok: false, error: "Report not found" }, { status: 404 });
    }

    if (report.photoPath) {
      await removeBlobByUrl(report.photoPath);
    }

    await prisma.report.delete({
      where: { id: reportId },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}