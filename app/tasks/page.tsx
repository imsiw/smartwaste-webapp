"use client";
import Script from "next/script";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function TasksPage() {
  const [isTg, setIsTg] = useState(false);

  useEffect(() => {
    const tg: any = (window as any).Telegram?.WebApp;
    if (!tg) return;
    setIsTg(true);
    tg.ready();
    tg.expand();
  }, []);

  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <div style={{ padding: 16, maxWidth: 520, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0 }}>Мои задачи</h2>
          <Link href="/" style={{ textDecoration: "none" }}>← Назад</Link>
        </div>

        <div style={{ border: "1px solid #ddd", borderRadius: 14, padding: 12, marginTop: 12 }}>
          {isTg ? (
            <>
              <div>Пока задач нет.</div>
            </>
          ) : (
            <div>Открой в Telegram.</div>
          )}
        </div>
      </div>
    </>
  );
}
