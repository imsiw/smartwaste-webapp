"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

type TgUser = { id: number; username?: string; first_name?: string; last_name?: string };
type TgTheme = Record<string, string | undefined>;
type AppRole = "USER" | "CLEANER" | "ADMIN";

export default function Home() {
  const [isTg, setIsTg] = useState(false);
  const [user, setUser] = useState<TgUser | null>(null);
  const [theme, setTheme] = useState<TgTheme>({});
  const [roleLabel, setRoleLabel] = useState("User");

  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    const params = new URLSearchParams(window.location.search);
    const qId = params.get("tg_id");
    const qUsername = params.get("tg_username");
    const qFirstName = params.get("tg_first_name");
    const qLastName = params.get("tg_last_name");

    if (qId) localStorage.setItem("tg_id", qId);
    if (qUsername) localStorage.setItem("tg_username", qUsername);
    if (qFirstName) localStorage.setItem("tg_first_name", qFirstName);
    if (qLastName) localStorage.setItem("tg_last_name", qLastName);
    if (!tg) return;

    setIsTg(true);
    tg.ready();
    tg.expand();
    try {
      tg.ready();
      tg.expand();
      tg.MainButton.hide();
    } catch {}
    setUser(tg.initDataUnsafe?.user ?? null);
    setTheme(tg.themeParams ?? {});

    try {
      tg.enableClosingConfirmation();
    } catch {}

    fetch("/api/me", {
      headers: getTelegramHeaders(),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data?.ok) setRoleLabel(data.user.roleLabel || mapRole(data.user.role));
      })
      .catch(() => setRoleLabel("User"));
  }, []);

  const name = useMemo(() => {
    if (!user) return "друг";
    return user.first_name || user.username || "друг";
  }, [user]);

  const colors = useMemo(() => {
    const eco = {
      bg: "#06130d",
      card: "#0b2217",
      text: "#e7fff2",
      hint: "#a7d9bf",
      accent: "#22c55e",
      accentText: "#062012",
      border: "rgba(167, 217, 191, 0.18)",
      glow: "rgba(34, 197, 94, 0.22)",
    };

    const accent = theme.button_color && looksGreen(theme.button_color) ? theme.button_color : eco.accent;

    return {
      bg: theme.bg_color ?? eco.bg,
      card: theme.secondary_bg_color ?? eco.card,
      text: theme.text_color ?? eco.text,
      hint: theme.hint_color ?? eco.hint,
      accent,
      accentText: theme.button_text_color ?? eco.accentText,
      border: eco.border,
      glow: eco.glow,
    };
  }, [theme]);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />

      <div
        style={{
          minHeight: "100vh",
          background: `radial-gradient(1200px 600px at 20% 10%, ${colors.glow}, transparent 55%),
                       radial-gradient(900px 500px at 90% 20%, rgba(16,185,129,0.18), transparent 55%),
                       ${colors.bg}`,
          color: colors.text,
          padding: 16,
        }}
      >
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo accent={colors.accent} />
              <div>
                <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.1 }}>
                  SmartWaste
                </h1>
                <div style={{ marginTop: 4, color: colors.hint, fontSize: 12 }}>
                  {isTg ? "Telegram WebApp" : "Открой через Telegram-бота"}
                </div>
              </div>
            </div>

            <Badge tone={isTg ? "ok" : "warn"} text={isTg ? roleLabel : "Browser"} />
          </div>

          <div
            style={{
              marginTop: 18,
              ...glass(colors.card, colors.border),
              padding: 20,
              textAlign: "center",
            }}
          >
            <div style={{ color: colors.hint, fontSize: 13, marginBottom: 8 }}>
              {user ? `Привет, ${name} 👋` : "Добро пожаловать"}
            </div>

            <div style={{ fontSize: 24, fontWeight: 900, lineHeight: 1.2, marginBottom: 10 }}>
              Сделайте город чище
            </div>

            <div style={{ color: colors.hint, fontSize: 14, lineHeight: 1.5, maxWidth: 460, margin: "0 auto" }}>
              Сделайте фото, отправьте репорт и отслеживайте статус задачи прямо в приложении
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20, alignItems: "center" }}>
              <Link href="/report" style={{ ...primaryBtn(colors.accent, colors.accentText), width: "100%", maxWidth: 340 }}>
                <span style={btnTextSlot()}>🗑️ Отправить репорт</span>
              </Link>

              <Link href="/tasks" style={{ ...secondaryBtn(colors.text, colors.border), width: "100%", maxWidth: 340 }}>
                <span style={btnTextSlot()}>🔄 Статус задач</span>
              </Link>
            </div>

            <div style={{ marginTop: 14, color: colors.hint, fontSize: 12 }}>
              Если фото не отправляется — попробуйте уменьшить размер изображения.
            </div>
          </div>

          <div style={{ marginTop: 12, display: "flex", justifyContent: "center" }}>
            <Link href="/help" style={subtleTextLink(colors.hint)}>
              ℹ️ Помощь и инструкция
            </Link>
          </div>

          <div style={{ marginTop: 16, color: colors.hint, fontSize: 12, textAlign: "center" }}>
            SmartWaste MVP · Next.js WebApp + Telegram Bot
          </div>
        </div>
      </div>
    </>
  );
}

function mapRole(role?: AppRole) {
  if (role === "ADMIN") return "Админ";
  if (role === "CLEANER") return "Уборщик";
  return "Житель";
}

function looksGreen(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return g > r + 25 && g > b + 25;
}

function glass(cardBg: string, border: string): React.CSSProperties {
  return {
    background: cardBg,
    borderRadius: 18,
    padding: 14,
    border: `1px solid ${border}`,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  };
}

function primaryBtn(bg: string, color: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 16,
    textDecoration: "none",
    background: bg,
    color,
    fontWeight: 800,
    border: "1px solid rgba(255,255,255,0.12)",
    transition: "transform 120ms ease, opacity 120ms ease",
  };
}

function secondaryBtn(color: string, border: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    boxSizing: "border-box",
    minHeight: 52,
    padding: "0 18px",
    borderRadius: 16,
    textDecoration: "none",
    background: "transparent",
    color,
    fontWeight: 800,
    border: `1px solid ${border}`,
    transition: "transform 120ms ease, opacity 120ms ease",
  };
}

function btnTextSlot(): React.CSSProperties {
  return { textAlign: "center", fontSize: 15, lineHeight: 1.1 };
}

function Badge({ tone, text }: { tone: "ok" | "warn"; text: string }) {
  const bg = tone === "ok" ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)";
  const br = tone === "ok" ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.35)";
  const fg = tone === "ok" ? "#bbf7d0" : "#fef08a";
  return (
    <span style={{ padding: "4px 10px", borderRadius: 999, fontSize: 12, background: bg, border: `1px solid ${br}`, color: fg, fontWeight: 800 }}>
      {text}
    </span>
  );
}

function subtleTextLink(color: string): React.CSSProperties {
  return { textDecoration: "none", color, fontSize: 13, fontWeight: 600, opacity: 0.9 };
}

function Logo({ accent }: { accent: string }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        minWidth: 34,
        minHeight: 34,
        flexShrink: 0,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.15))`,
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
      }}
      aria-hidden
    >
      <span style={{ fontSize: 18, lineHeight: 1 }}>♻️</span>
    </div>
  );
}

function getTelegramHeaders() {
  const tg = (window as any).Telegram?.WebApp;
  const params = new URLSearchParams(window.location.search);

  const tgId =
    params.get("tg_id") ||
    localStorage.getItem("tg_id") ||
    String(tg?.initDataUnsafe?.user?.id || "");

  const tgUsername =
    params.get("tg_username") ||
    localStorage.getItem("tg_username") ||
    tg?.initDataUnsafe?.user?.username ||
    "";

  const tgFirstName =
    params.get("tg_first_name") ||
    localStorage.getItem("tg_first_name") ||
    tg?.initDataUnsafe?.user?.first_name ||
    "";

  const tgLastName =
    params.get("tg_last_name") ||
    localStorage.getItem("tg_last_name") ||
    tg?.initDataUnsafe?.user?.last_name ||
    "";

  return {
    "Content-Type": "application/json",
    "x-telegram-init-data": tg?.initData || "",
    "x-telegram-id": String(tgId || ""),
    "x-telegram-username": tgUsername,
    "x-telegram-first-name": tgFirstName,
    "x-telegram-last-name": tgLastName,
  };
}