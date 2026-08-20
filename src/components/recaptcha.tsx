"use client";

import * as React from "react";
import Script from "next/script";

import { RECAPTCHA_SITE_KEY } from "@/lib/config";

declare global {
  interface Window {
    grecaptcha?: {
      // `render` baru tersedia setelah skrip inti selesai dimuat; api.js
      // mendefinisikan objek grecaptcha lebih dulu sebagai stub.
      render?: (
        container: HTMLElement,
        params: {
          sitekey: string;
          callback: (token: string) => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark";
        }
      ) => number;
      reset?: (widgetId?: number) => void;
    };
    onRecaptchaApiLoad?: () => void;
  }
}

interface RecaptchaProps {
  onVerify: (token: string | null) => void;
  theme?: "light" | "dark";
}

// API baru benar-benar siap kalau `render` sudah ada, bukan sekadar objek
// `grecaptcha` (api.js memasang stub-nya sebelum skrip inti selesai dimuat).
function isRecaptchaReady() {
  return typeof window.grecaptcha?.render === "function";
}

export function Recaptcha({ onVerify, theme = "light" }: RecaptchaProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const widgetIdRef = React.useRef<number | null>(null);
  const [scriptReady, setScriptReady] = React.useState(false);

  const renderWidget = React.useCallback(() => {
    if (!containerRef.current || !isRecaptchaReady() || widgetIdRef.current !== null) return;
    widgetIdRef.current = window.grecaptcha!.render!(containerRef.current, {
      sitekey: RECAPTCHA_SITE_KEY,
      theme,
      callback: (token: string) => onVerify(token),
      "expired-callback": () => onVerify(null),
    });
  }, [onVerify, theme]);

  // Callback `onload` harus terdaftar sebelum <Script> menyuntikkan api.js,
  // jadi didaftarkan di sini, bukan di onReady. Polling menjadi cadangan untuk
  // kasus skrip sudah pernah dimuat (navigasi klien) sehingga onload tidak
  // pernah dipanggil lagi.
  React.useEffect(() => {
    window.onRecaptchaApiLoad = () => setScriptReady(true);
    const timer = window.setInterval(() => {
      if (!isRecaptchaReady()) return;
      window.clearInterval(timer);
      setScriptReady(true);
    }, 100);

    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (scriptReady) renderWidget();
  }, [scriptReady, renderWidget]);

  return (
    <>
      <Script
        src="https://www.google.com/recaptcha/api.js?onload=onRecaptchaApiLoad&render=explicit"
        strategy="afterInteractive"
        onError={() => {
          // Skrip reCAPTCHA gagal dimuat (mis. tidak ada akses internet ke
          // google.com). Beri tahu form supaya bisa menampilkan pesan yang jelas.
          onVerify(null);
        }}
      />
      <div ref={containerRef} className="min-h-[78px]" />
    </>
  );
}
