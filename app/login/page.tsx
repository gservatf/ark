"use client";

import { Chrome } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/shared/Button";
import { buildOAuthRedirectTo } from "@/lib/auth/oauth";
import { sanitizeNextPath } from "@/lib/auth/security";
import { createBrowserClient } from "@/lib/supabase/browser";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(process.env.NODE_ENV !== "production" ? "owner@cyp.local" : "");
  const [password, setPassword] = useState(process.env.NODE_ENV !== "production" ? "Password123!" : "");
  const [error, setError] = useState<string | null>(
    searchParams.get("oauth") === "error"
      ? "No se pudo completar el inicio de sesión con Google."
      : null
  );
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    setIsLoading(false);

    if (signInError) {
      setError("No se pudo iniciar sesión. Revisa el correo y la contraseña.");
      return;
    }

    router.replace(sanitizeNextPath(searchParams.get("next")));
    router.refresh();
  }

  async function handleGoogleSignIn() {
    setError(null);
    setIsGoogleLoading(true);

    const supabase = createBrowserClient();
    const { error: googleError } = await supabase.auth.signInWithOAuth({
      options: {
        redirectTo: buildOAuthRedirectTo(searchParams.get("next"))
      },
      provider: "google"
    });

    if (googleError) {
      setError("No se pudo iniciar sesión con Google. Revisa la configuración de OAuth.");
      setIsGoogleLoading(false);
    }
  }

  return (
    <AuthPanel
      subtitle="Ingresa con Google o con una cuenta de Supabase Auth. En local puedes usar los usuarios demo del seed."
      title="Iniciar sesión"
    >
      <Button
        className="mb-4 w-full justify-center"
        disabled={isGoogleLoading || isLoading}
        icon={Chrome}
        onClick={() => void handleGoogleSignIn()}
        variant="secondary"
      >
        {isGoogleLoading ? "Abriendo Google..." : "Continuar con Google"}
      </Button>

      <div className="mb-4 flex items-center gap-3 text-xs font-semibold uppercase text-slate-400">
        <span className="h-px flex-1 bg-slate-200" />
        o ingresa con correo
        <span className="h-px flex-1 bg-slate-200" />
      </div>

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
          <span className="text-sm font-semibold text-slate-700">Contraseña</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            value={password}
          />
        </label>

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <Button className="w-full justify-center" disabled={isLoading || isGoogleLoading} type="submit">
          {isLoading ? "Ingresando..." : "Entrar"}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
        <Link className="font-semibold text-brand-700 hover:text-brand-800" href="/registro">
          Crear cuenta
        </Link>
        <Link className="font-semibold text-slate-600 hover:text-slate-900" href="/recuperar-clave">
          Recuperar contraseña
        </Link>
      </div>
    </AuthPanel>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
