"use client";

import Link from "next/link";
import { useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/shared/Button";
import { createBrowserClient } from "@/lib/supabase/browser";
import { buildAppUrl } from "@/lib/supabase/config";

export default function RecuperarClavePage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setIsLoading(true);

    const supabase = createBrowserClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: buildAppUrl("/actualizar-clave")
    });
    setIsLoading(false);

    if (resetError) {
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
