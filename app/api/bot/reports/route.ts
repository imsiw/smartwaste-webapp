import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { saveBase64ImageToBlob } from "@/lib/blob";
import { Role } from "@prisma/client";

export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get("x-bot-api-key") || "";
    if (!process.env.INTERNAL_BOT_API_KEY || apiKey !== process.env.INTERNAL_BOT_API_KEY) {
      return NextResponse.json({ ok: false, error: "Нет доступа" }, { status: 401 });
    }

    const body = await req.json();
    const telegramId = String(body.telegramId);
    if (!telegramId || !body.photoDataUrl) {
      return NextResponse.json({ ok: false, error: "Недостаточно данных" }, { status: 400 });
    }

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: body.username || null,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
      },
      create: {
        telegramId,
        username: body.username || null,
        firstName: body.firstName || null,
        lastName: body.lastName || null,
        role: Role.USER,
      },
    });

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

    return NextResponse.json({ ok: true, reportId: report.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
