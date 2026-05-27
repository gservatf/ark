import { CheckCircle2, Plus, X } from "lucide-react";

import { grupoApuLabels } from "@/components/partidas/partida-ui";
import { Button } from "@/components/shared/Button";
import { inferApuCalculationTypeFromResource } from "@/lib/calculations/apu";
import type { GrupoApu, Recurso, TipoCalculoApu } from "@/types/domain";

export type ApuBuilderFormState = {
  cantidad_base: string;
  cuadrilla: string;
  grupo: GrupoApu;
  porcentaje_aplicado: string;
  recurso_id: string;
  tipo_calculo_apu: TipoCalculoApu;
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

const groups: GrupoApu[] = ["mano_obra", "materiales", "equipos_herramientas"];

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
          La cantidad y el parcial se calculan segun la regla del grupo.
        </p>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 2xl:grid-cols-1">
        <SelectField
          disabled={isEditing}
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

        <SelectField
          disabled={isEditing}
          error={errors.recurso_id}
          label="Recurso"
          onChange={(value) => onChange("recurso_id", value)}
          value={form.recurso_id}
        >
          <option value="">Seleccionar recurso</option>
          {resources
            .filter((resource) => resourceMatchesApuGroup(resource, form.grupo))
            .map((resource) => (
              <option key={resource.id} value={resource.id}>
                {resource.nombre}
              </option>
            ))}
        </SelectField>

        <SelectField
          label="Tipo de calculo"
          onChange={(value) => onChange("tipo_calculo_apu", value as TipoCalculoApu)}
          value={form.tipo_calculo_apu}
        >
          <option value="mano_obra_rendimiento">Cuadrilla por rendimiento</option>
          <option value="material_desperdicio">Material con desperdicio global</option>
          <option value="equipo_hm_rendimiento">Equipo HM por rendimiento</option>
          <option value="equipo_cantidad_fija">Cantidad fija</option>
          <option value="herramientas_porcentaje_mano_obra">% mano de obra</option>
        </SelectField>

        {form.tipo_calculo_apu === "mano_obra_rendimiento" ||
        form.tipo_calculo_apu === "equipo_hm_rendimiento" ? (
          <TextField
            error={errors.cuadrilla}
            label="Cuadrilla"
            onChange={(value) => onChange("cuadrilla", value)}
            type="number"
            value={form.cuadrilla}
          />
        ) : form.tipo_calculo_apu === "herramientas_porcentaje_mano_obra" ? (
          <TextField
            error={errors.porcentaje_aplicado}
            label="% mano de obra"
            onChange={(value) => onChange("porcentaje_aplicado", value)}
            type="number"
            value={form.porcentaje_aplicado}
          />
        ) : (
          <TextField
            error={errors.cantidad_base}
            label="Cantidad"
            onChange={(value) => onChange("cantidad_base", value)}
            type="number"
            value={form.cantidad_base}
          />
        )}
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
          title={canMutate ? undefined : "Solo admins de proyecto u organizacion pueden editar el APU"}
        >
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar recurso" : "Agregar recurso"}
        </Button>
      </footer>
    </section>
  );
}

export function buildApuFormFromResource(
  resource: Recurso
): Pick<ApuBuilderFormState, "grupo" | "tipo_calculo_apu"> {
  const grupo = getApuGroupForResource(resource);

  return {
    grupo,
    tipo_calculo_apu: inferApuCalculationTypeFromResource({ grupo, unidad: resource.unidad })
  };
}

export function defaultApuFormForGroup(group: GrupoApu): Pick<ApuBuilderFormState, "grupo" | "tipo_calculo_apu"> {
  return {
    grupo: group,
    tipo_calculo_apu:
      group === "mano_obra"
        ? "mano_obra_rendimiento"
        : group === "materiales"
          ? "material_desperdicio"
          : "equipo_cantidad_fija"
  };
}

export function resourceMatchesApuGroup(resource: Recurso, group: GrupoApu) {
  return getApuGroupForResource(resource) === group;
}

function getApuGroupForResource(resource: Recurso): GrupoApu {
  if (resource.tipo === "material") {
    return "materiales";
  }

  if (resource.tipo === "mano_obra") {
    return "mano_obra";
  }

  return "equipos_herramientas";
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
