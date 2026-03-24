import crypto from "crypto";
import { prisma } from "./db";
import { Role } from "@prisma/client";
import { NextRequest } from "next/server";

export type TelegramWebAppUser = {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function parseInitData(initData: string) {
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) throw new Error("Отсутствует hash в Telegram initData");

  const entries: string[] = [];
  let user: TelegramWebAppUser | null = null;

  for (const [key, value] of params.entries()) {
    if (key === "hash") continue;
    entries.push(`${key}=${value}`);
    if (key === "user") user = JSON.parse(value);
  }

  entries.sort();
  return {
    hash,
    dataCheckString: entries.join("\n"),
    user,
    authDate: Number(params.get("auth_date") || 0),
  };
}

export function verifyTelegramInitData(initData: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (!botToken) throw new Error("TELEGRAM_BOT_TOKEN не настроен");

  const { hash, dataCheckString, user, authDate } = parseInitData(initData);

  const secret = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computed = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  if (computed !== hash) throw new Error("Telegram initData не прошёл проверку");

  const ageSeconds = Math.floor(Date.now() / 1000) - authDate;
  if (ageSeconds > 60 * 60 * 24) throw new Error("Telegram initData устарел");
  if (!user?.id) throw new Error("Пользователь Telegram не найден");

  return user;
}

export async function getOrCreateUserByTelegram(req: NextRequest) {
  const telegramId = req.headers.get("x-telegram-id");
  const username = req.headers.get("x-telegram-username") || undefined;
  const firstName = req.headers.get("x-telegram-first-name") || undefined;
  const lastName = req.headers.get("x-telegram-last-name") || undefined;

  if (!telegramId) {
    throw new Error("No telegram id");
  }

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      username,
      firstName,
      lastName,
    },
    create: {
      telegramId,
      username,
      firstName,
      lastName,
      role: Role.USER,
    },
  });

  return user;
}

export async function requireRole(req: NextRequest, allowed: Role[]) {
  const user = await getOrCreateUserByTelegram(req);

  if (!(allowed as Role[]).includes(user.role as Role)) {
    throw new Error("Forbidden");
  }

  return user;
}

export function displayRole(role: Role) {
  if (role === Role.ADMIN) return "Admin";
  if (role === Role.CLEANER) return "Cleaner";
  return "User";
}
