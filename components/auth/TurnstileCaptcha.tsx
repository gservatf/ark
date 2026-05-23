"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetId = string;

type TurnstileCaptchaProps = {
  onTokenChange: (token: string | null) => void;
  resetSignal?: number;
};

type TurnstileApi = {
  render: (
    container: HTMLElement,
    options: {
      callback: (token: string) => void;
      "error-callback": () => void;
      "expired-callback": () => void;
      sitekey: string;
      theme: "light";
    }
  ) => TurnstileWidgetId;
  reset: (widgetId: TurnstileWidgetId) => void;
  remove: (widgetId: TurnstileWidgetId) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const turnstileScriptId = "turnstile-api-script";
const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

function loadTurnstileScript() {
  if (document.getElementById(turnstileScriptId)) {
    return;
  }

  const script = document.createElement("script");
  script.async = true;
  script.defer = true;
  script.id = turnstileScriptId;
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
  document.head.appendChild(script);
}

export function isCaptchaEnabled() {
  return Boolean(turnstileSiteKey);
}

export function TurnstileCaptcha({ onTokenChange, resetSignal = 0 }: TurnstileCaptchaProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<TurnstileWidgetId | null>(null);

  useEffect(() => {
    if (!turnstileSiteKey) {
      return undefined;
    }

    let isMounted = true;
    loadTurnstileScript();

    const renderInterval = window.setInterval(() => {
      if (!isMounted || !window.turnstile || !containerRef.current || widgetIdRef.current) {
        return;
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        callback: (token) => onTokenChange(token),
        "error-callback": () => onTokenChange(null),
        "expired-callback": () => onTokenChange(null),
        sitekey: turnstileSiteKey,
        theme: "light"
      });
      window.clearInterval(renderInterval);
    }, 100);

    return () => {
      isMounted = false;
      window.clearInterval(renderInterval);

      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [onTokenChange]);

  useEffect(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current);
      onTokenChange(null);
    }
  }, [onTokenChange, resetSignal]);

  if (!turnstileSiteKey) {
    return null;
  }

  return <div ref={containerRef} className="min-h-[65px]" />;
}
