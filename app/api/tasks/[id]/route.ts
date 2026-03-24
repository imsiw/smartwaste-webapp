import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getOrCreateUserByTelegram } from "@/lib/auth";
import { Role, TaskStatus } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const me = await getOrCreateUserByTelegram(req);
    const { id } = await context.params;

    if (!([Role.CLEANER, Role.ADMIN] as Role[]).includes(me.role as Role)) {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    const taskId = Number(id);
    const body = await req.json();
    const action = body?.action;

    let data: any = {};

    if (action === "start") {
      data = {
        status: TaskStatus.IN_PROGRESS,
        assignedToUserId: me.id,
      };
    } else if (action === "reset") {
      data = {
        status: TaskStatus.NEW,
        assignedToUserId: null,
        doneAt: null,
      };
    } else if (action === "done") {
      data = {
        status: TaskStatus.DONE,
        doneAt: new Date(),
        assignedToUserId: me.id,
      };
    } else {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const task = await prisma.task.update({
      where: { id: taskId },
      data,
    });

    return NextResponse.json({ ok: true, task });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}