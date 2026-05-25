import { CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import {
  grupoApuLabels
} from "@/components/partidas/partida-ui";
import type { GrupoApu, Recurso } from "@/types/domain";

export type ApuBuilderFormState = {
  cantidad: string;
  desperdicio_porcentaje: string;
  gastos_generales_porcentaje: string;
  grupo: GrupoApu;
  recurso_id: string;
  rendimiento_factor: string;
  utilidad_porcentaje: string;
};

type ApuBuilderPanelProps = {
  canMutate: boolean;
  errors: Partial<Record<keyof ApuBuilderFormState, string>>;
  form: ApuBuilderFormState;
  isEditing: boolean;
  isSubmitting: boolean;
  resources: Recurso[];
  onCancelEdit: () => void;
  onChange: <Field extends keyof ApuBuilderFormState>(
    field: Field,
    value: ApuBuilderFormState[Field]
  ) => void;
  onSubmit: () => void;
};

const groups: GrupoApu[] = ["materiales", "mano_obra", "equipos_herramientas"];

export function ApuBuilderPanel({
  canMutate,
  errors,
  form,
  isEditing,
  isSubmitting,
  onCancelEdit,
  onChange,
  onSubmit,
  resources
}: ApuBuilderPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-bold text-slate-950">
          {isEditing ? "Editar recurso APU" : "Agregar recurso"}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Los costos se toman como snapshot desde el catálogo de recursos.
        </p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 2xl:grid-cols-1">
        <SelectField
          disabled={isEditing}
          error={errors.recurso_id}
          label="Recurso"
          onChange={(value) => onChange("recurso_id", value)}
          value={form.recurso_id}
        >
          <option value="">Seleccionar recurso</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.nombre}
            </option>
          ))}
        </SelectField>

        <SelectField
          label="Grupo APU"
          onChange={(value) => onChange("grupo", value as GrupoApu)}
          value={form.grupo}
        >
          {groups.map((group) => (
            <option key={group} value={group}>
              {grupoApuLabels[group]}
            </option>
          ))}
        </SelectField>

        <TextField
          error={errors.cantidad}
          label="Cantidad"
          onChange={(value) => onChange("cantidad", value)}
          type="number"
          value={form.cantidad}
        />

        <TextField
          error={errors.desperdicio_porcentaje}
          label="Desperdicio %"
          onChange={(value) => onChange("desperdicio_porcentaje", value)}
          type="number"
          value={form.desperdicio_porcentaje}
        />

        <TextField
          error={errors.rendimiento_factor}
          label="Factor rendimiento"
          onChange={(value) => onChange("rendimiento_factor", value)}
          type="number"
          value={form.rendimiento_factor}
        />

        <div className="grid gap-4 md:col-span-2 md:grid-cols-2 2xl:col-span-1 2xl:grid-cols-1">
          <TextField
            error={errors.gastos_generales_porcentaje}
            label="Gastos generales %"
            onChange={(value) => onChange("gastos_generales_porcentaje", value)}
            type="number"
            value={form.gastos_generales_porcentaje}
          />
          <TextField
            error={errors.utilidad_porcentaje}
            label="Utilidad %"
            onChange={(value) => onChange("utilidad_porcentaje", value)}
            type="number"
            value={form.utilidad_porcentaje}
          />
        </div>
      </div>

      <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
        {isEditing ? (
          <Button disabled={isSubmitting} icon={X} onClick={onCancelEdit} variant="secondary">
            Cancelar
          </Button>
        ) : null}
        <Button
          disabled={!canMutate || isSubmitting}
          icon={isEditing ? CheckCircle2 : Plus}
          onClick={onSubmit}
          title={canMutate ? undefined : "Solo admins de proyecto u organización pueden editar el APU"}
        >
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar recurso" : "Agregar recurso"}
        </Button>
      </footer>
    </section>
  );
}

function TextField({
  error,
  label,
  onChange,
  type = "text",
  value
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  type?: string;
  value: string;
}) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        min={type === "number" ? "0" : undefined}
        onChange={(event) => onChange(event.target.value)}
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
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <select
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-400"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        value={value}
      >
        {children}
      </select>
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}
