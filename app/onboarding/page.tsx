"use client";

import { UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/shared/Button";
import { createDataBrowserClient } from "@/lib/data/browser-client";
import { completeUserOnboarding, getOnboardingStatus } from "@/lib/data/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const client = useMemo(() => createDataBrowserClient(), []);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function checkWorkspace() {
      const statusResult = await getOnboardingStatus(client);

      if (statusResult.ok && statusResult.data.hasPersonalOrganization) {
        router.replace("/");
        router.refresh();
        return;
      }

      setIsChecking(false);
    }

    void checkWorkspace();
  }, [client, router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!firstName.trim() || !lastName.trim()) {
      setError("Ingresa tu nombre y apellido para continuar.");
      return;
    }

    setIsLoading(true);

    const onboardingResult = await completeUserOnboarding(client, {
      apellido: lastName,
      nombre: firstName
    });

    setIsLoading(false);

    if (!onboardingResult.ok) {
      setError(onboardingResult.error.message || "No se pudo guardar tu perfil.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (isChecking) {
    return (
      <AuthPanel subtitle="Estamos revisando si tu cuenta ya tiene un espacio de trabajo." title="Preparando acceso">
        <p className="text-sm text-slate-600">Un momento...</p>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      subtitle="Usaremos estos datos para identificarte en actividad, colaboracion y cambios del sistema."
      title="Completa tu perfil"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-brand-600">
          <UserRound className="h-6 w-6" />
        </span>

        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Nombre</span>
          <input
            autoComplete="given-name"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            maxLength={80}
            onChange={(event) => setFirstName(event.target.value)}
            required
            value={firstName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Apellido</span>
          <input
            autoComplete="family-name"
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            maxLength={80}
            onChange={(event) => setLastName(event.target.value)}
            required
            value={lastName}
          />
        </label>

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <Button className="w-full justify-center" disabled={isLoading} type="submit">
          {isLoading ? "Guardando..." : "Continuar al dashboard"}
        </Button>
      </form>
    </AuthPanel>
  );
}
