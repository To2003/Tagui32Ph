"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      reset: (id?: string) => void;
    };
  }
}

export function TurnstileWidget({
  onToken,
  resetTrigger,
}: {
  onToken: (token: string | null) => void;
  resetTrigger: number;
}) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [scriptCargado, setScriptCargado] = useState(false);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;

  useEffect(() => {
    if (!scriptCargado || !contenedorRef.current || !window.turnstile) return;
    widgetId.current = window.turnstile.render(contenedorRef.current, {
      sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      theme: "dark",
      callback: (token: string) => onTokenRef.current(token),
      "expired-callback": () => onTokenRef.current(null),
      "error-callback": () => onTokenRef.current(null),
    });
  }, [scriptCargado]);

  // El token de Turnstile es de un solo uso — después de un intento fallido
  // hay que pedir uno nuevo antes de poder reintentar.
  useEffect(() => {
    if (resetTrigger > 0 && widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetTrigger]);

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        async
        defer
        onLoad={() => setScriptCargado(true)}
      />
      <div ref={contenedorRef} />
    </>
  );
}
