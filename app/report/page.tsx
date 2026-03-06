"use client";

import Script from "next/script";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Tg = any;
type TgTheme = Record<string, string | undefined>;
type Geo = { lat: number; lon: number; acc?: number };

export default function ReportPage() {
  const [isTg, setIsTg] = useState(false);
  const [theme, setTheme] = useState<TgTheme>({});
  const [status, setStatus] = useState<string>("");
  const [comment, setComment] = useState("");
  const [geo, setGeo] = useState<Geo | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);

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
      danger: "#f87171",
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
      danger: eco.danger,
    };
  }, [theme]);

  const canSend = useMemo(() => !!photoDataUrl && isTg, [photoDataUrl, isTg]);

  useEffect(() => {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;
    if (!tg) {
      setIsTg(false);
      setStatus("Открой страницу внутри Telegram (через бота).");
      return;
    }

    setIsTg(true);
    tg.ready();
    tg.expand();

    setTheme(tg.themeParams ?? {});

    // Нижняя main-кнопка Telegram
    try {
      tg.MainButton.setText("Отправить");
      tg.MainButton.show();

      // Важно: не передавать новую функцию каждый раз, иначе offClick не снимет
      const handler = () => sendToBot();
      tg.MainButton.onClick(handler);

      return () => {
        try {
          tg.MainButton.offClick(handler);
          tg.MainButton.hide();
        } catch {}
      };
    } catch {
      // если MainButton недоступна (редко), ок
      return;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUrl, comment, geo, isTg]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;

    // Лимит тут условный (web_app_data тоже имеет лимиты) — лучше держать поменьше
    if (f.size > 3 * 1024 * 1024) {
      setStatus("Фото слишком большое (>3MB). Сделай меньше/сожми.");
      return;
    }

    const dataUrl = await readAsDataURL(f);
    setPhotoDataUrl(dataUrl);
    setStatus("Фото загружено ✅");
  }

  function getGeo() {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;
    if (!tg) return setStatus("Гео работает только в Telegram.");

    setStatus("Запрашиваем геолокацию…");
    tg.LocationManager.getLocation((loc: any) => {
      if (!loc) {
        setGeo(null);
        setStatus("Гео не получено (нет прав/отказ).");
        return;
      }
      const g = { lat: loc.latitude, lon: loc.longitude, acc: loc.horizontal_accuracy };
      setGeo(g);
      setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)} (±${Math.round(g.acc ?? 0)}м)`);
    });
  }

  function sendToBot() {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;
    if (!tg) return setStatus("Открой в Telegram.");
    if (!photoDataUrl) return setStatus("Добавь фото.");

    const payload = {
      type: "litter_report",
      ts: Date.now(),
      user: tg.initDataUnsafe?.user ?? null,
      comment,
      geo,
      photo_data_url: photoDataUrl,
    };

    try {
      tg.sendData(JSON.stringify(payload));
      tg.HapticFeedback?.notificationOccurred("success");
      setStatus("Отправлено в бот ✅");
    } catch {
      setStatus("Не удалось отправить. Возможно, фото слишком большое — нужно сжатие.");
    }
  }

  const geoLine = geo
    ? `${geo.lat.toFixed(5)}, ${geo.lon.toFixed(5)} (±${Math.round(geo.acc ?? 0)}м)`
    : "не указано";

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
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo accent={colors.accent} />
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: 0.2,
                    lineHeight: 1.1,
                  }}
                >
                  Репорт
                </h2>
                <div style={{ color: colors.hint, fontSize: 13 }}>Спасибо, что делаете Якутск чище!</div>
              </div>
            </div>

            <Link
              href="/"
              style={{
                textDecoration: "none",
                color: colors.text,
                border: `1px solid ${colors.border}`,
                padding: "8px 10px",
                borderRadius: 12,
                background: "rgba(255,255,255,0.04)",
              }}
            >
              ← Назад
            </Link>
          </div>

          {/* Main card */}
          <div style={{ marginTop: 14, ...glass(colors.card, colors.border) }}>
            {/* Photo */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontWeight: 900 }}>Фото</div>
              <div style={{ color: colors.hint, fontSize: 12 }}>
                {photoDataUrl ? "добавлено ✅" : "обязательно"}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={uploadBox(colors.border)}>
                <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 14,
                      display: "grid",
                      placeItems: "center",
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.10)",
                      fontSize: 20,
                    }}
                  >
                    📷
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>Выбрать фото</div>
                    <div style={{ color: colors.hint, fontSize: 12 }}>
                      Рекомендуемый размер файла менее 3MB
                    </div>
                  </div>
                  <div style={{ color: colors.hint, fontSize: 18 }}>›</div>
                </div>
              </label>

              {photoDataUrl && (
                <img
                  src={photoDataUrl}
                  alt="preview"
                  style={{
                    width: "100%",
                    marginTop: 12,
                    borderRadius: 16,
                    border: `1px solid ${colors.border}`,
                  }}
                />
              )}
            </div>

            {/* Comment */}
            <div style={{ marginTop: 14, fontWeight: 900 }}>Комментарий</div>
            <div style={{ marginTop: 8 }}>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Например: мусор рядом с урной, у входа..."
                style={textarea(colors)}
              />
            </div>


            {/* Geo + actions */}
            <div style={{ marginTop: 14 }}>
              <div>
                <div style={{ fontWeight: 900 }}>Геолокация</div>
                <div style={{ color: colors.hint, fontSize: 12, marginTop: 4 }}>
                  Текущее: {geoLine}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                  marginTop: 12,
                }}
              >
                <button onClick={getGeo} style={outlineBtn(colors)}>
                  📍 Отправить гео
                </button>

                <button
                  onClick={() => {
                    setPhotoDataUrl(null);
                    setComment("");
                    setGeo(null);
                    setStatus("");
                  }}
                  style={ghostBtn(colors)}
                >
                  🧽 Очистить все
                </button>
              </div>
            </div>

            {/* Status */}
            <div
              style={{
                marginTop: 12,
                padding: "10px 12px",
                borderRadius: 14,
                border: `1px solid ${colors.border}`,
                background: "rgba(255,255,255,0.04)",
                color: status.includes("не") || status.includes("слиш") ? colors.danger : colors.hint,
                fontSize: 13,
                lineHeight: 1.35,
              }}
            >
              {status || "Добавьте фото и нажмите “Отправить”"}
            </div>
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

function glass(cardBg: string, border: string): React.CSSProperties {
  return {
    background: cardBg,
    borderRadius: 18,
    padding: 14,
    border: `1px solid ${border}`,
    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
  };
}

function uploadBox(border: string): React.CSSProperties {
  return {
    display: "block",
    padding: 12,
    borderRadius: 16,
    border: `1px dashed ${border}`,
    background: "rgba(255,255,255,0.03)",
    cursor: "pointer",
    userSelect: "none",
  };
}

function textarea(colors: {
  text: string;
  border: string;
}): React.CSSProperties {
  return {
    width: "100%",
    boxSizing: "border-box",
    padding: 12,
    borderRadius: 16,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.03)",
    color: colors.text,
    outline: "none",
    lineHeight: 1.4,

    resize: "none",        // ← главное
    overflow: "auto",      // ← скролл внутри, если много текста
    minHeight: 96,         // ← стабильная высота
    maxHeight: 160,        // ← чтобы не раздувалось
  };
}


function primaryBtn(colors: { accent: string; accentText: string; border: string }): React.CSSProperties {
  return {
    flex: 1,
    minWidth: 200,
    padding: "10px 14px",
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.12)",
    background: colors.accent,
    color: colors.accentText,
    fontWeight: 900,
    cursor: "pointer",
  };
}

function outlineBtn(colors: { text: string; border: string }): React.CSSProperties {
  return {
    width: "100%",
    minWidth: 0,
    height: 44,
    padding: "0 14px",
    boxSizing: "border-box",
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.04)",
    color: colors.text,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textAlign: "center",
    whiteSpace: "nowrap",
  };
}

function ghostBtn(colors: { text: string; border: string }): React.CSSProperties {
  return {
    width: "100%",
    minWidth: 0,
    height: 44,
    padding: "0 14px",
    boxSizing: "border-box",
    borderRadius: 14,
    border: `1px solid ${colors.border}`,
    background: "rgba(255,255,255,0.02)",
    color: colors.text,
    fontWeight: 800,
    fontSize: 14,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    textAlign: "center",
    whiteSpace: "nowrap",
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

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
