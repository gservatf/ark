import { Mail, Phone, WalletCards, Wrench } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import type { Proveedor, Recurso } from "@/types/domain";

type ProviderMetricsProps = {
  providers: Proveedor[];
  resources: Recurso[];
};

export function ProviderMetrics({ providers, resources }: ProviderMetricsProps) {
  const activeProviders = providers.filter((provider) => provider.estado === "activo").length;
  const providersWithEmail = providers.filter((provider) => provider.email).length;
  const providersWithPhone = providers.filter((provider) => provider.telefono).length;
  const usedProviderIds = new Set(
    resources.map((resource) => resource.proveedor_id).filter((providerId): providerId is string => Boolean(providerId))
  );

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={WalletCards}
        label="Proveedores registrados"
        link={`${activeProviders} activos`}
        tone="sky"
        value={String(providers.length)}
      />
      <StatCard
        icon={Wrench}
        label="Con recursos vinculados"
        link="Usados por recursos"
        tone="green"
        value={String(usedProviderIds.size)}
      />
      <StatCard
        icon={Mail}
        label="Con email"
        link="Contacto comercial"
        tone="violet"
        value={String(providersWithEmail)}
      />
      <StatCard
        icon={Phone}
        label="Con teléfono"
        link="Contacto directo"
        tone="amber"
        value={String(providersWithPhone)}
      />
    </section>
  );
}
