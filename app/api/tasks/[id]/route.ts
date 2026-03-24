import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUserByTelegram } from "@/lib/auth";
import { Role, TaskStatus } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const user = await getOrCreateUserByTelegram(initData);

    if (![Role.CLEANER, Role.ADMIN].includes(user.role)) {
      return NextResponse.json({ ok: false, error: "Недостаточно прав" }, { status: 403 });
    }

    const body = await req.json();
    const action = body.action as "start" | "reset" | "done";
    const taskId = Number(params.id);

    if (Number.isNaN(taskId)) {
      return NextResponse.json({ ok: false, error: "Некорректный id задачи" }, { status: 400 });
    }

    if (action === "start") {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.IN_PROGRESS, assignedToUserId: user.id, doneAt: null, doneByUserId: null },
      });
      return NextResponse.json({ ok: true, task });
    }

    if (action === "reset") {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.NEW, assignedToUserId: null, doneAt: null, doneByUserId: null },
      });
      return NextResponse.json({ ok: true, task });
    }

    if (action === "done") {
      const task = await prisma.task.update({
        where: { id: taskId },
        data: { status: TaskStatus.DONE, doneAt: new Date(), doneByUserId: user.id, assignedToUserId: user.id },
      });
      return NextResponse.json({ ok: true, task });
    }

    return NextResponse.json({ ok: false, error: "Неизвестное действие" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
