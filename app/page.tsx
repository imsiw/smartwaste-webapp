"use client";

import Link from "next/link";
import Script from "next/script";
import { useEffect, useMemo, useState } from "react";

type TgUser = { id: number; username?: string; first_name?: string; last_name?: string };
type TgTheme = Record<string, string | undefined>;

export default function Home() {
  const [isTg, setIsTg] = useState(false);
  const [user, setUser] = useState<TgUser | null>(null);
  const [theme, setTheme] = useState<TgTheme>({});

  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    if (!tg) return;

    setIsTg(true);
    tg.ready();
    tg.expand();

    setUser(tg.initDataUnsafe?.user ?? null);
    setTheme(tg.themeParams ?? {});

    try {
      tg.enableClosingConfirmation();
    } catch {}
  }, []);

  const name = useMemo(() => {
    if (!user) return "друг";
    return user.first_name || user.username || "друг";
  }, [user]);

  // Эко/чистота палитра + мягкая подстройка под Telegram themeParams
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

    const tgBg = theme.bg_color;
    const tgCard = theme.secondary_bg_color;
    const tgText = theme.text_color;
    const tgHint = theme.hint_color;
    const tgAccent = theme.button_color;
    const tgAccentText = theme.button_text_color;

    const accent = tgAccent && looksGreen(tgAccent) ? tgAccent : eco.accent;

    return {
      bg: tgBg ?? eco.bg,
      card: tgCard ?? eco.card,
      text: tgText ?? eco.text,
      hint: tgHint ?? eco.hint,
      accent,
      accentText: tgAccentText ?? eco.accentText,
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
          {/* Header */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo accent={colors.accent} />
              <div>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    lineHeight: 1.1,
                  }}
                >
                  SmartWaste
                </h1>
                <div style={{ marginTop: 4, color: colors.hint, fontSize: 12 }}>
                  {isTg ? "Telegram WebApp" : "Открой через Telegram-бота"}
                </div>
              </div>
            </div>

            <Badge tone={isTg ? "ok" : "warn"} text={isTg ? "Connected" : "Browser"} />
          </div>

          {/* Main */}
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

            <div
              style={{
                fontSize: 24,
                fontWeight: 900,
                lineHeight: 1.2,
                marginBottom: 10,
              }}
            >
              Сделайте город чище
            </div>

            <div
              style={{
                color: colors.hint,
                fontSize: 14,
                lineHeight: 1.5,
                maxWidth: 460,
                margin: "0 auto",
              }}
            >
              Сделайте фото, отправьте репорт и отслеживайте статус задачи прямо в приложении
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
                marginTop: 20,
                alignItems: "center",
              }}
            >
              <Link
                href="/report"
                style={{
                  ...primaryBtn(colors.accent, colors.accentText),
                  width: "100%",
                  maxWidth: 340,
                }}
              >
                <span style={btnIconSlot()}>🗑️</span>
                <span style={btnTextSlot()}>Отправить репорт</span>
                <span style={btnIconSlot()} aria-hidden />
              </Link>

              <Link
                href="/tasks"
                style={{
                  ...secondaryBtn(colors.text, colors.border),
                  width: "100%",
                  maxWidth: 340,
                }}
              >
                <span style={btnIconSlot()}>🔄</span>
                <span style={btnTextSlot()}>Статус задач</span>
                <span style={btnIconSlot()} aria-hidden />
              </Link>
            </div>

            <div
              style={{
                marginTop: 14,
                color: colors.hint,
                fontSize: 12,
              }}
            >
              Если фото не отправляется — попробуйте уменьшить размер изображения.
            </div>
          </div>

          {/* Bottom links */}
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Link href="/help" style={subtleTextLink(colors.hint)}>
              ℹ️ Помощь и инструкция
            </Link>
          </div>

          {/* Footer */}
          <div style={{ marginTop: 16, color: colors.hint, fontSize: 12, textAlign: "center" }}>
            SmartWaste MVP · Next.js WebApp + Telegram Bot
          </div>
        </div>
      </div>
    </>
  );
}

/* helpers */

function looksGreen(hex: string) {
  const h = hex.replace("#", "");
  if (h.length !== 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return g > r + 25 && g > b + 25;
}

function subtleLink(color: string, border: string, card: string): React.CSSProperties {
  return {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px 12px",
    borderRadius: 12,
    textDecoration: "none",
    color,
    fontSize: 13,
    fontWeight: 600,
    background: "rgba(255,255,255,0.03)",
    border: `1px solid ${border}`,
    opacity: 0.9,
  };
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
    display: "grid",
    gridTemplateColumns: "24px 1fr 24px",
    alignItems: "center",
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
    display: "grid",
    gridTemplateColumns: "24px 1fr 24px",
    alignItems: "center",
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

function btnIconSlot(): React.CSSProperties {
  return {
    width: 24,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
    lineHeight: 1,
  };
}

function btnTextSlot(): React.CSSProperties {
  return {
    textAlign: "center",
    fontSize: 15,
    lineHeight: 1.1,
  };
}

function Badge({ tone, text }: { tone: "ok" | "warn"; text: string }) {
  const bg = tone === "ok" ? "rgba(34,197,94,0.18)" : "rgba(245,158,11,0.18)";
  const br = tone === "ok" ? "rgba(34,197,94,0.35)" : "rgba(245,158,11,0.35)";
  const fg = tone === "ok" ? "#bbf7d0" : "#fef08a";
  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        background: bg,
        border: `1px solid ${br}`,
        color: fg,
        fontWeight: 800,
      }}
    >
      {text}
    </span>
  );
}

function ActionCard(props: {
  href: string;
  icon: string;
  title: string;
  desc: string;
  card: string;
  text: string;
  hint: string;
  border: string;
}) {
  const { href, icon, title, desc, card, text, hint, border } = props;

  return (
    <Link
      href={href}
      style={{
        ...glass(card, border),
        display: "flex",
        gap: 12,
        alignItems: "center",
        textDecoration: "none",
        color: text,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          display: "grid",
          placeItems: "center",
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          fontSize: 20,
        }}
      >
        {icon}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 900, marginBottom: 3 }}>{title}</div>
        <div style={{ color: hint, fontSize: 13, lineHeight: 1.35 }}>{desc}</div>
      </div>

      <div style={{ color: hint, fontSize: 18 }}>›</div>
    </Link>
  );
}

function StatCard({
  title,
  value,
  hint,
  card,
  text,
  hintColor,
  border,
}: {
  title: string;
  value: string;
  hint: string;
  card: string;
  text: string;
  hintColor: string;
  border: string;
}) {
  return (
    <div style={{ ...glass(card, border), padding: 10 }}>
      <div style={{ fontSize: 12, color: hintColor }}>{title}</div>
      <div style={{ fontSize: 16, fontWeight: 950 as any, marginTop: 2 }}>{value}</div>
      <div style={{ fontSize: 11, color: hintColor, marginTop: 2 }}>{hint}</div>
    </div>
  );
}

function subtleTextLink(color: string): React.CSSProperties {
  return {
    textDecoration: "none",
    color,
    fontSize: 13,
    fontWeight: 600,
    opacity: 0.9,
  };
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
