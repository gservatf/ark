"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { AuthPanel } from "@/components/auth/AuthPanel";
import { Button } from "@/components/shared/Button";
import { createBrowserClient } from "@/lib/supabase/browser";

export default function OnboardingPage() {
  const router = useRouter();
  const [organizationName, setOrganizationName] = useState("");
  const [ruc, setRuc] = useState("");
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [location, setLocation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const supabase = createBrowserClient();

    async function checkWorkspace() {
      const { data } = await supabase
        .from("organizacion_miembros")
        .select("id")
        .eq("estado", "activo")
        .limit(1)
        .maybeSingle();

      if (data) {
        router.replace("/");
        router.refresh();
        return;
      }

      setIsChecking(false);
    }

    void checkWorkspace();
  }, [router]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    const supabase = createBrowserClient();
    const { error: rpcError } = await supabase.rpc("create_organization_with_owner", {
      cliente: client || undefined,
      nombre_org: organizationName,
      nombre_proyecto: projectName,
      ruc_org: ruc,
      ubicacion: location || undefined
    });

    setIsLoading(false);

    if (rpcError) {
      setError(rpcError.message || "No se pudo crear el espacio de trabajo.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  if (isChecking) {
    return (
      <AuthPanel
        subtitle="Estamos validando si tu cuenta ya tiene una organización activa."
        title="Preparando acceso"
      >
        <p className="text-sm text-slate-600">Un momento...</p>
      </AuthPanel>
    );
  }

  return (
    <AuthPanel
      subtitle="Crea el espacio mínimo de ownership para que Supabase pueda aplicar permisos por organización y proyecto."
      title="Configurar organización"
    >
      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Organización</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setOrganizationName(event.target.value)}
            required
            value={organizationName}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">RUC</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            maxLength={11}
            onChange={(event) => setRuc(event.target.value)}
            placeholder="Opcional"
            value={ruc}
          />
        </label>
        <label className="block">
          <span className="text-sm font-semibold text-slate-700">Proyecto inicial</span>
          <input
            className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
            onChange={(event) => setProjectName(event.target.value)}
            required
            value={projectName}
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Cliente</span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setClient(event.target.value)}
              placeholder="Opcional"
              value={client}
            />
          </label>
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Ubicación</span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Opcional"
              value={location}
            />
          </label>
        </div>

        {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

        <Button className="w-full justify-center" disabled={isLoading} type="submit">
          {isLoading ? "Creando..." : "Crear espacio de trabajo"}
        </Button>
      </form>
    </AuthPanel>
  );
}
