import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByTelegram } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = await getOrCreateUserByTelegram(req);

    const reports = await prisma.report.findMany({
      where: { createdByUserId: user.id },
      include: { task: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, reports, role: user.role });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }
}
