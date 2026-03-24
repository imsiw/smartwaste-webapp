"use client";

import { useEffect, useState } from "react";

type ThemeParams = {
  bg_color?: string;
  text_color?: string;
  hint_color?: string;
  button_color?: string;
  button_text_color?: string;
  secondary_bg_color?: string;
};

type Tg = {
  ready: () => void;
  expand: () => void;
  themeParams?: ThemeParams;
  HapticFeedback?: {
    notificationOccurred?: (type: "success" | "error" | "warning") => void;
  };
  MainButton: {
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  initData?: string;
  initDataUnsafe?: {
    user?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
  LocationManager?: {
    init?: (cb: () => void) => void;
    getLocation: (cb: (loc: any) => void) => void;
  };
};

type Geo = { lat: number; lon: number; acc?: number } | null;

export default function ReportPage() {
  const [theme, setTheme] = useState<ThemeParams>({});
  const [isTg, setIsTg] = useState(false);
  const [comment, setComment] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string>("");
  const [geo, setGeo] = useState<Geo>(null);
  const [status, setStatus] = useState("Добавь фото, при желании комментарий и геолокацию.");
  const [sending, setSending] = useState(false);

  function getTelegramHeaders() {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;

    return {
      "Content-Type": "application/json",
      "x-telegram-init-data": tg?.initData || "",
      "x-telegram-id": String(tg?.initDataUnsafe?.user?.id || ""),
      "x-telegram-username": tg?.initDataUnsafe?.user?.username || "",
      "x-telegram-first-name": tg?.initDataUnsafe?.user?.first_name || "",
      "x-telegram-last-name": tg?.initDataUnsafe?.user?.last_name || "",
    };
  }

  useEffect(() => {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;

    console.log("TG object:", tg);
    console.log("TG initData:", tg?.initData);
    console.log("TG initDataUnsafe:", tg?.initDataUnsafe);
    console.log("TG user:", tg?.initDataUnsafe?.user);

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
    } catch {}
  }, []);

  useEffect(() => {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;
    if (!tg) return;

    const handler = () => {
      void submitReport();
    };

    try {
      tg.MainButton.onClick(handler);
      return () => {
        try {
          tg.MainButton.offClick(handler);
        } catch {}
      };
    } catch {}
  }, [photoDataUrl, comment, geo]);

  async function onPickPhoto(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || "");
      setPhotoDataUrl(result);
      setStatus("Фото добавлено ✅");
    };
    reader.readAsDataURL(file);
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
              setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)}`);
            },
            () => {
              setGeo(null);
              setStatus("Гео не получено.");
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
          );
          return;
        }

        setStatus("Геолокация не поддерживается.");
        return;
      }

      if (typeof lm.init === "function") {
        lm.init(() => {
          lm.getLocation((loc: any) => {
            if (!loc) {
              setGeo(null);
              setStatus("Гео не получено.");
              return;
            }

            const lat = Number(loc.latitude);
            const lon = Number(loc.longitude);
            const acc = Number(loc.horizontal_accuracy);

            if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
              setGeo(null);
              setStatus("Гео в неверном формате.");
              return;
            }

            const g = { lat, lon, acc: Number.isFinite(acc) ? acc : undefined };
            setGeo(g);
            setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)}`);
          });
        });
        return;
      }

      lm.getLocation((loc: any) => {
        if (!loc) {
          setGeo(null);
          setStatus("Гео не получено.");
          return;
        }

        const lat = Number(loc.latitude);
        const lon = Number(loc.longitude);
        const acc = Number(loc.horizontal_accuracy);

        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
          setGeo(null);
          setStatus("Гео в неверном формате.");
          return;
        }

        const g = { lat, lon, acc: Number.isFinite(acc) ? acc : undefined };
        setGeo(g);
        setStatus(`Гео: ${g.lat.toFixed(5)}, ${g.lon.toFixed(5)}`);
      });
    } catch (e: any) {
      setStatus(`Ошибка гео: ${e?.message || "неизвестная ошибка"}`);
    }
  }

  async function submitReport() {
    const tg: Tg | undefined = (window as any).Telegram?.WebApp;
    if (!tg) {
      setStatus("Открой в Telegram.");
      return;
    }

    if (!photoDataUrl) {
      setStatus("Добавь фото.");
      return;
    }

    setSending(true);
    setStatus("Отправляем…");

    try {
      const headers = getTelegramHeaders();
      console.log("Sending headers:", headers);

      const res = await fetch("/api/reports", {
        method: "POST",
        headers,
        body: JSON.stringify({
          comment,
          geo,
          photoDataUrl,
        }),
      });

      const data = await res.json();
      console.log("Report response:", data);

      if (!res.ok || !data?.ok) {
        setStatus(data?.error || "Не удалось отправить репорт.");
        tg.HapticFeedback?.notificationOccurred?.("error");
        return;
      }

      setStatus("Репорт отправлен ✅");
      tg.HapticFeedback?.notificationOccurred?.("success");
    } catch (e: any) {
      console.error(e);
      setStatus(e?.message || "Ошибка сети.");
      tg.HapticFeedback?.notificationOccurred?.("error");
    } finally {
      setSending(false);
    }
  }

  const bg = theme.bg_color || "#17212b";
  const card = theme.secondary_bg_color || "#232e3c";
  const text = theme.text_color || "#ffffff";
  const hint = theme.hint_color || "#9db2c8";
  const btn = theme.button_color || "#3b82f6";
  const btnText = theme.button_text_color || "#ffffff";

  return (
    <main
      style={{
        minHeight: "100vh",
        background: bg,
        color: text,
        padding: 16,
        fontFamily: "Inter, Arial, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 560,
          margin: "0 auto",
          background: card,
          borderRadius: 20,
          padding: 16,
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Сообщить о мусоре</h1>

        <p style={{ color: hint, marginBottom: 16 }}>{status}</p>

        <label
          style={{
            display: "block",
            marginBottom: 12,
            padding: 12,
            borderRadius: 12,
            background: bg,
            cursor: "pointer",
          }}
        >
          <div style={{ marginBottom: 8 }}>Добавить фото</div>
          <input
            type="file"
            accept="image/*"
            style={{ display: "block" }}
            onChange={(e) => onPickPhoto(e.target.files?.[0])}
          />
        </label>

        {photoDataUrl ? (
          <img
            src={photoDataUrl}
            alt="preview"
            style={{
              width: "100%",
              borderRadius: 12,
              marginBottom: 12,
              objectFit: "cover",
              maxHeight: 280,
            }}
          />
        ) : null}

        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий"
          rows={4}
          style={{
            width: "100%",
            borderRadius: 12,
            padding: 12,
            border: "none",
            outline: "none",
            resize: "vertical",
            background: bg,
            color: text,
            marginBottom: 12,
          }}
        />

        <button
          onClick={getGeo}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            background: btn,
            color: btnText,
            fontWeight: 600,
            marginBottom: 12,
            cursor: "pointer",
          }}
        >
          Получить геолокацию
        </button>

        <button
          onClick={() => void submitReport()}
          disabled={sending}
          style={{
            width: "100%",
            border: "none",
            borderRadius: 12,
            padding: "12px 16px",
            background: btn,
            color: btnText,
            fontWeight: 700,
            cursor: "pointer",
            opacity: sending ? 0.7 : 1,
          }}
        >
          {sending ? "Отправляем..." : "Отправить"}
        </button>

        <div style={{ marginTop: 12, color: hint, fontSize: 13 }}>
          Telegram mode: {isTg ? "yes" : "no"}
        </div>
      </div>
    </main>
  );
}