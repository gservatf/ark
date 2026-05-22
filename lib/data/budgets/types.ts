import type {
  Presupuesto,
  PresupuestoBorrador,
  PresupuestoBorradorPartida,
  PresupuestoBorradorPartidaRecurso,
  PresupuestoVersion,
  PresupuestoVersionPartida,
  PresupuestoVersionPartidaRecurso
} from "../../../types/domain";

export type BudgetDraftBundle = {
  draft: PresupuestoBorrador;
  lines: PresupuestoBorradorPartida[];
  resources: PresupuestoBorradorPartidaRecurso[];
  versions: PresupuestoVersion[];
};

export type OfficialBudgetVersionBundle = {
  version: PresupuestoVersion;
  lines: PresupuestoVersionPartida[];
  resources: PresupuestoVersionPartidaRecurso[];
};

export type BudgetDashboardProject = {
  cliente: string | null;
  estado: Presupuesto["estado"];
  gastoEjecutado: number;
  gastoPorcentaje: number;
  id: string;
  partidasCompletadas: number;
  partidasTotal: number;
  proyecto_nombre: string;
  subtotal: number;
  total: number;
  ubicacion: string | null;
  updated_at: string;
  version: string;
};

export type BudgetDraftUpdateInput = Partial<Pick<
  PresupuestoBorrador,
  | "cliente"
  | "gastos_generales_porcentaje"
  | "igv_porcentaje"
  | "nombre"
  | "ubicacion"
  | "utilidad_porcentaje"
>>;

export type PriceLockInput = {
  motivo_precio_fijado?: string | null;
  precio_fijado: boolean;
};

export type ClientQuoteSelectionInput = {
  quoteId: string | null;
};
