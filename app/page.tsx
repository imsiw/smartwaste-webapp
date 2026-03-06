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
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Logo accent={colors.accent} />
                <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>SmartWaste</h1>
              </div>
              <div style={{ marginTop: 6, color: colors.hint, fontSize: 13 }}>
                {isTg ? "Открыто в Telegram WebApp" : "Открой через Telegram-бота для отправки репорта"}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
              <Badge tone={isTg ? "ok" : "warn"} text={isTg ? "Connected" : "Browser"} />
              <div style={{ color: colors.hint, fontSize: 12 }}>{user ? `Привет, ${name} 👋` : "Гость"}</div>
            </div>
          </div>

          {/* Hero */}
          <div style={{ marginTop: 14, ...glass(colors.card, colors.border) }}>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 6 }}>
                  Чистота начинается с одного репорта
                </div>
                <div style={{ color: colors.hint, fontSize: 13, lineHeight: 1.45 }}>
                  Фото + гео → отправка в бота → задача уборки.
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
                  <Link href="/report" style={primaryBtn(colors.accent, colors.accentText)}>
                    <span style={{ marginRight: 8 }}>🗑️</span> Отправить репорт
                  </Link>

                  <Link href="/tasks" style={secondaryBtn(colors.text, colors.border)}>
                    <span style={{ marginRight: 8 }}>🧹</span> Мои задачи
                  </Link>
                </div>

                <div style={{ marginTop: 10, color: colors.hint, fontSize: 12 }}>
                  Совет: если фото не отправляется — сделайте его меньше.
                </div>
              </div>

              <div style={{ width: 140, flexShrink: 0, display: "grid", gap: 10 }}>
                <StatCard
                  title="Источник"
                  value={isTg ? "Telegram" : "Web"}
                  card={colors.card}
                  text={colors.text}
                  hintColor={colors.hint}
                  border={colors.border}
                />
                <StatCard
                  title="Режим"
                  value="MVP"
                  card={colors.card}
                  text={colors.text}
                  hintColor={colors.hint}
                  border={colors.border}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ marginTop: 14, display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <ActionCard
              href="/report"
              icon="📸"
              title="Сообщить о мусоре"
              desc="Загрузи фото, добавь комментарий и (по желанию) геолокацию."
              card={colors.card}
              text={colors.text}
              hint={colors.hint}
              border={colors.border}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <ActionCard
                href="/tasks"
                icon="✅"
                title="Статус / задачи"
                desc="Список задач, отметка “убрано”."
                card={colors.card}
                text={colors.text}
                hint={colors.hint}
                border={colors.border}
              />
              <ActionCard
                href="/help"
                icon="ℹ️"
                title="Помощь"
                desc="Короткая инструкция и ответы на частые проблемы."
                card={colors.card}
                text={colors.text}
                hint={colors.hint}
                border={colors.border}
              />
            </div>
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
  const b = parseInt(h.slice(4, 2 + 4), 16);
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
    padding: "10px 14px",
    borderRadius: 14,
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
    padding: "10px 14px",
    borderRadius: 14,
    textDecoration: "none",
    background: "transparent",
    color,
    fontWeight: 800,
    border: `1px solid ${border}`,
    transition: "transform 120ms ease, opacity 120ms ease",
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

function Logo({ accent }: { accent: string }) {
  return (
    <div
      style={{
        width: 34,
        height: 34,
        borderRadius: 12,
        background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.15))`,
        display: "grid",
        placeItems: "center",
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
      }}
      aria-hidden
    >
      <span style={{ fontSize: 18 }}>♻️</span>
    </div>
  );
}
