import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUserByTelegram } from "@/lib/auth";
import { Role, TaskStatus } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const user = await getOrCreateUserByTelegram(initData);

    if (user.role === Role.USER) {
      const tasks = await prisma.task.findMany({
        where: { createdByUserId: user.id },
        include: { report: true, assignedTo: true },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json({ ok: true, tasks, role: user.role });
    }

    const searchParams = req.nextUrl.searchParams;
    const openOnly = searchParams.get("openOnly") !== "false";
    const where = openOnly
      ? { status: { in: [TaskStatus.NEW, TaskStatus.IN_PROGRESS] } }
      : {};

    const tasks = await prisma.task.findMany({
      where,
      include: { report: true, assignedTo: true, createdBy: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ ok: true, tasks, role: user.role });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }
}
