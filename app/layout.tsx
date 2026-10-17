import type { Metadata } from "next";
import Script from "next/script";
import ThemeProvider from "./components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Aisle AI — Closed-Loop Commerce Copilot", template: "%s | Aisle AI" },
  description: "Gemini-powered conversational shopping and merchant intelligence, from customer intent to fulfillment insight.",
  icons: {
    icon: "/images/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Apply saved theme before paint to avoid a flash of the wrong theme */}
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem('app-theme')||'daylight';var dark=(t==='midnight'||t==='forest');document.documentElement.setAttribute('data-theme',t);document.documentElement.setAttribute('data-bs-theme',dark?'dark':'light');}catch(e){}})();`}
        </Script>

        {/* STYLESHEETS */}
        <link rel="stylesheet" href="/css/style.css" />
        <link rel="stylesheet" href="/css/skin/skin-1.css" />

      </head>
      <body>
        <ThemeProvider />
        {children}

        {/* JAVASCRIPT FILES */}
        <Script src="/vendor/bootstrap/dist/js/bootstrap.bundle.min.js" strategy="afterInteractive" />

      </body>
    </html>
  );
}
