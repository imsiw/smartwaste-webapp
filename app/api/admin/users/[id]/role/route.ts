import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole(req, [Role.ADMIN]);
    const { id } = await context.params;

    const userId = Number(id);
    const body = await req.json();

    const nextRole = body?.role as Role;

    if (!Object.values(Role).includes(nextRole)) {
      return NextResponse.json({ ok: false, error: "Invalid role" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { role: nextRole },
    });

    return NextResponse.json({ ok: true, user });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}