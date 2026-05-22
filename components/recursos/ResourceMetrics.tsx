import { Boxes, Building2, Clock3, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import type { Recurso, RecursoPrecioHistorial } from "@/types/domain";

type ResourceMetricsProps = {
  history: RecursoPrecioHistorial[];
  resources: Recurso[];
  providerCount: number;
};

export function ResourceMetrics({
  history,
  providerCount,
  resources
}: ResourceMetricsProps) {
  const activeCount = resources.filter((resource) => resource.estado === "activo").length;
  const inactiveCount = resources.length - activeCount;
  const latestChange = history[0];
  const variation = latestChange
    ? latestChange.costo_unitario_nuevo - latestChange.costo_unitario_anterior
    : 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={Boxes}
        label="Recursos registrados"
        link="Catálogo canónico"
        tone="sky"
        value={String(resources.length)}
      />
      <StatCard
        icon={TrendingUp}
        label="Recursos activos"
        link="Listos para APU"
        tone="green"
        value={String(activeCount)}
      />
      <StatCard
        icon={Clock3}
        label="Inactivos"
        link="Ver histórico"
        tone="amber"
        value={String(inactiveCount)}
      />
      <StatCard
        icon={Building2}
        label="Proveedores"
        link={variation >= 0 ? "Ultima variacion positiva" : "Ultima variacion negativa"}
        tone="violet"
        value={String(providerCount)}
      />
    </section>
  );
}
