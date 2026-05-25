export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activity_events: {
        Row: {
          action: string
          actor_id: string | null
          after: Json | null
          before: Json | null
          changed_fields: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
          organizacion_id: string
          presupuesto_borrador_id: string | null
          presupuesto_version_id: string | null
          proyecto_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
          organizacion_id: string
          presupuesto_borrador_id?: string | null
          presupuesto_version_id?: string | null
          proyecto_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          after?: Json | null
          before?: Json | null
          changed_fields?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
          organizacion_id?: string
          presupuesto_borrador_id?: string | null
          presupuesto_version_id?: string | null
          proyecto_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_events_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_presupuesto_borrador_id_fkey"
            columns: ["presupuesto_borrador_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_borradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_presupuesto_version_id_fkey"
            columns: ["presupuesto_version_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_versiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_events_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacion_invitaciones: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["estado_invitacion"]
          expires_at: string
          id: string
          incluir_proyectos_futuros: boolean
          invited_by: string
          organizacion_id: string
          proyecto_id: string | null
          proyecto_ids: string[]
          revoked_at: string | null
          rol_organizacion: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto: Database["public"]["Enums"]["rol_proyecto"] | null
          token_hash: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email: string
          estado?: Database["public"]["Enums"]["estado_invitacion"]
          expires_at?: string
          id?: string
          incluir_proyectos_futuros?: boolean
          invited_by: string
          organizacion_id: string
          proyecto_id?: string | null
          proyecto_ids?: string[]
          revoked_at?: string | null
          rol_organizacion?: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto?: Database["public"]["Enums"]["rol_proyecto"] | null
          token_hash: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          email?: string
          estado?: Database["public"]["Enums"]["estado_invitacion"]
          expires_at?: string
          id?: string
          incluir_proyectos_futuros?: boolean
          invited_by?: string
          organizacion_id?: string
          proyecto_id?: string | null
          proyecto_ids?: string[]
          revoked_at?: string | null
          rol_organizacion?: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto?: Database["public"]["Enums"]["rol_proyecto"] | null
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizacion_invitaciones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organizacion_invitaciones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      organizacion_miembros: {
        Row: {
          acceso_todos_proyectos: boolean
          created_at: string
          estado: Database["public"]["Enums"]["estado_miembro"]
          id: string
          invitado_por: string | null
          joined_at: string | null
          organizacion_id: string
          rol: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto_predeterminado:
            | Database["public"]["Enums"]["rol_proyecto"]
            | null
          updated_at: string
          user_id: string
        }
        Insert: {
          acceso_todos_proyectos?: boolean
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_miembro"]
          id?: string
          invitado_por?: string | null
          joined_at?: string | null
          organizacion_id: string
          rol?: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto_predeterminado?:
            | Database["public"]["Enums"]["rol_proyecto"]
            | null
          updated_at?: string
          user_id: string
        }
        Update: {
          acceso_todos_proyectos?: boolean
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_miembro"]
          id?: string
          invitado_por?: string | null
          joined_at?: string | null
          organizacion_id?: string
          rol?: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto_predeterminado?:
            | Database["public"]["Enums"]["rol_proyecto"]
            | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizacion_miembros_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      organizaciones: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_registro"]
          id: string
          nombre: string
          ruc: string | null
          tipo_organizacion: Database["public"]["Enums"]["tipo_organizacion"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_registro"]
          id?: string
          nombre: string
          ruc?: string | null
          tipo_organizacion?: Database["public"]["Enums"]["tipo_organizacion"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_registro"]
          id?: string
          nombre?: string
          ruc?: string | null
          tipo_organizacion?: Database["public"]["Enums"]["tipo_organizacion"]
          updated_at?: string
        }
        Relationships: []
      }
      partida_recursos: {
        Row: {
          cantidad: number
          costo_transporte_snapshot: number
          costo_unitario_snapshot: number
          created_at: string
          desperdicio_porcentaje: number
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id: string
          orden: number
          parcial: number
          partida_id: string
          recurso_id: string
          rendimiento_factor: number | null
          unidad: string
          updated_at: string
        }
        Insert: {
          cantidad: number
          costo_transporte_snapshot?: number
          costo_unitario_snapshot: number
          created_at?: string
          desperdicio_porcentaje?: number
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          orden?: number
          parcial?: number
          partida_id: string
          recurso_id: string
          rendimiento_factor?: number | null
          unidad: string
          updated_at?: string
        }
        Update: {
          cantidad?: number
          costo_transporte_snapshot?: number
          costo_unitario_snapshot?: number
          created_at?: string
          desperdicio_porcentaje?: number
          grupo?: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          orden?: number
          parcial?: number
          partida_id?: string
          recurso_id?: string
          rendimiento_factor?: number | null
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partida_recursos_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partida_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      partidas: {
        Row: {
          categoria: string | null
          codigo: string
          created_at: string
          cuadrilla: string | null
          descripcion: string | null
          especificaciones: string | null
          estado: Database["public"]["Enums"]["estado_registro"]
          id: string
          nombre: string
          organizacion_id: string | null
          rendimiento: number | null
          unidad: string
          updated_at: string
        }
        Insert: {
          categoria?: string | null
          codigo: string
          created_at?: string
          cuadrilla?: string | null
          descripcion?: string | null
          especificaciones?: string | null
          estado?: Database["public"]["Enums"]["estado_registro"]
          id?: string
          nombre: string
          organizacion_id?: string | null
          rendimiento?: number | null
          unidad: string
          updated_at?: string
        }
        Update: {
          categoria?: string | null
          codigo?: string
          created_at?: string
          cuadrilla?: string | null
          descripcion?: string | null
          especificaciones?: string | null
          estado?: Database["public"]["Enums"]["estado_registro"]
          id?: string
          nombre?: string
          organizacion_id?: string | null
          rendimiento?: number | null
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partidas_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_borrador_partida_recursos: {
        Row: {
          autoactualizar_precio: boolean
          cantidad: number
          costo_transporte_actual: number
          costo_unitario_actual: number
          cotizacion_cliente_id: string | null
          cotizacion_interna_id: string | null
          created_at: string
          desperdicio_porcentaje: number
          fecha_precio_snapshot: string | null
          fuente_precio_snapshot: string | null
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id: string
          motivo_precio_cliente_override: string | null
          motivo_precio_fijado: string | null
          nombre_snapshot: string
          orden: number
          parcial_actual: number
          partida_recurso_id: string | null
          precio_cliente_actual: number | null
          precio_cliente_advertencia: string | null
          precio_cliente_origen: string | null
          precio_cliente_override: boolean
          precio_fijado: boolean
          precio_origen: Database["public"]["Enums"]["precio_origen"]
          presupuesto_borrador_id: string
          presupuesto_borrador_partida_id: string
          proveedor_id_snapshot: string | null
          proveedor_nombre_snapshot: string | null
          recurso_id: string | null
          rendimiento_factor: number | null
          tipo_snapshot: Database["public"]["Enums"]["tipo_recurso"]
          unidad: string
          unidad_snapshot: string
          updated_at: string
        }
        Insert: {
          autoactualizar_precio?: boolean
          cantidad: number
          costo_transporte_actual?: number
          costo_unitario_actual: number
          cotizacion_cliente_id?: string | null
          cotizacion_interna_id?: string | null
          created_at?: string
          desperdicio_porcentaje?: number
          fecha_precio_snapshot?: string | null
          fuente_precio_snapshot?: string | null
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          motivo_precio_cliente_override?: string | null
          motivo_precio_fijado?: string | null
          nombre_snapshot: string
          orden?: number
          parcial_actual: number
          partida_recurso_id?: string | null
          precio_cliente_actual?: number | null
          precio_cliente_advertencia?: string | null
          precio_cliente_origen?: string | null
          precio_cliente_override?: boolean
          precio_fijado?: boolean
          precio_origen?: Database["public"]["Enums"]["precio_origen"]
          presupuesto_borrador_id: string
          presupuesto_borrador_partida_id: string
          proveedor_id_snapshot?: string | null
          proveedor_nombre_snapshot?: string | null
          recurso_id?: string | null
          rendimiento_factor?: number | null
          tipo_snapshot: Database["public"]["Enums"]["tipo_recurso"]
          unidad: string
          unidad_snapshot: string
          updated_at?: string
        }
        Update: {
          autoactualizar_precio?: boolean
          cantidad?: number
          costo_transporte_actual?: number
          costo_unitario_actual?: number
          cotizacion_cliente_id?: string | null
          cotizacion_interna_id?: string | null
          created_at?: string
          desperdicio_porcentaje?: number
          fecha_precio_snapshot?: string | null
          fuente_precio_snapshot?: string | null
          grupo?: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          motivo_precio_cliente_override?: string | null
          motivo_precio_fijado?: string | null
          nombre_snapshot?: string
          orden?: number
          parcial_actual?: number
          partida_recurso_id?: string | null
          precio_cliente_actual?: number | null
          precio_cliente_advertencia?: string | null
          precio_cliente_origen?: string | null
          precio_cliente_override?: boolean
          precio_fijado?: boolean
          precio_origen?: Database["public"]["Enums"]["precio_origen"]
          presupuesto_borrador_id?: string
          presupuesto_borrador_partida_id?: string
          proveedor_id_snapshot?: string | null
          proveedor_nombre_snapshot?: string | null
          recurso_id?: string | null
          rendimiento_factor?: number | null
          tipo_snapshot?: Database["public"]["Enums"]["tipo_recurso"]
          unidad?: string
          unidad_snapshot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_borrador_partida__presupuesto_borrador_partida_fkey"
            columns: ["presupuesto_borrador_partida_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_borrador_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partida_recur_presupuesto_borrador_id_fkey"
            columns: ["presupuesto_borrador_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_borradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partida_recurso_cotizacion_cliente_id_fkey"
            columns: ["cotizacion_cliente_id"]
            isOneToOne: false
            referencedRelation: "recurso_proveedor_precios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partida_recurso_cotizacion_interna_id_fkey"
            columns: ["cotizacion_interna_id"]
            isOneToOne: false
            referencedRelation: "recurso_proveedor_precios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partida_recurso_proveedor_id_snapshot_fkey"
            columns: ["proveedor_id_snapshot"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partida_recursos_partida_recurso_id_fkey"
            columns: ["partida_recurso_id"]
            isOneToOne: false
            referencedRelation: "partida_recursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partida_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_borrador_partidas: {
        Row: {
          autoactualizar_precio: boolean
          categoria_snapshot: string | null
          codigo_snapshot: string
          created_at: string
          cuadrilla_snapshot: string | null
          descripcion_snapshot: string | null
          especificaciones_snapshot: string | null
          id: string
          metrado: number
          motivo_precio_fijado: string | null
          nombre_snapshot: string
          orden: number
          parcial: number
          partida_id: string | null
          precio_fijado: boolean
          precio_origen: Database["public"]["Enums"]["precio_origen"]
          precio_unitario_actual: number
          presupuesto_borrador_id: string
          rendimiento_snapshot: number | null
          unidad_snapshot: string
          updated_at: string
        }
        Insert: {
          autoactualizar_precio?: boolean
          categoria_snapshot?: string | null
          codigo_snapshot: string
          created_at?: string
          cuadrilla_snapshot?: string | null
          descripcion_snapshot?: string | null
          especificaciones_snapshot?: string | null
          id?: string
          metrado: number
          motivo_precio_fijado?: string | null
          nombre_snapshot: string
          orden?: number
          parcial: number
          partida_id?: string | null
          precio_fijado?: boolean
          precio_origen?: Database["public"]["Enums"]["precio_origen"]
          precio_unitario_actual: number
          presupuesto_borrador_id: string
          rendimiento_snapshot?: number | null
          unidad_snapshot: string
          updated_at?: string
        }
        Update: {
          autoactualizar_precio?: boolean
          categoria_snapshot?: string | null
          codigo_snapshot?: string
          created_at?: string
          cuadrilla_snapshot?: string | null
          descripcion_snapshot?: string | null
          especificaciones_snapshot?: string | null
          id?: string
          metrado?: number
          motivo_precio_fijado?: string | null
          nombre_snapshot?: string
          orden?: number
          parcial?: number
          partida_id?: string | null
          precio_fijado?: boolean
          precio_origen?: Database["public"]["Enums"]["precio_origen"]
          precio_unitario_actual?: number
          presupuesto_borrador_id?: string
          rendimiento_snapshot?: number | null
          unidad_snapshot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_borrador_partidas_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borrador_partidas_presupuesto_borrador_id_fkey"
            columns: ["presupuesto_borrador_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_borradores"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_borradores: {
        Row: {
          cliente: string | null
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["estado_presupuesto_borrador"]
          gastos_generales_porcentaje: number
          gastos_generales_total: number
          id: string
          igv_porcentaje: number
          igv_total: number
          moneda: Database["public"]["Enums"]["moneda"]
          nombre: string
          organizacion_id: string
          proyecto_id: string
          subtotal: number
          subtotal_con_margen: number
          total: number
          ubicacion: string | null
          updated_at: string
          updated_by: string | null
          utilidad_porcentaje: number
          utilidad_total: number
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto_borrador"]
          gastos_generales_porcentaje?: number
          gastos_generales_total?: number
          id?: string
          igv_porcentaje?: number
          igv_total?: number
          moneda?: Database["public"]["Enums"]["moneda"]
          nombre: string
          organizacion_id: string
          proyecto_id: string
          subtotal?: number
          subtotal_con_margen?: number
          total?: number
          ubicacion?: string | null
          updated_at?: string
          updated_by?: string | null
          utilidad_porcentaje?: number
          utilidad_total?: number
        }
        Update: {
          cliente?: string | null
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto_borrador"]
          gastos_generales_porcentaje?: number
          gastos_generales_total?: number
          id?: string
          igv_porcentaje?: number
          igv_total?: number
          moneda?: Database["public"]["Enums"]["moneda"]
          nombre?: string
          organizacion_id?: string
          proyecto_id?: string
          subtotal?: number
          subtotal_con_margen?: number
          total?: number
          ubicacion?: string | null
          updated_at?: string
          updated_by?: string | null
          utilidad_porcentaje?: number
          utilidad_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_borradores_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_borradores_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_partida_recursos: {
        Row: {
          cantidad: number
          costo_transporte_snapshot: number
          costo_unitario_snapshot: number
          created_at: string
          desperdicio_porcentaje: number
          fecha_precio_snapshot: string | null
          fuente_precio_snapshot: string | null
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id: string
          nombre_snapshot: string
          orden: number
          parcial_snapshot: number
          partida_recurso_id: string | null
          presupuesto_id: string
          presupuesto_partida_id: string
          proveedor_id_snapshot: string | null
          proveedor_nombre_snapshot: string | null
          recurso_id: string | null
          rendimiento_factor: number | null
          tipo_snapshot: Database["public"]["Enums"]["tipo_recurso"]
          unidad: string
          unidad_snapshot: string
        }
        Insert: {
          cantidad: number
          costo_transporte_snapshot?: number
          costo_unitario_snapshot: number
          created_at?: string
          desperdicio_porcentaje?: number
          fecha_precio_snapshot?: string | null
          fuente_precio_snapshot?: string | null
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          nombre_snapshot: string
          orden?: number
          parcial_snapshot: number
          partida_recurso_id?: string | null
          presupuesto_id: string
          presupuesto_partida_id: string
          proveedor_id_snapshot?: string | null
          proveedor_nombre_snapshot?: string | null
          recurso_id?: string | null
          rendimiento_factor?: number | null
          tipo_snapshot: Database["public"]["Enums"]["tipo_recurso"]
          unidad: string
          unidad_snapshot: string
        }
        Update: {
          cantidad?: number
          costo_transporte_snapshot?: number
          costo_unitario_snapshot?: number
          created_at?: string
          desperdicio_porcentaje?: number
          fecha_precio_snapshot?: string | null
          fuente_precio_snapshot?: string | null
          grupo?: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          nombre_snapshot?: string
          orden?: number
          parcial_snapshot?: number
          partida_recurso_id?: string | null
          presupuesto_id?: string
          presupuesto_partida_id?: string
          proveedor_id_snapshot?: string | null
          proveedor_nombre_snapshot?: string | null
          recurso_id?: string | null
          rendimiento_factor?: number | null
          tipo_snapshot?: Database["public"]["Enums"]["tipo_recurso"]
          unidad?: string
          unidad_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_partida_recursos_partida_recurso_id_fkey"
            columns: ["partida_recurso_id"]
            isOneToOne: false
            referencedRelation: "partida_recursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_partida_recursos_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_partida_recursos_presupuesto_partida_id_fkey"
            columns: ["presupuesto_partida_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_partida_recursos_proveedor_id_snapshot_fkey"
            columns: ["proveedor_id_snapshot"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_partida_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_partidas: {
        Row: {
          categoria_snapshot: string | null
          codigo_snapshot: string
          created_at: string
          cuadrilla_snapshot: string | null
          descripcion_snapshot: string | null
          especificaciones_snapshot: string | null
          id: string
          metrado: number
          nombre_snapshot: string
          orden: number
          parcial: number
          partida_id: string | null
          precio_unitario_snapshot: number
          presupuesto_id: string
          rendimiento_snapshot: number | null
          unidad_snapshot: string
          updated_at: string
        }
        Insert: {
          categoria_snapshot?: string | null
          codigo_snapshot: string
          created_at?: string
          cuadrilla_snapshot?: string | null
          descripcion_snapshot?: string | null
          especificaciones_snapshot?: string | null
          id?: string
          metrado: number
          nombre_snapshot: string
          orden?: number
          parcial: number
          partida_id?: string | null
          precio_unitario_snapshot: number
          presupuesto_id: string
          rendimiento_snapshot?: number | null
          unidad_snapshot: string
          updated_at?: string
        }
        Update: {
          categoria_snapshot?: string | null
          codigo_snapshot?: string
          created_at?: string
          cuadrilla_snapshot?: string | null
          descripcion_snapshot?: string | null
          especificaciones_snapshot?: string | null
          id?: string
          metrado?: number
          nombre_snapshot?: string
          orden?: number
          parcial?: number
          partida_id?: string | null
          precio_unitario_snapshot?: number
          presupuesto_id?: string
          rendimiento_snapshot?: number | null
          unidad_snapshot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_partidas_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_partidas_presupuesto_id_fkey"
            columns: ["presupuesto_id"]
            isOneToOne: false
            referencedRelation: "presupuestos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_version_partida_recursos: {
        Row: {
          cantidad: number
          costo_transporte_snapshot: number
          costo_unitario_snapshot: number
          cotizacion_cliente_id_snapshot: string | null
          cotizacion_interna_id_snapshot: string | null
          created_at: string
          desperdicio_porcentaje: number
          fecha_precio_snapshot: string | null
          fuente_precio_snapshot: string | null
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id: string
          motivo_precio_fijado_snapshot: string | null
          nombre_snapshot: string
          orden: number
          parcial_snapshot: number
          partida_recurso_id: string | null
          precio_cliente_advertencia_snapshot: string | null
          precio_cliente_origen_snapshot: string | null
          precio_cliente_snapshot: number | null
          precio_fijado_snapshot: boolean
          precio_origen_snapshot: Database["public"]["Enums"]["precio_origen"]
          presupuesto_version_id: string
          presupuesto_version_partida_id: string
          proveedor_id_snapshot: string | null
          proveedor_nombre_snapshot: string | null
          recurso_id: string | null
          rendimiento_factor: number | null
          tipo_snapshot: Database["public"]["Enums"]["tipo_recurso"]
          unidad: string
          unidad_snapshot: string
        }
        Insert: {
          cantidad: number
          costo_transporte_snapshot?: number
          costo_unitario_snapshot: number
          cotizacion_cliente_id_snapshot?: string | null
          cotizacion_interna_id_snapshot?: string | null
          created_at?: string
          desperdicio_porcentaje?: number
          fecha_precio_snapshot?: string | null
          fuente_precio_snapshot?: string | null
          grupo: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          motivo_precio_fijado_snapshot?: string | null
          nombre_snapshot: string
          orden?: number
          parcial_snapshot: number
          partida_recurso_id?: string | null
          precio_cliente_advertencia_snapshot?: string | null
          precio_cliente_origen_snapshot?: string | null
          precio_cliente_snapshot?: number | null
          precio_fijado_snapshot?: boolean
          precio_origen_snapshot?: Database["public"]["Enums"]["precio_origen"]
          presupuesto_version_id: string
          presupuesto_version_partida_id: string
          proveedor_id_snapshot?: string | null
          proveedor_nombre_snapshot?: string | null
          recurso_id?: string | null
          rendimiento_factor?: number | null
          tipo_snapshot: Database["public"]["Enums"]["tipo_recurso"]
          unidad: string
          unidad_snapshot: string
        }
        Update: {
          cantidad?: number
          costo_transporte_snapshot?: number
          costo_unitario_snapshot?: number
          cotizacion_cliente_id_snapshot?: string | null
          cotizacion_interna_id_snapshot?: string | null
          created_at?: string
          desperdicio_porcentaje?: number
          fecha_precio_snapshot?: string | null
          fuente_precio_snapshot?: string | null
          grupo?: Database["public"]["Enums"]["grupo_apu"]
          id?: string
          motivo_precio_fijado_snapshot?: string | null
          nombre_snapshot?: string
          orden?: number
          parcial_snapshot?: number
          partida_recurso_id?: string | null
          precio_cliente_advertencia_snapshot?: string | null
          precio_cliente_origen_snapshot?: string | null
          precio_cliente_snapshot?: number | null
          precio_fijado_snapshot?: boolean
          precio_origen_snapshot?: Database["public"]["Enums"]["precio_origen"]
          presupuesto_version_id?: string
          presupuesto_version_partida_id?: string
          proveedor_id_snapshot?: string | null
          proveedor_nombre_snapshot?: string | null
          recurso_id?: string | null
          rendimiento_factor?: number | null
          tipo_snapshot?: Database["public"]["Enums"]["tipo_recurso"]
          unidad?: string
          unidad_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_version_partida_r_presupuesto_version_partida__fkey"
            columns: ["presupuesto_version_partida_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_version_partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_partida_recurso_presupuesto_version_id_fkey"
            columns: ["presupuesto_version_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_versiones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_partida_recursos_partida_recurso_id_fkey"
            columns: ["partida_recurso_id"]
            isOneToOne: false
            referencedRelation: "partida_recursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_partida_recursos_proveedor_id_snapshot_fkey"
            columns: ["proveedor_id_snapshot"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_partida_recursos_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_recursos_cotizacion_cliente_fkey"
            columns: ["cotizacion_cliente_id_snapshot"]
            isOneToOne: false
            referencedRelation: "recurso_proveedor_precios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_recursos_cotizacion_interna_fkey"
            columns: ["cotizacion_interna_id_snapshot"]
            isOneToOne: false
            referencedRelation: "recurso_proveedor_precios"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_version_partidas: {
        Row: {
          categoria_snapshot: string | null
          codigo_snapshot: string
          created_at: string
          cuadrilla_snapshot: string | null
          descripcion_snapshot: string | null
          especificaciones_snapshot: string | null
          id: string
          metrado: number
          motivo_precio_fijado_snapshot: string | null
          nombre_snapshot: string
          orden: number
          parcial_snapshot: number
          partida_id: string | null
          precio_fijado_snapshot: boolean
          precio_origen_snapshot: Database["public"]["Enums"]["precio_origen"]
          precio_unitario_snapshot: number
          presupuesto_version_id: string
          rendimiento_snapshot: number | null
          unidad_snapshot: string
        }
        Insert: {
          categoria_snapshot?: string | null
          codigo_snapshot: string
          created_at?: string
          cuadrilla_snapshot?: string | null
          descripcion_snapshot?: string | null
          especificaciones_snapshot?: string | null
          id?: string
          metrado: number
          motivo_precio_fijado_snapshot?: string | null
          nombre_snapshot: string
          orden?: number
          parcial_snapshot: number
          partida_id?: string | null
          precio_fijado_snapshot?: boolean
          precio_origen_snapshot?: Database["public"]["Enums"]["precio_origen"]
          precio_unitario_snapshot: number
          presupuesto_version_id: string
          rendimiento_snapshot?: number | null
          unidad_snapshot: string
        }
        Update: {
          categoria_snapshot?: string | null
          codigo_snapshot?: string
          created_at?: string
          cuadrilla_snapshot?: string | null
          descripcion_snapshot?: string | null
          especificaciones_snapshot?: string | null
          id?: string
          metrado?: number
          motivo_precio_fijado_snapshot?: string | null
          nombre_snapshot?: string
          orden?: number
          parcial_snapshot?: number
          partida_id?: string | null
          precio_fijado_snapshot?: boolean
          precio_origen_snapshot?: Database["public"]["Enums"]["precio_origen"]
          precio_unitario_snapshot?: number
          presupuesto_version_id?: string
          rendimiento_snapshot?: number | null
          unidad_snapshot?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_version_partidas_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "partidas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_version_partidas_presupuesto_version_id_fkey"
            columns: ["presupuesto_version_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_versiones"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuesto_versiones: {
        Row: {
          cliente: string | null
          created_at: string
          emitida_at: string
          emitida_por: string | null
          estado: Database["public"]["Enums"]["estado_presupuesto_version"]
          gastos_generales_porcentaje: number
          gastos_generales_total: number
          id: string
          igv_porcentaje: number
          igv_total: number
          moneda: Database["public"]["Enums"]["moneda"]
          nombre: string
          numero_version: number
          organizacion_id: string
          presupuesto_borrador_id: string | null
          proyecto_id: string
          subtotal: number
          subtotal_con_margen: number
          total: number
          ubicacion: string | null
          utilidad_porcentaje: number
          utilidad_total: number
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          emitida_at?: string
          emitida_por?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto_version"]
          gastos_generales_porcentaje?: number
          gastos_generales_total?: number
          id?: string
          igv_porcentaje?: number
          igv_total?: number
          moneda?: Database["public"]["Enums"]["moneda"]
          nombre: string
          numero_version: number
          organizacion_id: string
          presupuesto_borrador_id?: string | null
          proyecto_id: string
          subtotal?: number
          subtotal_con_margen?: number
          total?: number
          ubicacion?: string | null
          utilidad_porcentaje?: number
          utilidad_total?: number
        }
        Update: {
          cliente?: string | null
          created_at?: string
          emitida_at?: string
          emitida_por?: string | null
          estado?: Database["public"]["Enums"]["estado_presupuesto_version"]
          gastos_generales_porcentaje?: number
          gastos_generales_total?: number
          id?: string
          igv_porcentaje?: number
          igv_total?: number
          moneda?: Database["public"]["Enums"]["moneda"]
          nombre?: string
          numero_version?: number
          organizacion_id?: string
          presupuesto_borrador_id?: string | null
          proyecto_id?: string
          subtotal?: number
          subtotal_con_margen?: number
          total?: number
          ubicacion?: string | null
          utilidad_porcentaje?: number
          utilidad_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "presupuesto_versiones_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_versiones_presupuesto_borrador_id_fkey"
            columns: ["presupuesto_borrador_id"]
            isOneToOne: false
            referencedRelation: "presupuesto_borradores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presupuesto_versiones_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      presupuestos: {
        Row: {
          cliente: string | null
          created_at: string
          estado: Database["public"]["Enums"]["estado_presupuesto"]
          gastos_generales_porcentaje: number
          gastos_generales_total: number
          id: string
          igv_porcentaje: number
          igv_total: number
          moneda: Database["public"]["Enums"]["moneda"]
          organizacion_id: string | null
          proyecto_nombre: string
          subtotal: number
          subtotal_con_margen: number
          total: number
          ubicacion: string | null
          updated_at: string
          utilidad_porcentaje: number
          utilidad_total: number
          version: string
        }
        Insert: {
          cliente?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          gastos_generales_porcentaje?: number
          gastos_generales_total?: number
          id?: string
          igv_porcentaje?: number
          igv_total?: number
          moneda?: Database["public"]["Enums"]["moneda"]
          organizacion_id?: string | null
          proyecto_nombre: string
          subtotal?: number
          subtotal_con_margen?: number
          total?: number
          ubicacion?: string | null
          updated_at?: string
          utilidad_porcentaje?: number
          utilidad_total?: number
          version?: string
        }
        Update: {
          cliente?: string | null
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_presupuesto"]
          gastos_generales_porcentaje?: number
          gastos_generales_total?: number
          id?: string
          igv_porcentaje?: number
          igv_total?: number
          moneda?: Database["public"]["Enums"]["moneda"]
          organizacion_id?: string | null
          proyecto_nombre?: string
          subtotal?: number
          subtotal_con_margen?: number
          total?: number
          ubicacion?: string | null
          updated_at?: string
          utilidad_porcentaje?: number
          utilidad_total?: number
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "presupuestos_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      proveedores: {
        Row: {
          contacto: string | null
          created_at: string
          direccion: string | null
          disponible_para_cliente: boolean
          email: string | null
          estado: Database["public"]["Enums"]["estado_registro"]
          id: string
          nombre: string
          notas: string | null
          organizacion_id: string | null
          ruc: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          disponible_para_cliente?: boolean
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_registro"]
          id?: string
          nombre: string
          notas?: string | null
          organizacion_id?: string | null
          ruc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          contacto?: string | null
          created_at?: string
          direccion?: string | null
          disponible_para_cliente?: boolean
          email?: string | null
          estado?: Database["public"]["Enums"]["estado_registro"]
          id?: string
          nombre?: string
          notas?: string | null
          organizacion_id?: string | null
          ruc?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proveedores_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      proyecto_miembros: {
        Row: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_miembro"]
          id: string
          organizacion_miembro_id: string
          proyecto_id: string
          rol: Database["public"]["Enums"]["rol_proyecto"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_miembro"]
          id?: string
          organizacion_miembro_id: string
          proyecto_id: string
          rol?: Database["public"]["Enums"]["rol_proyecto"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          estado?: Database["public"]["Enums"]["estado_miembro"]
          id?: string
          organizacion_miembro_id?: string
          proyecto_id?: string
          rol?: Database["public"]["Enums"]["rol_proyecto"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyecto_miembros_organizacion_miembro_id_fkey"
            columns: ["organizacion_miembro_id"]
            isOneToOne: false
            referencedRelation: "organizacion_miembros"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proyecto_miembros_proyecto_id_fkey"
            columns: ["proyecto_id"]
            isOneToOne: false
            referencedRelation: "proyectos"
            referencedColumns: ["id"]
          },
        ]
      }
      proyectos: {
        Row: {
          cliente: string | null
          codigo: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_proyecto"]
          id: string
          nombre: string
          organizacion_id: string
          ubicacion: string | null
          updated_at: string
        }
        Insert: {
          cliente?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          id?: string
          nombre: string
          organizacion_id: string
          ubicacion?: string | null
          updated_at?: string
        }
        Update: {
          cliente?: string | null
          codigo?: string | null
          created_at?: string
          created_by?: string | null
          descripcion?: string | null
          estado?: Database["public"]["Enums"]["estado_proyecto"]
          id?: string
          nombre?: string
          organizacion_id?: string
          ubicacion?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "proyectos_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
        ]
      }
      recurso_precios_historial: {
        Row: {
          costo_transporte_anterior: number
          costo_transporte_nuevo: number
          costo_unitario_anterior: number
          costo_unitario_nuevo: number
          fecha: string
          fuente_precio: string | null
          id: string
          notas: string | null
          recurso_id: string
          usuario_id: string | null
        }
        Insert: {
          costo_transporte_anterior?: number
          costo_transporte_nuevo?: number
          costo_unitario_anterior?: number
          costo_unitario_nuevo?: number
          fecha?: string
          fuente_precio?: string | null
          id?: string
          notas?: string | null
          recurso_id: string
          usuario_id?: string | null
        }
        Update: {
          costo_transporte_anterior?: number
          costo_transporte_nuevo?: number
          costo_unitario_anterior?: number
          costo_unitario_nuevo?: number
          fecha?: string
          fuente_precio?: string | null
          id?: string
          notas?: string | null
          recurso_id?: string
          usuario_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurso_precios_historial_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      recurso_proveedor_precios: {
        Row: {
          costo_transporte: number
          costo_unitario: number
          created_at: string
          es_preferido_interno: boolean
          estado: Database["public"]["Enums"]["estado_registro"]
          fecha_cotizacion: string | null
          fuente_precio: string | null
          id: string
          moneda: Database["public"]["Enums"]["moneda"]
          organizacion_id: string
          proveedor_id: string
          recurso_id: string
          updated_at: string
          url_referencia: string | null
          vigente_desde: string | null
          vigente_hasta: string | null
        }
        Insert: {
          costo_transporte?: number
          costo_unitario: number
          created_at?: string
          es_preferido_interno?: boolean
          estado?: Database["public"]["Enums"]["estado_registro"]
          fecha_cotizacion?: string | null
          fuente_precio?: string | null
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          organizacion_id: string
          proveedor_id: string
          recurso_id: string
          updated_at?: string
          url_referencia?: string | null
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Update: {
          costo_transporte?: number
          costo_unitario?: number
          created_at?: string
          es_preferido_interno?: boolean
          estado?: Database["public"]["Enums"]["estado_registro"]
          fecha_cotizacion?: string | null
          fuente_precio?: string | null
          id?: string
          moneda?: Database["public"]["Enums"]["moneda"]
          organizacion_id?: string
          proveedor_id?: string
          recurso_id?: string
          updated_at?: string
          url_referencia?: string | null
          vigente_desde?: string | null
          vigente_hasta?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurso_proveedor_precios_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurso_proveedor_precios_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurso_proveedor_precios_recurso_id_fkey"
            columns: ["recurso_id"]
            isOneToOne: false
            referencedRelation: "recursos"
            referencedColumns: ["id"]
          },
        ]
      }
      recursos: {
        Row: {
          costo_transporte: number
          costo_unitario_actual: number
          created_at: string
          especificacion: string | null
          estado: Database["public"]["Enums"]["estado_registro"]
          fecha_actualizacion_precio: string | null
          fuente_precio: string | null
          id: string
          marca: string | null
          nombre: string
          organizacion_id: string | null
          proveedor_id: string | null
          tipo: Database["public"]["Enums"]["tipo_recurso"]
          transporte_aplica: boolean
          unidad: string
          updated_at: string
        }
        Insert: {
          costo_transporte?: number
          costo_unitario_actual?: number
          created_at?: string
          especificacion?: string | null
          estado?: Database["public"]["Enums"]["estado_registro"]
          fecha_actualizacion_precio?: string | null
          fuente_precio?: string | null
          id?: string
          marca?: string | null
          nombre: string
          organizacion_id?: string | null
          proveedor_id?: string | null
          tipo: Database["public"]["Enums"]["tipo_recurso"]
          transporte_aplica?: boolean
          unidad: string
          updated_at?: string
        }
        Update: {
          costo_transporte?: number
          costo_unitario_actual?: number
          created_at?: string
          especificacion?: string | null
          estado?: Database["public"]["Enums"]["estado_registro"]
          fecha_actualizacion_precio?: string | null
          fuente_precio?: string | null
          id?: string
          marca?: string | null
          nombre?: string
          organizacion_id?: string | null
          proveedor_id?: string | null
          tipo?: Database["public"]["Enums"]["tipo_recurso"]
          transporte_aplica?: boolean
          unidad?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recursos_organizacion_id_fkey"
            columns: ["organizacion_id"]
            isOneToOne: false
            referencedRelation: "organizaciones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recursos_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "proveedores"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          created_at: string
          display_name: string
          email: string | null
          email_verified: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          email?: string | null
          email_verified?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          email?: string | null
          email_verified?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_organization_invitation: {
        Args: { p_token: string }
        Returns: {
          invitacion_id: string
          organizacion_id: string
          proyecto_id: string
        }[]
      }
      accept_organization_invitation_by_id: {
        Args: { p_invitacion_id: string }
        Returns: {
          invitacion_id: string
          organizacion_id: string
          proyecto_id: string
        }[]
      }
      add_draft_partida: {
        Args: { p_draft_id: string; p_partida_id: string }
        Returns: Json
      }
      can_edit_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      can_emit_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      can_read_project: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      complete_user_onboarding: {
        Args: { apellido_usuario: string; nombre_usuario: string }
        Returns: {
          organizacion_id: string
          organizacion_miembro_id: string
          perfil_user_id: string
        }[]
      }
      create_organization_for_current_user: {
        Args: { nombre_org: string; ruc_org?: string }
        Returns: {
          created_at: string
          estado: Database["public"]["Enums"]["estado_registro"]
          id: string
          nombre: string
          ruc: string | null
          tipo_organizacion: Database["public"]["Enums"]["tipo_organizacion"]
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizaciones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_organization_invitation: {
        Args: {
          p_email: string
          p_incluir_proyectos_futuros?: boolean
          p_organizacion_id: string
          p_proyecto_ids?: string[]
          p_rol_organizacion?: Database["public"]["Enums"]["rol_organizacion"]
          p_rol_proyecto?: Database["public"]["Enums"]["rol_proyecto"]
        }
        Returns: {
          email: string
          expires_at: string
          invitacion_id: string
          organizacion_id: string
          token: string
        }[]
      }
      create_organization_with_owner: {
        Args: {
          cliente?: string
          nombre_org: string
          nombre_proyecto: string
          ruc_org: string
          ubicacion?: string
        }
        Returns: {
          organizacion_id: string
          organizacion_miembro_id: string
          proyecto_id: string
          proyecto_miembro_id: string
        }[]
      }
      create_project_in_organization: {
        Args: {
          cliente?: string
          nombre_proyecto: string
          p_organizacion_id: string
          ubicacion?: string
        }
        Returns: {
          cliente: string | null
          codigo: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_proyecto"]
          id: string
          nombre: string
          organizacion_id: string
          ubicacion: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "proyectos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      create_project_with_current_member: {
        Args: { cliente?: string; nombre_proyecto: string; ubicacion?: string }
        Returns: {
          cliente: string | null
          codigo: string | null
          created_at: string
          created_by: string | null
          descripcion: string | null
          estado: Database["public"]["Enums"]["estado_proyecto"]
          id: string
          nombre: string
          organizacion_id: string
          ubicacion: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "proyectos"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_user_id: { Args: never; Returns: string }
      current_verified_email: { Args: never; Returns: string }
      emit_official_budget_version: {
        Args: { p_draft_id: string; p_expected_updated_at: string }
        Returns: Json
      }
      ensure_personal_organization_for_current_user: {
        Args: { display_name?: string }
        Returns: {
          organizacion_id: string
          organizacion_miembro_id: string
        }[]
      }
      is_organization_admin: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { target_organization_id: string }
        Returns: boolean
      }
      is_project_admin: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      is_project_member: {
        Args: { target_project_id: string }
        Returns: boolean
      }
      is_valid_activity_entity: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_organizacion_id: string
          p_presupuesto_borrador_id: string
          p_presupuesto_version_id: string
          p_proyecto_id: string
        }
        Returns: boolean
      }
      list_budget_dashboard_projects: {
        Args: { p_organizacion_id?: string }
        Returns: Json
      }
      list_received_organization_invitations: { Args: never; Returns: Json }
      list_sent_organization_invitations: {
        Args: { p_organizacion_id: string }
        Returns: Json
      }
      list_workspace_organizations: { Args: never; Returns: Json }
      project_belongs_to_organization: {
        Args: { target_organization_id: string; target_project_id: string }
        Returns: boolean
      }
      recalculate_budget_draft_totals: {
        Args: { p_draft_id: string }
        Returns: Json
      }
      refresh_draft_current_prices: {
        Args: { p_draft_id: string }
        Returns: Json
      }
      refresh_draft_current_prices_for_resources: {
        Args: { p_resource_ids: string[] }
        Returns: Json
      }
      regenerate_organization_invitation_token: {
        Args: { p_invitacion_id: string }
        Returns: {
          email: string
          expires_at: string
          invitacion_id: string
          organizacion_id: string
          token: string
        }[]
      }
      reject_organization_invitation: {
        Args: { p_invitacion_id: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["estado_invitacion"]
          expires_at: string
          id: string
          incluir_proyectos_futuros: boolean
          invited_by: string
          organizacion_id: string
          proyecto_id: string | null
          proyecto_ids: string[]
          revoked_at: string | null
          rol_organizacion: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto: Database["public"]["Enums"]["rol_proyecto"] | null
          token_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizacion_invitaciones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      revoke_organization_invitation: {
        Args: { p_invitacion_id: string }
        Returns: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          email: string
          estado: Database["public"]["Enums"]["estado_invitacion"]
          expires_at: string
          id: string
          incluir_proyectos_futuros: boolean
          invited_by: string
          organizacion_id: string
          proyecto_id: string | null
          proyecto_ids: string[]
          revoked_at: string | null
          rol_organizacion: Database["public"]["Enums"]["rol_organizacion"]
          rol_proyecto: Database["public"]["Enums"]["rol_proyecto"] | null
          token_hash: string
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "organizacion_invitaciones"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      estado_invitacion:
        | "pendiente"
        | "aceptada"
        | "rechazada"
        | "revocada"
        | "expirada"
      estado_miembro: "activo" | "invitado" | "suspendido"
      estado_presupuesto: "borrador" | "aprobado" | "archivado"
      estado_presupuesto_borrador: "activo" | "cerrado" | "archivado"
      estado_presupuesto_version: "emitida" | "anulada"
      estado_proyecto: "activo" | "archivado"
      estado_registro: "activo" | "inactivo"
      grupo_apu: "materiales" | "mano_obra" | "equipos_herramientas"
      moneda: "PEN"
      precio_origen: "catalogo" | "manual" | "snapshot"
      rol_organizacion: "owner" | "admin" | "miembro"
      rol_proyecto: "admin" | "presupuestador" | "editor" | "lector"
      tipo_organizacion: "personal" | "empresa"
      tipo_recurso: "material" | "mano_obra" | "equipo" | "herramienta"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_invitacion: [
        "pendiente",
        "aceptada",
        "rechazada",
        "revocada",
        "expirada",
      ],
      estado_miembro: ["activo", "invitado", "suspendido"],
      estado_presupuesto: ["borrador", "aprobado", "archivado"],
      estado_presupuesto_borrador: ["activo", "cerrado", "archivado"],
      estado_presupuesto_version: ["emitida", "anulada"],
      estado_proyecto: ["activo", "archivado"],
      estado_registro: ["activo", "inactivo"],
      grupo_apu: ["materiales", "mano_obra", "equipos_herramientas"],
      moneda: ["PEN"],
      precio_origen: ["catalogo", "manual", "snapshot"],
      rol_organizacion: ["owner", "admin", "miembro"],
      rol_proyecto: ["admin", "presupuestador", "editor", "lector"],
      tipo_organizacion: ["personal", "empresa"],
      tipo_recurso: ["material", "mano_obra", "equipo", "herramienta"],
    },
  },
} as const
