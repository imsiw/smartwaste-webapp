import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    await requireRole(initData, [Role.ADMIN]);
    const body = await req.json();
    const nextRole = String(body.role || "").toUpperCase() as Role;
    if (!Object.values(Role).includes(nextRole)) {
      return NextResponse.json({ ok: false, error: "Некорректная роль" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: Number(params.id) },
      data: { role: nextRole },
    });

    return NextResponse.json({ ok: true, user });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
