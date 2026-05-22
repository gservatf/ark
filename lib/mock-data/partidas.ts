import type { GrupoApu, Partida, PartidaRecurso, Recurso } from "@/types/domain";
import { mockResources } from "@/lib/mock-data/resources";

export const mockPartidas: Partida[] = [
  {
    id: "part-tarrajeo-muros",
    codigo: "01.01.01",
    nombre: "Tarrajeo en muros interiores",
    unidad: "m2",
    categoria: "Arquitectura",
    descripcion: "Acabado con mortero cemento-arena para muros interiores.",
    especificaciones: "Incluye preparación de superficie, aplicación y curado inicial.",
    rendimiento: 12,
    cuadrilla: "1 maestro + 2 peones",
    estado: "activo",
    created_at: "2026-04-02",
    updated_at: "2026-05-10"
  },
  {
    id: "part-concreto-210",
    codigo: "02.03.01",
    nombre: "Concreto f'c=210 kg/cm2",
    unidad: "m3",
    categoria: "Estructuras",
    descripcion: "Concreto preparado en obra para elementos estructurales.",
    especificaciones: "Dosificacion referencial para resistencia de 210 kg/cm2.",
    rendimiento: 8,
    cuadrilla: "1 maestro + 2 peones + mezcladora",
    estado: "activo",
    created_at: "2026-04-08",
    updated_at: "2026-05-09"
  },
  {
    id: "part-piso-porcelanato",
    codigo: "03.02.04",
    nombre: "Piso porcelanato 60x60",
    unidad: "m2",
    categoria: "Acabados",
    descripcion: "Instalacion de porcelanato en piso con adhesivo cementicio.",
    especificaciones: "Incluye alineamiento, nivelacion y limpieza final.",
    rendimiento: 18,
    cuadrilla: "1 operario + 1 peon",
    estado: "activo",
    created_at: "2026-04-12",
    updated_at: "2026-05-07"
  },
  {
    id: "part-pintura-latex",
    codigo: "04.01.02",
    nombre: "Pintura latex en muros y cielos",
    unidad: "m2",
    categoria: "Acabados",
    descripcion: "Aplicacion de pintura latex en dos manos sobre superficie preparada.",
    especificaciones: "Partida referencial pendiente de completar con recursos mock.",
    rendimiento: 30,
    cuadrilla: "1 operario + 1 peon",
    estado: "inactivo",
    created_at: "2026-04-15",
    updated_at: "2026-05-01"
  }
];

export const mockPartidaResources: PartidaRecurso[] = [
  createPartidaResource({
    id: "apu-tarrajeo-cemento",
    partidaId: "part-tarrajeo-muros",
    recursoId: "rec-cemento-portland",
    grupo: "materiales",
    cantidad: 0.22,
    desperdicio: 4,
    orden: 1
  }),
  createPartidaResource({
    id: "apu-tarrajeo-arena",
    partidaId: "part-tarrajeo-muros",
    recursoId: "rec-arena-gruesa",
    grupo: "materiales",
    cantidad: 0.025,
    desperdicio: 5,
    orden: 2
  }),
  createPartidaResource({
    id: "apu-tarrajeo-maestro",
    partidaId: "part-tarrajeo-muros",
    recursoId: "rec-maestro-obra",
    grupo: "mano_obra",
    cantidad: 0.08,
    desperdicio: 0,
    orden: 3
  }),
  createPartidaResource({
    id: "apu-tarrajeo-peon",
    partidaId: "part-tarrajeo-muros",
    recursoId: "rec-peon",
    grupo: "mano_obra",
    cantidad: 0.16,
    desperdicio: 0,
    orden: 4
  }),
  createPartidaResource({
    id: "apu-tarrajeo-mezcladora",
    partidaId: "part-tarrajeo-muros",
    recursoId: "rec-mezcladora",
    grupo: "equipos_herramientas",
    cantidad: 0.04,
    desperdicio: 0,
    orden: 5
  }),
  createPartidaResource({
    id: "apu-concreto-cemento",
    partidaId: "part-concreto-210",
    recursoId: "rec-cemento-portland",
    grupo: "materiales",
    cantidad: 8.5,
    desperdicio: 3,
    orden: 1
  }),
  createPartidaResource({
    id: "apu-concreto-arena",
    partidaId: "part-concreto-210",
    recursoId: "rec-arena-gruesa",
    grupo: "materiales",
    cantidad: 0.48,
    desperdicio: 5,
    orden: 2
  }),
  createPartidaResource({
    id: "apu-concreto-maestro",
    partidaId: "part-concreto-210",
    recursoId: "rec-maestro-obra",
    grupo: "mano_obra",
    cantidad: 0.12,
    desperdicio: 0,
    orden: 3
  }),
  createPartidaResource({
    id: "apu-concreto-peon",
    partidaId: "part-concreto-210",
    recursoId: "rec-peon",
    grupo: "mano_obra",
    cantidad: 0.28,
    desperdicio: 0,
    orden: 4
  }),
  createPartidaResource({
    id: "apu-concreto-mezcladora",
    partidaId: "part-concreto-210",
    recursoId: "rec-mezcladora",
    grupo: "equipos_herramientas",
    cantidad: 0.35,
    desperdicio: 0,
    orden: 5
  }),
  createPartidaResource({
    id: "apu-porcelanato-cemento",
    partidaId: "part-piso-porcelanato",
    recursoId: "rec-cemento-portland",
    grupo: "materiales",
    cantidad: 0.08,
    desperdicio: 3,
    orden: 1
  }),
  createPartidaResource({
    id: "apu-porcelanato-maestro",
    partidaId: "part-piso-porcelanato",
    recursoId: "rec-maestro-obra",
    grupo: "mano_obra",
    cantidad: 0.07,
    desperdicio: 0,
    orden: 2
  }),
  createPartidaResource({
    id: "apu-porcelanato-peon",
    partidaId: "part-piso-porcelanato",
    recursoId: "rec-peon",
    grupo: "mano_obra",
    cantidad: 0.08,
    desperdicio: 0,
    orden: 3
  })
];

export function mapResourceTypeToApuGroup(resource: Recurso): GrupoApu {
  if (resource.tipo === "material") {
    return "materiales";
  }

  if (resource.tipo === "mano_obra") {
    return "mano_obra";
  }

  return "equipos_herramientas";
}

function createPartidaResource({
  cantidad,
  desperdicio,
  grupo,
  id,
  orden,
  partidaId,
  recursoId,
  rendimientoFactor = 1
}: {
  cantidad: number;
  desperdicio: number;
  grupo: GrupoApu;
  id: string;
  orden: number;
  partidaId: string;
  recursoId: string;
  rendimientoFactor?: number;
}): PartidaRecurso {
  const resource = mockResources.find((item) => item.id === recursoId);

  if (!resource) {
    throw new Error(`No existe el recurso mock ${recursoId}.`);
  }

  return {
    id,
    partida_id: partidaId,
    recurso_id: recursoId,
    grupo,
    cantidad,
    unidad: resource.unidad,
    costo_unitario_snapshot: resource.costo_unitario_actual,
    costo_transporte_snapshot: resource.costo_transporte,
    rendimiento_factor: rendimientoFactor,
    desperdicio_porcentaje: desperdicio,
    parcial: 0,
    orden
  };
}
