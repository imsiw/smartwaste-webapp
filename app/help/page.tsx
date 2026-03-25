"use client";  // Директива для клиента

import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

type TgUser = {
  first_name?: string;
  username?: string;
};

type TgTheme = {
  bg_color?: string;
  secondary_bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  button_text_color?: string;
};

export default function HelpPage() {
  const [theme, setTheme] = useState<TgTheme>({});
  const [user, setUser] = useState<TgUser | null>(null);
  const [isTg, setIsTg] = useState(false);

  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.MainButton.hide();
    } catch {}

    setIsTg(true);
    tg.ready();
    tg.expand();

    setUser((tg.initDataUnsafe?.user ?? null) as TgUser | null);
    setTheme((tg.themeParams ?? {}) as TgTheme);
  }, []);

  const name = useMemo(() => {
    if (!user) return "Гость";
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

    const tgBg = theme.bg_color;
    const tgCard = theme.secondary_bg_color;
    const tgText = theme.text_color;
    const tgHint = theme.hint_color;
    const tgAccent = theme.button_color;
    const tgAccentText = theme.button_text_color;

    return {
      bg: tgBg ?? eco.bg,
      card: tgCard ?? eco.card,
      text: tgText ?? eco.text,
      hint: tgHint ?? eco.hint,
      accent: tgAccent && looksGreen(tgAccent) ? tgAccent : eco.accent,
      accentText: tgAccentText ?? eco.accentText,
      border: eco.border,
      glow: eco.glow,
    };
  }, [theme]);

  function looksGreen(hex: string) {
    const h = hex.replace("#", "");
    if (h.length !== 6) return false;
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return g > r + 25 && g > b + 25;
  }

  return (
    <div
      style={{
        minHeight: "100vh", // Устанавливаем минимальную высоту 100% от высоты экрана
        background: `radial-gradient(1200px 600px at 20% 10%, ${colors.glow}, transparent 55%), ${colors.bg}`,
        color: colors.text,
        padding: 16,
      }}
    >
      <div style={{ maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${colors.accent}, rgba(255,255,255,0.15))`,
                display: "grid",
                placeItems: "center",
                border: "1px solid rgba(255,255,255,0.14)",
                boxShadow: "0 10px 25px rgba(0,0,0,0.25)",
              }}
              aria-hidden
            >
              <span style={{ fontSize: 18 }}>♻️</span>
            </div>
            <h1 style={{ margin: 0, fontSize: 22, letterSpacing: 0.2 }}>SmartWaste</h1>
          </div>
          <Link href="/" style={{ textDecoration: "none", color: colors.accent }}>
            ← Назад
          </Link>
        </div>

        <div
          style={{
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: 12,
            marginTop: 12,
            background: colors.card,
          }}
        >
          <h3>Основные функции:</h3>
          <ul>
            <li>
              <strong>Отправка отчета:</strong> Нажмите на кнопку «Сообщить о мусоре», выберите фото, при желании добавьте геолокацию и комментарий, а затем нажмите на кнопку «Отправить».
            </li>
            <li>
              <strong>Составление отчета:</strong> Загрузите фото мусора, добавьте комментарий и геолокацию.
            </li>
            <li>
              <strong>Работа в Telegram:</strong> После отправки отчета в Telegram-бота вы получите подтверждение с информацией о вашем отчете.
            </li>
          </ul>

          <h3>Как начать:</h3>
          <ul>
            <li>Перейдите на страницу через бота в Telegram.</li>
            <li>Выберите опцию «Сообщить о мусоре» и следуйте инструкциям.</li>
            <li>Отправьте отчет в бот и получите подтверждение.</li>
          </ul>

          <h3>Часто задаваемые вопросы:</h3>
          <ul>
            <li><strong>Как взять геолокацию?</strong> Нажмите кнопку «📍 Взять гео».</li>
            <li><strong>Почему я не могу отправить отчет?</strong> Убедитесь, что выбрано фото и добавлен комментарий.</li>
            <li><strong>Как узнать что мусор убрали?</strong> Статус выполнения задачи вы можете посмотреть во вкладке «Статус / задачи».</li>
            <li><strong>Могу ли я отправить фото в чат боту?</strong> Да, вы можете отправить фотографию и геометку прямо в чате с ботом. Для этого выберите фото и отправьте боту, затем выберите геометку и отправьте локацию.</li>
          
          </ul>
          
          <p>Это приложение помогает быстро сообщать о мусоре и поддерживать чистоту в вашем городе!</p>
        </div>
      </div>
    </div>
  );
}