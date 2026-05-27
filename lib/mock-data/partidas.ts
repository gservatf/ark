import { calculateApuResourceValues, inferApuCalculationTypeFromResource } from "@/lib/calculations/apu";
import { mockResources } from "@/lib/mock-data/resources";
import type { GrupoApu, Partida, PartidaRecurso, Recurso } from "@/types/domain";

export const mockPartidas: Partida[] = [
  createPartida({
    categoria: "Arquitectura",
    codigo: "01.01.01",
    id: "part-tarrajeo-muros",
    nombre: "Tarrajeo en muros interiores",
    rendimiento: 12,
    subcategoria: "Muros",
    unidad: "m2"
  }),
  createPartida({
    categoria: "Estructuras",
    codigo: "02.03.01",
    id: "part-concreto-210",
    nombre: "Concreto f'c=210 kg/cm2",
    rendimiento: 8,
    subcategoria: "Concreto armado",
    unidad: "m3"
  }),
  createPartida({
    categoria: "Acabados",
    codigo: "03.02.04",
    id: "part-piso-porcelanato",
    nombre: "Piso porcelanato 60x60",
    rendimiento: 18,
    subcategoria: "Pisos",
    unidad: "m2"
  }),
  createPartida({
    categoria: "Acabados",
    codigo: "04.01.02",
    estado: "inactivo",
    id: "part-pintura-latex",
    nombre: "Pintura latex en muros y cielos",
    rendimiento: 30,
    subcategoria: "Pintura",
    unidad: "m2"
  })
];

export const mockPartidaResources: PartidaRecurso[] = [
  createPartidaResource({ cantidadBase: 0.22, grupo: "materiales", id: "apu-tarrajeo-cemento", orden: 1, partidaId: "part-tarrajeo-muros", recursoId: "rec-cemento-portland" }),
  createPartidaResource({ cantidadBase: 0.025, grupo: "materiales", id: "apu-tarrajeo-arena", orden: 2, partidaId: "part-tarrajeo-muros", recursoId: "rec-arena-gruesa" }),
  createPartidaResource({ cuadrilla: 0.12, grupo: "mano_obra", id: "apu-tarrajeo-maestro", orden: 3, partidaId: "part-tarrajeo-muros", recursoId: "rec-maestro-obra" }),
  createPartidaResource({ cuadrilla: 0.24, grupo: "mano_obra", id: "apu-tarrajeo-peon", orden: 4, partidaId: "part-tarrajeo-muros", recursoId: "rec-peon" }),
  createPartidaResource({ cuadrilla: 0.06, grupo: "equipos_herramientas", id: "apu-tarrajeo-mezcladora", orden: 5, partidaId: "part-tarrajeo-muros", recursoId: "rec-mezcladora" }),
  createPartidaResource({ cantidadBase: 8.5, grupo: "materiales", id: "apu-concreto-cemento", orden: 1, partidaId: "part-concreto-210", recursoId: "rec-cemento-portland" }),
  createPartidaResource({ cantidadBase: 0.48, grupo: "materiales", id: "apu-concreto-arena", orden: 2, partidaId: "part-concreto-210", recursoId: "rec-arena-gruesa" }),
  createPartidaResource({ cuadrilla: 0.12, grupo: "mano_obra", id: "apu-concreto-maestro", orden: 3, partidaId: "part-concreto-210", recursoId: "rec-maestro-obra" }),
  createPartidaResource({ cuadrilla: 0.28, grupo: "mano_obra", id: "apu-concreto-peon", orden: 4, partidaId: "part-concreto-210", recursoId: "rec-peon" }),
  createPartidaResource({ cuadrilla: 0.35, grupo: "equipos_herramientas", id: "apu-concreto-mezcladora", orden: 5, partidaId: "part-concreto-210", recursoId: "rec-mezcladora" }),
  createPartidaResource({ cantidadBase: 0.08, grupo: "materiales", id: "apu-porcelanato-cemento", orden: 1, partidaId: "part-piso-porcelanato", recursoId: "rec-cemento-portland" }),
  createPartidaResource({ cuadrilla: 0.16, grupo: "mano_obra", id: "apu-porcelanato-maestro", orden: 2, partidaId: "part-piso-porcelanato", recursoId: "rec-maestro-obra" }),
  createPartidaResource({ cuadrilla: 0.18, grupo: "mano_obra", id: "apu-porcelanato-peon", orden: 3, partidaId: "part-piso-porcelanato", recursoId: "rec-peon" })
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

function createPartida({
  categoria,
  codigo,
  estado = "activo",
  id,
  nombre,
  rendimiento,
  subcategoria,
  unidad
}: {
  categoria: string;
  codigo: string;
  estado?: Partida["estado"];
  id: string;
  nombre: string;
  rendimiento: number;
  subcategoria: string;
  unidad: string;
}): Partida {
  return {
    categoria,
    codigo,
    created_at: "2026-04-02",
    desperdicio_materiales_porcentaje: 5,
    estado,
    especificaciones: "Partida referencial para datos de demostracion.",
    id,
    jornada_horas: 8,
    nombre,
    rendimiento,
    subcategoria,
    unidad,
    updated_at: "2026-05-10"
  };
}

function createPartidaResource({
  cantidadBase,
  cuadrilla,
  grupo,
  id,
  orden,
  partidaId,
  porcentajeAplicado,
  recursoId
}: {
  cantidadBase?: number;
  cuadrilla?: number;
  grupo: GrupoApu;
  id: string;
  orden: number;
  partidaId: string;
  porcentajeAplicado?: number;
  recursoId: string;
}): PartidaRecurso {
  const resource = mockResources.find((item) => item.id === recursoId);
  const partida = mockPartidas.find((item) => item.id === partidaId);

  if (!resource || !partida) {
    throw new Error("No existe el recurso o la partida mock.");
  }

  const tipoCalculo = inferApuCalculationTypeFromResource({ grupo, unidad: resource.unidad });
  const computed = calculateApuResourceValues(
    {
      cantidad: cantidadBase ?? cuadrilla ?? porcentajeAplicado ?? 0,
      cantidad_base: cantidadBase ?? null,
      costo_transporte_snapshot: resource.costo_transporte,
      costo_unitario_snapshot: resource.costo_unitario_actual,
      cuadrilla: cuadrilla ?? null,
      porcentaje_aplicado: porcentajeAplicado ?? null,
      tipo_calculo_apu: tipoCalculo
    },
    partida
  );

  return {
    cantidad: computed.cantidad,
    cantidad_base: cantidadBase ?? null,
    costo_transporte_snapshot: resource.costo_transporte,
    costo_unitario_snapshot: resource.costo_unitario_actual,
    cuadrilla: cuadrilla ?? null,
    grupo,
    id,
    orden,
    parcial: computed.parcial,
    partida_id: partidaId,
    porcentaje_aplicado: porcentajeAplicado ?? null,
    recurso_id: recursoId,
    tipo_calculo_apu: tipoCalculo,
    unidad: resource.unidad
  };
}
