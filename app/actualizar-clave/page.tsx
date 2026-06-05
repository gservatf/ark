"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/shared/Button";
import { updatePassword } from "@/lib/auth/client";
import { passwordRequirementsMessage, validatePassword } from "@/lib/auth/security";

export default function ActualizarClavePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!validatePassword(password)) {
      setError(passwordRequirementsMessage);
      return;
    }

    setIsLoading(true);
    const updateResult = await updatePassword({ password });
    setIsLoading(false);

    if (!updateResult.ok) {
      setError("No se pudo actualizar la contrasena. Abre nuevamente el enlace de recuperacion.");
      return;
    }

    router.replace("/?auth=password-updated");
    router.refresh();
  }

  return (
    <AuthPanel
      subtitle="Define una nueva contrasena para continuar trabajando."
      title="Actualizar contrasena"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Nueva contrasena</span>
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

        <Button className="w-full justify-center" disabled={isLoading} type="submit">
          {isLoading ? "Actualizando..." : "Guardar contrasena"}
        </Button>
      </form>
    </AuthPanel>
  );
}
