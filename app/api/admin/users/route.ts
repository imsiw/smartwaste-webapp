import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Role } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    await requireRole(initData, [Role.ADMIN]);
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ ok: true, users });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 403 });
  }
}
