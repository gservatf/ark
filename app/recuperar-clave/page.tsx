"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { TurnstileCaptcha, isCaptchaEnabled } from "@/components/auth/TurnstileCaptcha";
import { Button } from "@/components/shared/Button";
import { sendPasswordReset } from "@/lib/auth/client";
import { buildOAuthRedirectTo } from "@/lib/auth/oauth";

export default function RecuperarClavePage() {
  const [email, setEmail] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (isCaptchaEnabled() && !captchaToken) {
      setError("Completa la verificacion de seguridad antes de enviar el enlace.");
      return;
    }

    setIsLoading(true);

    const resetResult = await sendPasswordReset({
      captchaToken,
      email,
      redirectTo: buildOAuthRedirectTo("/actualizar-clave")
    });
    setIsLoading(false);
    setCaptchaResetSignal((current) => current + 1);

    if (!resetResult.ok) {
      setError("No se pudo enviar el correo de recuperación.");
      return;
    }

    setMessage("Si el correo existe, recibirás un enlace para actualizar tu contraseña.");
  }

  return (
    <AuthPanel
      subtitle="Te enviaremos un enlace de recuperación usando Supabase Auth."
      title="Recuperar contraseña"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Correo</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            value={email}
          />
        </label>

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        <TurnstileCaptcha onTokenChange={setCaptchaToken} resetSignal={captchaResetSignal} />

        <Button className="w-full justify-center" disabled={isLoading} type="submit">
          {isLoading ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>

      <Link className="mt-5 inline-block text-sm font-semibold text-brand-700 hover:text-brand-800" href="/login">
        Volver a iniciar sesión
      </Link>
    </AuthPanel>
  );
}
