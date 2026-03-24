import { NextRequest } from "next/server";
import { prisma } from "./db";
import { Role } from "@prisma/client";

type ParsedTelegramUser = {
  id: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
};

function parseTelegramUserFromInitData(initData: string): ParsedTelegramUser | null {
  if (!initData) return null;

  try {
    const params = new URLSearchParams(initData);
    const userRaw = params.get("user");
    if (!userRaw) return null;

    const user = JSON.parse(userRaw);
    if (!user?.id) return null;

    return user as ParsedTelegramUser;
  } catch {
    return null;
  }
}

export async function getOrCreateUserByTelegram(req: NextRequest) {
  let telegramId = req.headers.get("x-telegram-id");
  let username = req.headers.get("x-telegram-username") || undefined;
  let firstName = req.headers.get("x-telegram-first-name") || undefined;
  let lastName = req.headers.get("x-telegram-last-name") || undefined;

  if (!telegramId) {
    const initData = req.headers.get("x-telegram-init-data") || "";
    const parsedUser = parseTelegramUserFromInitData(initData);

    if (parsedUser) {
      telegramId = String(parsedUser.id);
      username = parsedUser.username || username;
      firstName = parsedUser.first_name || firstName;
      lastName = parsedUser.last_name || lastName;
    }
  }

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

  if (user.role !== Role.ADMIN && allowed.includes(Role.ADMIN)) {
    if (!allowed.includes(user.role as Role)) {
      throw new Error("Forbidden");
    }
  } else if (!allowed.includes(user.role as Role)) {
    throw new Error("Forbidden");
  }

  return user;
}