import { CheckCircle2, Plus, PowerOff, Star, X } from "lucide-react";

import { Button } from "@/components/shared/Button";
import { formatCurrency } from "@/components/recursos/resource-ui";
import type { EstadoRegistro, Proveedor, Recurso, RecursoProveedorPrecio } from "@/types/domain";

export type ResourceQuoteFormState = {
  costo_transporte: string;
  costo_unitario: string;
  es_preferido_interno: boolean;
  estado: EstadoRegistro;
  fecha_cotizacion: string;
  fuente_precio: string;
  proveedor_id: string;
  url_referencia: string;
  vigente_desde: string;
  vigente_hasta: string;
};

type ResourceQuotesPanelProps = {
  canMutate: boolean;
  errors: Partial<Record<keyof ResourceQuoteFormState, string>>;
  form: ResourceQuoteFormState;
  isEditing: boolean;
  isLoading?: boolean;
  isSubmitting?: boolean;
  providers: Proveedor[];
  quotes: RecursoProveedorPrecio[];
  resource?: Recurso;
  showForm: boolean;
  onCancel: () => void;
  onChange: <Field extends keyof ResourceQuoteFormState>(
    field: Field,
    value: ResourceQuoteFormState[Field]
  ) => void;
  onDeactivate: (quote: RecursoProveedorPrecio) => void;
  onEdit: (quote: RecursoProveedorPrecio) => void;
  onOpenCreate: () => void;
  onSubmit: () => void;
};

const statuses: EstadoRegistro[] = ["activo", "inactivo"];

export function ResourceQuotesPanel({
  canMutate,
  errors,
  form,
  isEditing,
  isLoading = false,
  isSubmitting = false,
  onCancel,
  onChange,
  onDeactivate,
  onEdit,
  onOpenCreate,
  onSubmit,
  providers,
  quotes,
  resource,
  showForm
}: ResourceQuotesPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">Cotizaciones</h2>
          <p className="mt-1 text-sm text-slate-500">
            Precios por proveedor para costo interno y precio cliente.
          </p>
        </div>
        <Button
          disabled={!resource || !canMutate || isLoading}
          icon={Plus}
          onClick={onOpenCreate}
          title={canMutate ? "Nueva cotización" : "Solo admins de proyecto u organización pueden crear cotizaciones"}
        >
          Nueva
        </Button>
      </div>

      <div className="p-5">
        {!resource ? (
          <p className="text-sm text-slate-500">Selecciona un recurso para ver sus cotizaciones.</p>
        ) : isLoading ? (
          <p className="text-sm font-medium text-slate-500">Cargando cotizaciones...</p>
        ) : quotes.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
            Este recurso aún no tiene cotizaciones por proveedor.
          </p>
        ) : (
          <div className="space-y-3">
            {quotes.map((quote) => (
              <QuoteRow
                canMutate={canMutate}
                key={quote.id}
                onDeactivate={() => onDeactivate(quote)}
                onEdit={() => onEdit(quote)}
                quote={quote}
              />
            ))}
          </div>
        )}

        {showForm ? (
          <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="grid gap-4 md:grid-cols-2">
              <SelectField
                error={errors.proveedor_id}
                label="Proveedor"
                onChange={(value) => onChange("proveedor_id", value)}
                value={form.proveedor_id}
              >
                <option value="">Seleccionar proveedor</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.nombre}
                    {provider.disponible_para_cliente ? " (cliente)" : " (interno)"}
                  </option>
                ))}
              </SelectField>
              <TextField
                error={errors.fecha_cotizacion}
                label="Fecha cotización"
                onChange={(value) => onChange("fecha_cotizacion", value)}
                type="date"
                value={form.fecha_cotizacion}
              />
              <TextField
                error={errors.costo_unitario}
                label="Costo unitario"
                onChange={(value) => onChange("costo_unitario", value)}
                type="number"
                value={form.costo_unitario}
              />
              <TextField
                error={errors.costo_transporte}
                label="Transporte"
                onChange={(value) => onChange("costo_transporte", value)}
                type="number"
                value={form.costo_transporte}
              />
              <TextField
                label="Fuente"
                onChange={(value) => onChange("fuente_precio", value)}
                placeholder="Lista, contrato, correo"
                value={form.fuente_precio}
              />
              <TextField
                label="URL referencia"
                onChange={(value) => onChange("url_referencia", value)}
                placeholder="Opcional"
                value={form.url_referencia}
              />
              <TextField
                label="Vigente desde"
                onChange={(value) => onChange("vigente_desde", value)}
                type="date"
                value={form.vigente_desde}
              />
              <TextField
                error={errors.vigente_hasta}
                label="Vigente hasta"
                onChange={(value) => onChange("vigente_hasta", value)}
                type="date"
                value={form.vigente_hasta}
              />
              <SelectField
                label="Estado"
                onChange={(value) => onChange("estado", value as EstadoRegistro)}
                value={form.estado}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status === "activo" ? "Activo" : "Inactivo"}
                  </option>
                ))}
              </SelectField>
              <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
                <input
                  checked={form.es_preferido_interno}
                  className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-blue-200"
                  onChange={(event) => onChange("es_preferido_interno", event.target.checked)}
                  type="checkbox"
                />
                <span className="text-sm font-bold text-slate-800">Preferido interno</span>
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <Button disabled={isSubmitting} icon={X} onClick={onCancel} variant="secondary">
                Cancelar
              </Button>
              <Button disabled={isSubmitting} icon={CheckCircle2} onClick={onSubmit}>
                {isSubmitting ? "Guardando..." : isEditing ? "Guardar" : "Crear"}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function QuoteRow({
  canMutate,
  onDeactivate,
  onEdit,
  quote
}: {
  canMutate: boolean;
  onDeactivate: () => void;
  onEdit: () => void;
  quote: RecursoProveedorPrecio;
}) {
  const provider = quote.proveedor;
  const total = quote.costo_unitario + quote.costo_transporte;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-bold text-slate-900">
            {provider?.nombre || "Proveedor sin nombre"}
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {provider?.disponible_para_cliente ? "Visible para cliente" : "Referencia interna"}
          </p>
        </div>
        <div className="flex gap-2">
          {quote.es_preferido_interno ? (
            <span className="inline-flex h-8 items-center gap-1 rounded-lg bg-amber-100 px-2.5 text-xs font-bold text-amber-700">
              <Star className="h-3.5 w-3.5" />
              Interno
            </span>
          ) : null}
          <button
            className="h-8 rounded-lg px-2 text-xs font-bold text-brand-600 hover:bg-blue-50 disabled:opacity-40"
            disabled={!canMutate}
            onClick={onEdit}
            type="button"
          >
            Editar
          </button>
          <button
            aria-label="Desactivar cotización"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-40"
            disabled={!canMutate || quote.estado === "inactivo"}
            onClick={onDeactivate}
            type="button"
          >
            <PowerOff className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <MiniStat label="Unitario" value={formatCurrency(quote.costo_unitario)} />
        <MiniStat label="Transporte" value={formatCurrency(quote.costo_transporte)} />
        <MiniStat label="Total cliente" value={formatCurrency(total)} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 px-3 py-2">
      <p className="text-[11px] font-bold uppercase text-slate-500">{label}</p>
      <p className="mt-1 font-bold text-slate-800">{value}</p>
    </div>
  );
}

function TextField({
  error,
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  children,
  error,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}
