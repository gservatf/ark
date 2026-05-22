import { useId } from "react";
import { CheckCircle2, X } from "lucide-react";

import { Button } from "@/components/shared/Button";
import type { EstadoPartida } from "@/types/domain";

export type PartidaFormState = {
  categoria: string;
  codigo: string;
  cuadrilla: string;
  descripcion: string;
  especificaciones: string;
  estado: EstadoPartida;
  nombre: string;
  rendimiento: string;
  unidad: string;
};

type PartidaFormPanelProps = {
  errors: Partial<Record<keyof PartidaFormState, string>>;
  form: PartidaFormState;
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onChange: <Field extends keyof PartidaFormState>(
    field: Field,
    value: PartidaFormState[Field]
  ) => void;
  onSubmit: () => void;
};

export function PartidaFormPanel({
  errors,
  form,
  isEditing,
  isSubmitting,
  onCancel,
  onChange,
  onSubmit
}: PartidaFormPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">
          {isEditing ? "Editar partida" : "Nueva partida"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Define la cabecera tecnica; el APU se gestiona desde el detalle.
        </p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
        <TextField
          disabled={isSubmitting}
          error={errors.codigo}
          label="Código"
          onChange={(value) => onChange("codigo", value)}
          value={form.codigo}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.nombre}
          label="Nombre"
          onChange={(value) => onChange("nombre", value)}
          value={form.nombre}
          wrapperClassName="md:col-span-2"
        />
        <TextField
          disabled={isSubmitting}
          error={errors.unidad}
          label="Unidad"
          onChange={(value) => onChange("unidad", value)}
          value={form.unidad}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.categoria}
          label="Categoria"
          onChange={(value) => onChange("categoria", value)}
          value={form.categoria}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.rendimiento}
          label="Rendimiento"
          onChange={(value) => onChange("rendimiento", value)}
          type="number"
          value={form.rendimiento}
        />
        <TextField
          disabled={isSubmitting}
          error={errors.cuadrilla}
          label="Cuadrilla"
          onChange={(value) => onChange("cuadrilla", value)}
          value={form.cuadrilla}
        />
        <SelectField
          disabled={isSubmitting}
          error={errors.estado}
          label="Estado"
          onChange={(value) => onChange("estado", value as EstadoPartida)}
          value={form.estado}
        >
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </SelectField>
        <TextareaField
          disabled={isSubmitting}
          error={errors.descripcion}
          label="Descripcion"
          onChange={(value) => onChange("descripcion", value)}
          value={form.descripcion}
          wrapperClassName="md:col-span-2"
        />
        <TextareaField
          disabled={isSubmitting}
          error={errors.especificaciones}
          label="Especificaciones"
          onChange={(value) => onChange("especificaciones", value)}
          value={form.especificaciones}
          wrapperClassName="md:col-span-2"
        />
      </div>

      <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <Button disabled={isSubmitting} icon={X} onClick={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button disabled={isSubmitting} icon={CheckCircle2} onClick={onSubmit}>
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar partida" : "Crear partida"}
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
  type = "text",
  value,
  wrapperClassName
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
  wrapperClassName?: string;
}) {
  const inputId = useId();

  return (
    <div className={wrapperClassName || "block"}>
      <label className="text-xs font-bold uppercase text-slate-500" htmlFor={inputId}>
        {label}
      </label>
      <input
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        disabled={disabled}
        id={inputId}
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(event.target.value)}
        step={type === "number" ? "0.01" : undefined}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </div>
  );
}

function TextareaField({
  disabled,
  error,
  label,
  onChange,
  value,
  wrapperClassName
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  onChange: (value: string) => void;
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
        className="mt-2 min-h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        disabled={disabled}
        id={textareaId}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </div>
  );
}

function SelectField({
  children,
  disabled,
  error,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
  disabled?: boolean;
  error?: string;
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
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </div>
  );
}
