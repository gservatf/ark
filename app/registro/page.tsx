"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { TurnstileCaptcha, isCaptchaEnabled } from "@/components/auth/TurnstileCaptcha";
import { Button } from "@/components/shared/Button";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { passwordRequirementsMessage, validatePassword } from "@/lib/auth/security";
import { buildAppUrl, getSupabaseBrowserConfig } from "@/lib/supabase/config";

type SignupResult = {
  session: unknown | null;
};

async function signUpWithEmail(input: { captchaToken: string | null; email: string; password: string }) {
  const { supabaseKey, supabaseUrl } = getSupabaseBrowserConfig();
  const redirectTo = buildAppUrl("/onboarding");
  const response = await fetch(`${supabaseUrl}/auth/v1/signup?redirect_to=${encodeURIComponent(redirectTo)}`, {
    body: JSON.stringify({
      data: {},
      email: input.email,
      gotrue_meta_security: input.captchaToken ? { captcha_token: input.captchaToken } : {},
      password: input.password
    }),
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      "X-Client-Info": "cyp-web-signup"
    },
    method: "POST"
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.msg || payload?.message || `Supabase Auth respondio ${response.status}.`);
  }

  return {
    session: payload?.session ?? null
  } satisfies SignupResult;
}

export default function RegistroPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaResetSignal, setCaptchaResetSignal] = useState(0);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!validatePassword(password)) {
      setError(passwordRequirementsMessage);
      return;
    }

    if (isCaptchaEnabled() && !captchaToken) {
      setError("Completa la verificacion de seguridad antes de crear la cuenta.");
      return;
    }

    setIsLoading(true);
    const result = await signUpWithEmail({ captchaToken, email, password }).catch((requestError: Error) => ({
      error: requestError,
      session: null
    }));
    setIsLoading(false);
    setCaptchaResetSignal((current) => current + 1);

    if ("error" in result) {
      setError(getAuthErrorMessage(result.error, "No se pudo crear la cuenta."));
      return;
    }

    if (!result.session) {
      setMessage("Cuenta creada. Revisa tu correo para confirmar el acceso antes de iniciar sesion.");
      return;
    }

    router.replace("/onboarding");
    router.refresh();
  }

  return (
    <AuthPanel
      subtitle="Crea tu cuenta y luego registra la primera organización y proyecto de trabajo."
      title="Crear cuenta"
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
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Contrasena</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            minLength={12}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
        {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}

        <TurnstileCaptcha onTokenChange={setCaptchaToken} resetSignal={captchaResetSignal} />

        <Button className="w-full justify-center" disabled={isLoading} type="submit">
          {isLoading ? "Creando..." : "Crear cuenta"}
        </Button>
      </form>

      <p className="mt-5 text-sm text-slate-600">
        Ya tienes cuenta?{" "}
        <Link className="font-semibold text-brand-700 hover:text-brand-800" href="/login">
          Inicia sesión
        </Link>
      </p>
    </AuthPanel>
  );
}
