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
  const [loading, setLoading] = useState(false);

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
      danger: eco.danger,
    };
  }, [theme]);

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

    try {
      tg.MainButton.setText("Отправить");
      tg.MainButton.show();
      const handler = () => submitReport();
      tg.MainButton.onClick(handler);
      return () => {
        try {
          tg.MainButton.offClick(handler);
          tg.MainButton.hide();
        } catch {}
      };
    } catch {
      return;
    }
  }, [photoDataUrl, comment, geo]);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
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
  if (!tg) {
    setStatus("Гео работает только в Telegram.");
    return;
  }

  try {
    setStatus("Запрашиваем геолокацию…");

    const lm = tg.LocationManager;

    if (!lm) {
      if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const g = {
              lat: pos.coords.latitude,
              lon: pos.coords.longitude,
              acc: pos.coords.accuracy,
            };
            setGeo(g);
            setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)} (±${Math.round(g.acc ?? 0)}м)`);
          },
          () => {
            setGeo(null);
            setStatus("Гео не получено (нет прав/отказ).");
          },
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return;
      }

      setStatus("Геолокация не поддерживается на этом устройстве.");
      return;
    }

    if (typeof lm.init === "function") {
      lm.init(() => {
        lm.getLocation((loc: any) => {
          if (!loc) {
            setGeo(null);
            setStatus("Гео не получено (нет прав/отказ).");
            return;
          }

          const lat = Number(loc.latitude);
          const lon = Number(loc.longitude);
          const acc = Number(loc.horizontal_accuracy);

          if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
            setGeo(null);
            setStatus("Гео пришло в неверном формате.");
            return;
          }

          const g = { lat, lon, acc: Number.isFinite(acc) ? acc : undefined };
          setGeo(g);
          setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)} (±${Math.round(g.acc ?? 0)}м)`);
        });
      });
      return;
    }

    lm.getLocation((loc: any) => {
      if (!loc) {
        setGeo(null);
        setStatus("Гео не получено (нет прав/отказ).");
        return;
      }

      const lat = Number(loc.latitude);
      const lon = Number(loc.longitude);
      const acc = Number(loc.horizontal_accuracy);

      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        setGeo(null);
        setStatus("Гео пришло в неверном формате.");
        return;
      }

      const g = { lat, lon, acc: Number.isFinite(acc) ? acc : undefined };
      setGeo(g);
      setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)} (±${Math.round(g.acc ?? 0)}м)`);
    });
  } catch (e: any) {
    setStatus(`Ошибка гео: ${e?.message || "неизвестная ошибка"}`);
  }
}

  async function submitReport() {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;
    if (!tg) return setStatus("Открой в Telegram.");
    if (!photoDataUrl) return setStatus("Добавь фото.");
    if (loading) return;

    setLoading(true);
    setStatus("Отправляем репорт…");

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-telegram-init-data": tg.initData || "",
        },
        body: JSON.stringify({
          comment,
          geo,
          photoDataUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || "Не удалось отправить репорт");
      tg.HapticFeedback?.notificationOccurred("success");
      setStatus("Репорт отправлен ✅ Теперь он ждёт одобрения админа.");
      setPhotoDataUrl(null);
      setComment("");
      setGeo(null);
    } catch (error: any) {
      setStatus(error.message || "Ошибка отправки");
    } finally {
      setLoading(false);
    }
  }

  const geoLine = geo ? `${geo.lat.toFixed(5)}, ${geo.lon.toFixed(5)} (±${Math.round(geo.acc ?? 0)}м)` : "не указано";

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div style={{ minHeight: "100vh", background: `radial-gradient(1200px 600px at 20% 10%, ${colors.glow}, transparent 55%), radial-gradient(900px 500px at 90% 20%, rgba(16,185,129,0.18), transparent 55%), ${colors.bg}`, color: colors.text, padding: 16 }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Logo accent={colors.accent} />
              <div>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: 0.2, lineHeight: 1.1 }}>Репорт</h2>
                <div style={{ color: colors.hint, fontSize: 13 }}>Спасибо, что делаете Якутск чище!</div>
              </div>
            </div>

            <Link href="/" style={{ textDecoration: "none", color: colors.text, border: `1px solid ${colors.border}`, padding: "8px 10px", borderRadius: 12, background: "rgba(255,255,255,0.04)" }}>
              ← Назад
            </Link>
          </div>

          <div style={{ marginTop: 14, ...glass(colors.card, colors.border) }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontWeight: 900 }}>Фото</div>
              <div style={{ color: colors.hint, fontSize: 12 }}>{photoDataUrl ? "добавлено ✅" : "обязательно"}</div>
            </div>

            <div style={{ marginTop: 10 }}>
              <label style={uploadBox(colors.border)}>
                <input type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 14, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.10)", fontSize: 20 }}>📷</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800 }}>Выбрать фото</div>
                    <div style={{ color: colors.hint, fontSize: 12 }}>Рекомендуемый размер файла менее 3MB</div>
                  </div>
                  <div style={{ color: colors.hint, fontSize: 18 }}>›</div>
                </div>
              </label>

              {photoDataUrl && <img src={photoDataUrl} alt="preview" style={{ width: "100%", marginTop: 12, borderRadius: 16, border: `1px solid ${colors.border}` }} />}
            </div>

            <div style={{ marginTop: 14, fontWeight: 900 }}>Комментарий</div>
            <div style={{ marginTop: 8 }}>
              <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Например: мусор рядом с урной, у входа..." style={textarea(colors)} />
            </div>

            <div style={{ marginTop: 14 }}>
              <div>
                <div style={{ fontWeight: 900 }}>Геолокация</div>
                <div style={{ color: colors.hint, fontSize: 12, marginTop: 4 }}>Текущее: {geoLine}</div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10, marginTop: 12 }}>
                <button onClick={getGeo} style={outlineBtn(colors)}>📍 Отправить гео</button>
                <button onClick={() => { setPhotoDataUrl(null); setComment(""); setGeo(null); setStatus(""); }} style={ghostBtn(colors)}>🧽 Очистить все</button>
              </div>
            </div>

            <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 14, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.04)", color: status.includes("не") || status.includes("слиш") || status.includes("Ошибка") ? colors.danger : colors.hint, fontSize: 13, lineHeight: 1.35 }}>
              {status || "Добавьте фото и нажмите “Отправить”"}
            </div>
          </div>
        </div>
      </div>
    </>
  );
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
  return { background: cardBg, borderRadius: 18, padding: 14, border: `1px solid ${border}`, boxShadow: "0 10px 30px rgba(0,0,0,0.25)" };
}

function uploadBox(border: string): React.CSSProperties {
  return { display: "block", padding: 12, borderRadius: 16, border: `1px dashed ${border}`, background: "rgba(255,255,255,0.03)", cursor: "pointer", userSelect: "none" };
}

function textarea(colors: { text: string; border: string }): React.CSSProperties {
  return { width: "100%", boxSizing: "border-box", padding: 12, borderRadius: 16, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.03)", color: colors.text, outline: "none", lineHeight: 1.4, resize: "none", overflow: "auto", minHeight: 96, maxHeight: 160 };
}

function outlineBtn(colors: { text: string; border: string }): React.CSSProperties {
  return { width: "100%", minWidth: 0, height: 44, padding: "0 14px", boxSizing: "border-box", borderRadius: 14, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.04)", color: colors.text, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", whiteSpace: "nowrap" };
}

function ghostBtn(colors: { text: string; border: string }): React.CSSProperties {
  return { width: "100%", minWidth: 0, height: 44, padding: "0 14px", boxSizing: "border-box", borderRadius: 14, border: `1px solid ${colors.border}`, background: "rgba(255,255,255,0.02)", color: colors.text, fontWeight: 800, fontSize: 14, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, textAlign: "center", whiteSpace: "nowrap" };
}

function Logo({ accent }: { accent: string }) {
  return <div style={{ width: 34, height: 34, minWidth: 34, minHeight: 34, flexShrink: 0, borderRadius: 12, background: `linear-gradient(135deg, ${accent}, rgba(255,255,255,0.15))`, display: "grid", placeItems: "center", border: "1px solid rgba(255,255,255,0.14)", boxShadow: "0 10px 25px rgba(0,0,0,0.25)" }} aria-hidden><span style={{ fontSize: 18, lineHeight: 1 }}>♻️</span></div>;
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
