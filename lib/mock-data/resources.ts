import type { Recurso, RecursoPrecioHistorial } from "@/types/domain";
import { mockProviders } from "@/lib/mock-data/providers";

export { mockProviders };

export const mockResources: Recurso[] = [
  {
    id: "rec-cemento-portland",
    nombre: "Cemento Portland Tipo I",
    tipo: "material",
    unidad: "bol",
    costo_unitario_actual: 32,
    proveedor_id: "prov-unacem",
    transporte_aplica: true,
    costo_transporte: 2.5,
    especificacion: "Bolsa de 42.5 kg para concreto estructural.",
    marca: "Sol",
    fuente_precio: "Cotizacion proveedor",
    fecha_actualizacion_precio: "2026-05-08",
    estado: "activo",
    created_at: "2026-03-12",
    updated_at: "2026-05-08"
  },
  {
    id: "rec-arena-gruesa",
    nombre: "Arena gruesa",
    tipo: "material",
    unidad: "m3",
    costo_unitario_actual: 80,
    proveedor_id: "prov-cantera-san-pedro",
    transporte_aplica: true,
    costo_transporte: 15,
    especificacion: "Agregado lavado para mezcla de concreto.",
    marca: null,
    fuente_precio: "Lista mayo 2026",
    fecha_actualizacion_precio: "2026-05-07",
    estado: "activo",
    created_at: "2026-03-15",
    updated_at: "2026-05-07"
  },
  {
    id: "rec-maestro-obra",
    nombre: "Maestro de obra",
    tipo: "mano_obra",
    unidad: "jor",
    costo_unitario_actual: 90,
    proveedor_id: "prov-mano-obra-sac",
    transporte_aplica: false,
    costo_transporte: 0,
    especificacion: "Jornada de 8 horas.",
    marca: null,
    fuente_precio: "Tarifario interno",
    fecha_actualizacion_precio: "2026-05-02",
    estado: "activo",
    created_at: "2026-03-18",
    updated_at: "2026-05-02"
  },
  {
    id: "rec-peon",
    nombre: "Peon",
    tipo: "mano_obra",
    unidad: "jor",
    costo_unitario_actual: 60,
    proveedor_id: "prov-mano-obra-sac",
    transporte_aplica: false,
    costo_transporte: 0,
    especificacion: "Jornada de 8 horas.",
    marca: null,
    fuente_precio: "Tarifario interno",
    fecha_actualizacion_precio: "2026-05-02",
    estado: "activo",
    created_at: "2026-03-18",
    updated_at: "2026-05-02"
  },
  {
    id: "rec-mezcladora",
    nombre: "Mezcladora 9 - 11 p3",
    tipo: "equipo",
    unidad: "hm",
    costo_unitario_actual: 25,
    proveedor_id: "prov-alquileres-sur",
    transporte_aplica: true,
    costo_transporte: 5,
    especificacion: "Incluye mantenimiento preventivo.",
    marca: "Honda",
    fuente_precio: "Contrato marco",
    fecha_actualizacion_precio: "2026-05-09",
    estado: "activo",
    created_at: "2026-04-02",
    updated_at: "2026-05-09"
  },
  {
    id: "rec-aditivo",
    nombre: "Aditivo impermeabilizante",
    tipo: "material",
    unidad: "lt",
    costo_unitario_actual: 18,
    proveedor_id: "prov-unacem",
    transporte_aplica: false,
    costo_transporte: 0,
    especificacion: "Aditivo liquido para morteros.",
    marca: "Sika",
    fuente_precio: "Cotizacion proveedor",
    fecha_actualizacion_precio: "2026-04-28",
    estado: "inactivo",
    created_at: "2026-03-22",
    updated_at: "2026-04-28"
  }
];

export const mockResourcePriceHistory: RecursoPrecioHistorial[] = [
  {
    id: "hist-cemento-1",
    recurso_id: "rec-cemento-portland",
    costo_unitario_anterior: 30.8,
    costo_unitario_nuevo: 32,
    costo_transporte_anterior: 2.2,
    costo_transporte_nuevo: 2.5,
    fuente_precio: "Cotizacion proveedor",
    fecha: "2026-05-08",
    usuario_id: "mock-user",
    notas: "Ajuste por nueva lista de mayo."
  },
  {
    id: "hist-cemento-2",
    recurso_id: "rec-cemento-portland",
    costo_unitario_anterior: 29.5,
    costo_unitario_nuevo: 30.8,
    costo_transporte_anterior: 2,
    costo_transporte_nuevo: 2.2,
    fuente_precio: "Cotizacion proveedor",
    fecha: "2026-04-15",
    usuario_id: "mock-user",
    notas: "Actualizacion mensual."
  },
  {
    id: "hist-arena-1",
    recurso_id: "rec-arena-gruesa",
    costo_unitario_anterior: 76,
    costo_unitario_nuevo: 80,
    costo_transporte_anterior: 12,
    costo_transporte_nuevo: 15,
    fuente_precio: "Lista mayo 2026",
    fecha: "2026-05-07",
    usuario_id: "mock-user",
    notas: "Mayor costo logistico por distancia."
  },
  {
    id: "hist-maestro-1",
    recurso_id: "rec-maestro-obra",
    costo_unitario_anterior: 86,
    costo_unitario_nuevo: 90,
    costo_transporte_anterior: 0,
    costo_transporte_nuevo: 0,
    fuente_precio: "Tarifario interno",
    fecha: "2026-05-02",
    usuario_id: "mock-user",
    notas: "Actualizacion de jornal."
  },
  {
    id: "hist-mezcladora-1",
    recurso_id: "rec-mezcladora",
    costo_unitario_anterior: 23,
    costo_unitario_nuevo: 25,
    costo_transporte_anterior: 4,
    costo_transporte_nuevo: 5,
    fuente_precio: "Contrato marco",
    fecha: "2026-05-09",
    usuario_id: "mock-user",
    notas: "Renovacion de tarifa por hora maquina."
  }
];
