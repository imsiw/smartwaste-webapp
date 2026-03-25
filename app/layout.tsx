import Script from "next/script";

export const metadata = {
  title: "SmartWaste WebApp",
  description: "Telegram WebApp",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body style={{ fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial" }}>
        <Script
          src="https://telegram.org/js/telegram-web-app.js"
          strategy="beforeInteractive"
        />
        {children}
      </body>
    </html>
  );
}