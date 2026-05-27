import { Boxes, Calculator, FileSpreadsheet, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { formatCurrency } from "@/components/partidas/partida-ui";
import {
  calculateApuDirectCost
} from "@/lib/calculations/apu";
import type { Partida, PartidaRecurso } from "@/types/domain";

type PartidaMetricsProps = {
  partidas: Partida[];
  resources: PartidaRecurso[];
};

export function PartidaMetrics({ partidas, resources }: PartidaMetricsProps) {
  const activeCount = partidas.filter((partida) => partida.estado === "activo").length;
  const categories = new Set(partidas.map((partida) => partida.categoria).filter(Boolean));
  const averageUnitPrice =
    partidas.length > 0
      ? partidas.reduce((total, partida) => {
          const apuResources = resources.filter((resource) => resource.partida_id === partida.id);
          const directCost = calculateApuDirectCost(apuResources, partida);

          return total + directCost.costo_directo;
        }, 0) / partidas.length
      : 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatCard
        icon={FileSpreadsheet}
        label="Partidas registradas"
        link="Supabase"
        tone="sky"
        value={String(partidas.length)}
      />
      <StatCard
        icon={TrendingUp}
        label="Partidas activas"
        link="Listas para presupuesto"
        tone="green"
        value={String(activeCount)}
      />
      <StatCard
        icon={Boxes}
        label="Categorias"
        link="Agrupacion tecnica"
        tone="amber"
        value={String(categories.size)}
      />
      <StatCard
        icon={Calculator}
        label="Precio unitario prom."
        link="Costo directo APU"
        tone="violet"
        value={formatCurrency(averageUnitPrice)}
      />
    </section>
  );
}
