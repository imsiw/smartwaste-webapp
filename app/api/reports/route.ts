import { NextRequest, NextResponse } from "next/server";
import { getOrCreateUserByTelegram } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { saveBase64ImageToBlob } from "@/lib/blob";

export async function POST(req: NextRequest) {
  try {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const user = await getOrCreateUserByTelegram(initData);
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
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  }
}
