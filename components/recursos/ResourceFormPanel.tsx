import { useId } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { EstadoRegistro, Proveedor, TipoRecurso } from "@/types/domain";
import { resourceStatusLabels, resourceTypeLabels } from "@/components/recursos/resource-ui";

export type ResourceFormState = {
  costo_transporte: string;
  costo_unitario_actual: string;
  especificacion: string;
  estado: EstadoRegistro;
  fecha_actualizacion_precio: string;
  fuente_precio: string;
  marca: string;
  nombre: string;
  proveedor_id: string;
  tipo: TipoRecurso;
  transporte_aplica: boolean;
  unidad: string;
};

type ResourceFormPanelProps = {
  errors: Partial<Record<keyof ResourceFormState, string>>;
  form: ResourceFormState;
  isEditing: boolean;
  isSubmitting?: boolean;
  providers: Proveedor[];
  onCancel: () => void;
  onChange: <Field extends keyof ResourceFormState>(
    field: Field,
    value: ResourceFormState[Field]
  ) => void;
  onSubmit: () => void;
};

const resourceTypes: TipoRecurso[] = ["material", "mano_obra", "equipo", "herramienta"];
const statuses: EstadoRegistro[] = ["activo", "inactivo"];

export function ResourceFormPanel({
  errors,
  form,
  isEditing,
  isSubmitting = false,
  onCancel,
  onChange,
  onSubmit,
  providers
}: ResourceFormPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {isEditing ? "Editar recurso" : "Nuevo recurso"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Datos del catálogo canónico de recursos.
          </p>
        </div>
        <button
          aria-label="Cerrar formulario"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
          onClick={onCancel}
          type="button"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2">
        <TextField
          disabled={isSubmitting}
          error={errors.nombre}
          label="Nombre"
          onChange={(value) => onChange("nombre", value)}
          placeholder="Ej. Cemento Portland Tipo I"
          value={form.nombre}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.unidad}
          label="Unidad"
          onChange={(value) => onChange("unidad", value)}
          placeholder="bol, m3, jor, hm"
          value={form.unidad}
        />
        <SelectField
          disabled={isSubmitting}
          label="Tipo"
          onChange={(value) => onChange("tipo", value as TipoRecurso)}
          value={form.tipo}
        >
          {resourceTypes.map((type) => (
            <option key={type} value={type}>
              {resourceTypeLabels[type]}
            </option>
          ))}
        </SelectField>
        <SelectField
          disabled={isSubmitting}
          label="Proveedor"
          onChange={(value) => onChange("proveedor_id", value)}
          value={form.proveedor_id}
        >
          <option value="">Sin proveedor</option>
          {providers
            .filter((provider) => provider.estado === "activo" || provider.id === form.proveedor_id)
            .map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.nombre}
              </option>
            ))}
        </SelectField>
        <TextField
          disabled={isSubmitting}
          error={errors.costo_unitario_actual}
          label="Costo unitario actual"
          onChange={(value) => onChange("costo_unitario_actual", value)}
          placeholder="0.00"
          type="number"
          value={form.costo_unitario_actual}
        />
        <TextField
          disabled={isSubmitting || !form.transporte_aplica}
          error={errors.costo_transporte}
          label="Costo transporte"
          onChange={(value) => onChange("costo_transporte", value)}
          placeholder="0.00"
          type="number"
          value={form.costo_transporte}
        />
        <TextField
          disabled={isSubmitting}
          label="Marca"
          onChange={(value) => onChange("marca", value)}
          placeholder="Opcional"
          value={form.marca}
        />
        <TextField
          disabled={isSubmitting}
          label="Fuente de precio"
          onChange={(value) => onChange("fuente_precio", value)}
          placeholder="Cotizacion, tarifario, contrato"
          value={form.fuente_precio}
        />
        <TextField
          disabled={isSubmitting}
          label="Fecha actualizacion precio"
          onChange={(value) => onChange("fecha_actualizacion_precio", value)}
          type="date"
          value={form.fecha_actualizacion_precio}
        />
        <SelectField
          disabled={isSubmitting}
          label="Estado"
          onChange={(value) => onChange("estado", value as EstadoRegistro)}
          value={form.estado}
        >
          {statuses.map((status) => (
            <option key={status} value={status}>
              {resourceStatusLabels[status]}
            </option>
          ))}
        </SelectField>
        <CheckboxField
          checked={form.transporte_aplica}
          description="Si esta apagado, el costo de transporte se guarda como 0."
          disabled={isSubmitting}
          label="Transporte aplica"
          onChange={(checked) => onChange("transporte_aplica", checked)}
        />
        <TextareaField
          disabled={isSubmitting}
          label="Especificacion"
          onChange={(value) => onChange("especificacion", value)}
          placeholder="Detalle tecnico o condicion comercial relevante"
          value={form.especificacion}
          wrapperClassName="md:col-span-2 block"
        />
      </div>

      <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <Button disabled={isSubmitting} icon={X} onClick={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button disabled={isSubmitting} icon={isEditing ? CheckCircle2 : Plus} onClick={onSubmit}>
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear recurso"}
        </Button>
      </footer>
    </section>
  );
}

function TextField({
  disabled,
  error,
  label,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
}) {
  const inputId = useId();

  return (
    <div className="block">
      <label className="text-xs font-bold uppercase text-slate-500" htmlFor={inputId}>
        {label}
      </label>
      <input
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        id={inputId}
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </div>
  );
}

function SelectField({
  children,
  disabled,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  const selectId = useId();

  return (
    <div className="block">
      <label className="text-xs font-bold uppercase text-slate-500" htmlFor={selectId}>
        {label}
      </label>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        disabled={disabled}
        id={selectId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
    </div>
  );
}

function TextareaField({
  disabled,
  label,
  onChange,
  placeholder,
  value,
  wrapperClassName
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
  wrapperClassName?: string;
}) {
  const textareaId = useId();

  return (
    <div className={wrapperClassName || "block"}>
      <label className="text-xs font-bold uppercase text-slate-500" htmlFor={textareaId}>
        {label}
      </label>
      <textarea
        className="mt-2 min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        id={textareaId}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

function CheckboxField({
  checked,
  description,
  disabled,
  label,
  onChange
}: {
  checked: boolean;
  description: string;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  const checkboxId = useId();

  return (
    <div className="md:col-span-2 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <input
        checked={checked}
        className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-blue-200"
        disabled={disabled}
        id={checkboxId}
        onChange={(event) => onChange(event.target.checked)}
        type="checkbox"
      />
      <label htmlFor={checkboxId}>
        <span className="block text-sm font-bold text-slate-800">{label}</span>
        <span className="block text-xs text-slate-500">{description}</span>
      </label>
    </div>
  );
}
