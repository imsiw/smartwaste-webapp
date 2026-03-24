import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByTelegram } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const user = await getOrCreateUserByTelegram(req);

    return NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        telegramId: user.telegramId,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Internal error" },
      { status: 500 }
    );
  }
}