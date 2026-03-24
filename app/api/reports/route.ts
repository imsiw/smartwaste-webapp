import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByTelegram } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveBase64ImageToBlob } from "@/lib/blob";

export async function POST(req: NextRequest) {
  try {
    const debugHeaders = {
    telegramId: req.headers.get("x-telegram-id"),
    initData: req.headers.get("x-telegram-init-data"),
    username: req.headers.get("x-telegram-username"),
    firstName: req.headers.get("x-telegram-first-name"),
    lastName: req.headers.get("x-telegram-last-name"),
  };

  console.log("REPORT DEBUG HEADERS:", debugHeaders);
    const user = await getOrCreateUserByTelegram(req);
    const body = await req.json();

    if (!body.photoDataUrl) {
      return NextResponse.json({ ok: false, error: "Фото обязательно" }, { status: 400 });
    }

    const photoPath = await saveBase64ImageToBlob(body.photoDataUrl);

    const report = await prisma.report.create({
      data: {
        createdByUserId: user.id,
        comment: body.comment?.trim() || null,
        photoPath,
        lat: body.geo?.lat ?? null,
        lon: body.geo?.lon ?? null,
        acc: body.geo?.acc ?? null,
      },
    });

    return NextResponse.json({ ok: true, report });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message || "Internal error",
        debug: {
          telegramId: req.headers.get("x-telegram-id"),
          initData: req.headers.get("x-telegram-init-data"),
          username: req.headers.get("x-telegram-username"),
        },
      },
      { status: 500 }
    );
  }
}
