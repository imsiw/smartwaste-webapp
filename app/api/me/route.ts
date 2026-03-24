import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByTelegram, displayRole } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const user = await getOrCreateUserByTelegram(initData);
    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        roleLabel: displayRole(user.role),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 401 });
  }
}
