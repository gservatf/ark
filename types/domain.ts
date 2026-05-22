export type Moneda = "PEN";

export type EstadoRegistro = "activo" | "inactivo";

export type EstadoPartida = EstadoRegistro;

export type EstadoPresupuesto = "borrador" | "aprobado" | "archivado";

export type RolOrganizacion = "owner" | "admin" | "miembro";

export type RolProyecto = "admin" | "presupuestador" | "editor" | "lector";

export type EstadoMiembro = "activo" | "invitado" | "suspendido";

export type EstadoProyecto = "activo" | "archivado";

export type EstadoPresupuestoBorrador = "activo" | "cerrado" | "archivado";

export type EstadoPresupuestoVersion = "emitida" | "anulada";

export type PrecioOrigen = "catalogo" | "manual" | "snapshot";

export type PrecioClienteOrigen = "proveedor_visible" | "fallback_general" | "override_manual";

export type TipoRecurso = "material" | "mano_obra" | "equipo" | "herramienta";

export type GrupoApu = "materiales" | "mano_obra" | "equipos_herramientas";

export type ISODateString = string;

export interface BaseEntity {
  id: string;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Proveedor extends BaseEntity {
  organizacion_id?: string | null;
  nombre: string;
  ruc?: string | null;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  notas?: string | null;
  disponible_para_cliente: boolean;
  estado: EstadoRegistro;
}

export interface Recurso extends BaseEntity {
  organizacion_id?: string | null;
  nombre: string;
  tipo: TipoRecurso;
  unidad: string;
  costo_unitario_actual: number;
  proveedor_id?: string | null;
  transporte_aplica: boolean;
  costo_transporte: number;
  especificacion?: string | null;
  marca?: string | null;
  fuente_precio?: string | null;
  fecha_actualizacion_precio?: ISODateString | null;
  estado: EstadoRegistro;
}

export interface RecursoPrecioHistorial {
  id: string;
  recurso_id: string;
  costo_unitario_anterior: number;
  costo_unitario_nuevo: number;
  costo_transporte_anterior: number;
  costo_transporte_nuevo: number;
  fuente_precio?: string | null;
  fecha: ISODateString;
  usuario_id?: string | null;
  notas?: string | null;
}

export interface RecursoProveedorPrecio extends BaseEntity {
  organizacion_id: string;
  recurso_id: string;
  proveedor_id: string;
  costo_unitario: number;
  costo_transporte: number;
  moneda: Moneda;
  fecha_cotizacion?: ISODateString | null;
  vigente_desde?: ISODateString | null;
  vigente_hasta?: ISODateString | null;
  fuente_precio?: string | null;
  url_referencia?: string | null;
  es_preferido_interno: boolean;
  estado: EstadoRegistro;
  proveedor?: Proveedor;
}

export interface RecursoSnapshot {
  recurso_id: string;
  nombre_snapshot: string;
  tipo_snapshot: TipoRecurso;
  unidad_snapshot: string;
  costo_unitario_snapshot: number;
  costo_transporte_snapshot: number;
  proveedor_id_snapshot?: string | null;
  proveedor_nombre_snapshot?: string | null;
  fuente_precio_snapshot?: string | null;
  fecha_precio_snapshot?: ISODateString | null;
}

export interface Partida extends BaseEntity {
  organizacion_id?: string | null;
  codigo: string;
  nombre: string;
  unidad: string;
  categoria?: string | null;
  descripcion?: string | null;
  especificaciones?: string | null;
  rendimiento?: number | null;
  cuadrilla?: string | null;
  estado: EstadoPartida;
}

export interface PartidaRecurso {
  id: string;
  created_at?: ISODateString;
  updated_at?: ISODateString;
  partida_id: string;
  recurso_id: string;
  grupo: GrupoApu;
  cantidad: number;
  unidad: string;
  costo_unitario_snapshot: number;
  costo_transporte_snapshot: number;
  rendimiento_factor?: number | null;
  desperdicio_porcentaje: number;
  parcial: number;
  orden: number;
}

export interface PartidaRecursoSnapshot extends RecursoSnapshot {
  partida_recurso_id: string;
  grupo: GrupoApu;
  cantidad: number;
  unidad: string;
  rendimiento_factor?: number | null;
  desperdicio_porcentaje: number;
  parcial_snapshot: number;
  orden: number;
}

export interface PartidaSnapshot {
  partida_id: string;
  codigo_snapshot: string;
  nombre_snapshot: string;
  unidad_snapshot: string;
  categoria_snapshot?: string | null;
  descripcion_snapshot?: string | null;
  especificaciones_snapshot?: string | null;
  rendimiento_snapshot?: number | null;
  cuadrilla_snapshot?: string | null;
  precio_unitario_snapshot: number;
}

export interface Presupuesto extends BaseEntity {
  organizacion_id?: string | null;
  proyecto_nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  version: string;
  estado: EstadoPresupuesto;
  moneda: Moneda;
  gastos_generales_porcentaje: number;
  utilidad_porcentaje: number;
  igv_porcentaje: number;
  subtotal: number;
  gastos_generales_total: number;
  utilidad_total: number;
  subtotal_con_margen: number;
  igv_total: number;
  total: number;
}

export interface PresupuestoPartida extends PartidaSnapshot {
  id: string;
  presupuesto_id: string;
  metrado: number;
  parcial: number;
  orden: number;
}

export interface PresupuestoPartidaRecursoSnapshot extends PartidaRecursoSnapshot {
  id: string;
  presupuesto_partida_id: string;
  presupuesto_id: string;
}

export interface Organizacion extends BaseEntity {
  nombre: string;
  ruc?: string | null;
  estado: EstadoRegistro;
}

export interface OrganizacionMiembro extends BaseEntity {
  organizacion_id: string;
  user_id: string;
  rol: RolOrganizacion;
  estado: EstadoMiembro;
  invitado_por?: string | null;
  joined_at?: ISODateString | null;
}

export interface Proyecto extends BaseEntity {
  organizacion_id: string;
  nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  codigo?: string | null;
  descripcion?: string | null;
  estado: EstadoProyecto;
  created_by?: string | null;
}

export interface ProyectoMiembro extends BaseEntity {
  proyecto_id: string;
  organizacion_miembro_id: string;
  rol: RolProyecto;
  estado: EstadoMiembro;
}

export interface PresupuestoBorrador extends BaseEntity {
  organizacion_id: string;
  proyecto_id: string;
  nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  estado: EstadoPresupuestoBorrador;
  moneda: Moneda;
  gastos_generales_porcentaje: number;
  utilidad_porcentaje: number;
  igv_porcentaje: number;
  subtotal: number;
  gastos_generales_total: number;
  utilidad_total: number;
  subtotal_con_margen: number;
  igv_total: number;
  total: number;
  created_by?: string | null;
  updated_by?: string | null;
}

export interface PrecioControl {
  precio_fijado: boolean;
  autoactualizar_precio: boolean;
  motivo_precio_fijado?: string | null;
  precio_origen: PrecioOrigen;
}

export type PrecioClienteVivo =
  | {
      precio_cliente_actual?: null;
      precio_cliente_origen?: null;
    }
  | {
      precio_cliente_actual: number;
      precio_cliente_origen: PrecioClienteOrigen;
    };

export interface PresupuestoBorradorPartida extends BaseEntity, Omit<PartidaSnapshot, "precio_unitario_snapshot">, PrecioControl {
  id: string;
  presupuesto_borrador_id: string;
  partida_id: string;
  metrado: number;
  precio_unitario_actual: number;
  parcial: number;
  orden: number;
}

export type PresupuestoBorradorPartidaRecurso = BaseEntity & PrecioControl & PrecioClienteVivo & {
  id: string;
  presupuesto_borrador_id: string;
  presupuesto_borrador_partida_id: string;
  partida_recurso_id?: string | null;
  recurso_id?: string | null;
  nombre_snapshot: string;
  tipo_snapshot: TipoRecurso;
  unidad_snapshot: string;
  proveedor_id_snapshot?: string | null;
  proveedor_nombre_snapshot?: string | null;
  fuente_precio_snapshot?: string | null;
  fecha_precio_snapshot?: ISODateString | null;
  cotizacion_interna_id?: string | null;
  cotizacion_cliente_id?: string | null;
  precio_cliente_advertencia?: string | null;
  precio_cliente_override: boolean;
  motivo_precio_cliente_override?: string | null;
  grupo: GrupoApu;
  cantidad: number;
  unidad: string;
  rendimiento_factor?: number | null;
  desperdicio_porcentaje: number;
  costo_unitario_actual: number;
  costo_transporte_actual: number;
  parcial_actual: number;
  orden: number;
};

export interface PresupuestoVersion {
  id: string;
  organizacion_id: string;
  proyecto_id: string;
  presupuesto_borrador_id?: string | null;
  numero_version: number;
  nombre: string;
  cliente?: string | null;
  ubicacion?: string | null;
  estado: EstadoPresupuestoVersion;
  moneda: Moneda;
  gastos_generales_porcentaje: number;
  utilidad_porcentaje: number;
  igv_porcentaje: number;
  subtotal: number;
  gastos_generales_total: number;
  utilidad_total: number;
  subtotal_con_margen: number;
  igv_total: number;
  total: number;
  emitida_por?: string | null;
  emitida_at: ISODateString;
  created_at: ISODateString;
}

export interface PresupuestoVersionPartida extends PartidaSnapshot {
  id: string;
  presupuesto_version_id: string;
  partida_id: string;
  metrado: number;
  precio_unitario_snapshot: number;
  motivo_precio_fijado_snapshot?: string | null;
  precio_fijado_snapshot: boolean;
  precio_origen_snapshot: PrecioOrigen;
  parcial_snapshot: number;
  orden: number;
  created_at: ISODateString;
}

export interface PresupuestoVersionPartidaRecurso extends PartidaRecursoSnapshot {
  id: string;
  presupuesto_version_id: string;
  presupuesto_version_partida_id: string;
  precio_cliente_snapshot?: number | null;
  cotizacion_interna_id_snapshot?: string | null;
  cotizacion_cliente_id_snapshot?: string | null;
  precio_cliente_origen_snapshot?: PrecioClienteOrigen | string | null;
  precio_cliente_advertencia_snapshot?: string | null;
  motivo_precio_fijado_snapshot?: string | null;
  precio_fijado_snapshot: boolean;
  precio_origen_snapshot: PrecioOrigen;
  created_at: ISODateString;
}

export interface ActivityEvent {
  id: string;
  organizacion_id: string;
  proyecto_id?: string | null;
  presupuesto_borrador_id?: string | null;
  presupuesto_version_id?: string | null;
  actor_id?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  before?: unknown;
  after?: unknown;
  changed_fields?: unknown;
  metadata: Record<string, unknown>;
  created_at: ISODateString;
}
