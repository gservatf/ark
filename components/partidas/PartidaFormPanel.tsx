"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import {
  buildApuFormFromResource,
  defaultApuFormForGroup,
  resourceMatchesApuGroup,
  type ApuBuilderFormState
} from "@/components/partidas/ApuBuilderPanel";
import { formatCurrency, formatNumber, grupoApuLabels } from "@/components/partidas/partida-ui";
import { Button } from "@/components/shared/Button";
import {
  calculateApuDirectCost,
  calculateApuResourceValues
} from "@/lib/calculations/apu";
import type {
  GrupoApu,
  PartidaCategoria,
  PartidaRecurso,
  PartidaSubcategoria,
  Recurso,
  UnidadMedida
} from "@/types/domain";

export type PartidaFormState = {
  categoria: string;
  categoria_id: string;
  codigo: string;
  desperdicio_materiales_porcentaje: string;
  especificaciones: string;
  jornada_horas: string;
  nombre: string;
  rendimiento: string;
  subcategoria: string;
  subcategoria_id: string;
  unidad_id: string;
  unidad: string;
};

export type ApuDraftResource = Omit<
  ApuBuilderFormState,
  "grupo"
> & {
  grupo: GrupoApu;
  tempId: string;
};

type PartidaFormPanelProps = {
  catalogs: {
    categorias: PartidaCategoria[];
    subcategorias: PartidaSubcategoria[];
    unidades: UnidadMedida[];
  };
  errors: Partial<Record<keyof PartidaFormState, string>>;
  form: PartidaFormState;
  isEditing: boolean;
  isSubmitting: boolean;
  resourceCatalog: Recurso[];
  onCreateCategoria: (nombre: string) => Promise<PartidaCategoria | null>;
  onCreateSubcategoria: (categoriaId: string, nombre: string) => Promise<PartidaSubcategoria | null>;
  onCreateUnidad: (codigo: string) => Promise<UnidadMedida | null>;
  onUpdateUnidad: (unidadId: string, values: { codigo: string; nombre: string }) => Promise<UnidadMedida | null>;
  onCancel: () => void;
  onChange: <Field extends keyof PartidaFormState>(
    field: Field,
    value: PartidaFormState[Field]
  ) => void;
  onPatch: (values: Partial<PartidaFormState>) => void;
  onSubmit: (resources: ApuDraftResource[], createAnother: boolean) => void;
};

const emptyApuForm: ApuBuilderFormState = {
  cantidad_base: "1",
  cuadrilla: "1",
  grupo: "materiales",
  porcentaje_aplicado: "3",
  recurso_id: "",
  tipo_calculo_apu: "material_desperdicio"
};

export function PartidaFormPanel({
  catalogs,
  errors,
  form,
  isEditing,
  isSubmitting,
  onCreateCategoria,
  onCreateSubcategoria,
  onCreateUnidad,
  onUpdateUnidad,
  onCancel,
  onChange,
  onPatch,
  onSubmit,
  resourceCatalog
}: PartidaFormPanelProps) {
  const [step, setStep] = useState<"datos" | "apu">("datos");
  const [apuForm, setApuForm] = useState<ApuBuilderFormState>(emptyApuForm);
  const [apuResources, setApuResources] = useState<ApuDraftResource[]>([]);
  const [apuError, setApuError] = useState<string | null>(null);
  const [activeCatalogAdd, setActiveCatalogAdd] = useState<"categoria" | "subcategoria" | "unidad" | null>(null);

  const previewResources = useMemo(
    () => buildPreviewResources(apuResources, resourceCatalog, form),
    [apuResources, form, resourceCatalog]
  );
  const totals = useMemo(
    () => calculateApuDirectCost(previewResources, partidaContext(form)),
    [form, previewResources]
  );
  const filteredResources = useMemo(
    () =>
      resourceCatalog.filter(
        (resource) =>
          resource.estado === "activo" &&
          resourceMatchesApuGroup(resource, apuForm.grupo)
      ),
    [apuForm.grupo, resourceCatalog]
  );
  const activeCategorias = useMemo(
    () => catalogs.categorias.filter((item) => item.estado === "activo"),
    [catalogs.categorias]
  );
  const activeSubcategorias = useMemo(
    () =>
      catalogs.subcategorias.filter(
        (item) => item.estado === "activo" && item.categoria_id === form.categoria_id
      ),
    [catalogs.subcategorias, form.categoria_id]
  );
  const activeUnidades = useMemo(
    () => catalogs.unidades.filter((item) => item.estado === "activo"),
    [catalogs.unidades]
  );

  function changeApu<Field extends keyof ApuBuilderFormState>(
    field: Field,
    value: ApuBuilderFormState[Field]
  ) {
    const nextForm = { ...apuForm, [field]: value };

    if (field === "grupo") {
      Object.assign(nextForm, defaultApuFormForGroup(value as GrupoApu), {
        recurso_id: ""
      });
    }

    if (field === "recurso_id") {
      const resource = resourceCatalog.find((item) => item.id === value);

      if (resource) {
        Object.assign(nextForm, buildApuFormFromResource(resource));
      }
    }

    setApuForm(nextForm);
    setApuError(null);
  }

  function addApuResource() {
    if (!apuForm.recurso_id) {
      setApuError("Selecciona un recurso para agregarlo al APU.");
      return;
    }

    if (
      (apuForm.tipo_calculo_apu === "mano_obra_rendimiento" ||
        apuForm.tipo_calculo_apu === "equipo_hm_rendimiento") &&
      !apuForm.cuadrilla.trim()
    ) {
      setApuError("La cuadrilla es obligatoria para este recurso.");
      return;
    }

    if (
      (apuForm.tipo_calculo_apu === "material_desperdicio" ||
        apuForm.tipo_calculo_apu === "equipo_cantidad_fija") &&
      !apuForm.cantidad_base.trim()
    ) {
      setApuError("La cantidad es obligatoria para este recurso.");
      return;
    }

    setApuResources((current) => [
      ...current,
      {
        ...apuForm,
        tempId: crypto.randomUUID()
      }
    ]);
    setApuForm(emptyApuForm);
  }

  function handleCancel() {
    if (
      form.codigo ||
      form.nombre ||
      form.categoria ||
      form.subcategoria ||
      form.especificaciones ||
      apuResources.length > 0
    ) {
      if (!window.confirm("Hay cambios sin guardar. ¿Deseas cancelar?")) {
        return;
      }
    }

    onCancel();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
      >
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-950">
              {isEditing ? "Editar partida" : "Nueva partida"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Crea la informacion base y, si deseas, completa el APU en este mismo flujo.
            </p>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <StepButton active={step === "datos"} onClick={() => setStep("datos")}>
              Datos de partida
            </StepButton>
            <StepButton active={step === "apu"} onClick={() => setStep("apu")}>
              APU
            </StepButton>
          </div>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {step === "datos" ? (
            <div className="grid gap-4 p-6 md:grid-cols-2 xl:grid-cols-4">
              <TextField error={errors.codigo} label="Codigo" onChange={(value) => onChange("codigo", value)} value={form.codigo} />
              <CatalogSelectField
                addLabel="Nueva unidad"
                disabled={isSubmitting}
                error={errors.unidad || errors.unidad_id}
                isAdding={activeCatalogAdd === "unidad"}
                label="Unidad"
                onAddingChange={(isAdding) => setActiveCatalogAdd(isAdding ? "unidad" : null)}
                onCreate={async (name) => {
                  const unidad = await onCreateUnidad(name);

                  if (unidad) {
                    onPatch({ unidad: unidad.codigo, unidad_id: unidad.id });
                    return true;
                  }

                  return false;
                }}
                onSelect={(id) => {
                  const unidad = activeUnidades.find((item) => item.id === id);

                  onPatch({
                    unidad: unidad?.codigo || "",
                    unidad_id: unidad?.id || ""
                  });
                }}
                onSelectOpen={() => setActiveCatalogAdd(null)}
                onUpdateSelected={async (id, values) => {
                  const unidad = await onUpdateUnidad(id, {
                    codigo: values.label,
                    nombre: values.description || values.label
                  });

                  if (unidad) {
                    onPatch({ unidad: unidad.codigo, unidad_id: unidad.id });
                    return true;
                  }

                  return false;
                }}
                options={activeUnidades.map((unidad) => ({
                  description: unidad.nombre,
                  id: unidad.id,
                  label: unidad.codigo
                }))}
                placeholder="Seleccionar unidad"
                value={form.unidad_id}
              />
              <TextField error={errors.nombre} label="Nombre de la partida" onChange={(value) => onChange("nombre", value)} value={form.nombre} wrapperClassName="md:col-span-2" />
              <CatalogSelectField
                addLabel="Nueva categoria"
                disabled={isSubmitting}
                error={errors.categoria || errors.categoria_id}
                isAdding={activeCatalogAdd === "categoria"}
                label="Categoria"
                onAddingChange={(isAdding) => setActiveCatalogAdd(isAdding ? "categoria" : null)}
                onCreate={async (name) => {
                  const categoria = await onCreateCategoria(name);

                  if (categoria) {
                    onPatch({
                      categoria: categoria.nombre,
                      categoria_id: categoria.id,
                      subcategoria: "",
                      subcategoria_id: ""
                    });
                    return true;
                  }

                  return false;
                }}
                onSelect={(id) => {
                  const categoria = activeCategorias.find((item) => item.id === id);

                  onPatch({
                    categoria: categoria?.nombre || "",
                    categoria_id: categoria?.id || "",
                    subcategoria: "",
                    subcategoria_id: ""
                  });
                }}
                onSelectOpen={() => setActiveCatalogAdd(null)}
                options={activeCategorias.map((categoria) => ({
                  id: categoria.id,
                  label: categoria.nombre
                }))}
                placeholder="Seleccionar categoria"
                value={form.categoria_id}
              />
              <CatalogSelectField
                addDisabled={!form.categoria_id}
                addLabel="Nueva subcategoria"
                disabled={isSubmitting || !form.categoria_id}
                emptyLabel={form.categoria_id ? "Sin subcategorias" : "Selecciona una categoria"}
                error={errors.subcategoria || errors.subcategoria_id}
                isAdding={activeCatalogAdd === "subcategoria"}
                label="Subcategoria"
                onAddingChange={(isAdding) => setActiveCatalogAdd(isAdding ? "subcategoria" : null)}
                onCreate={async (name) => {
                  if (!form.categoria_id) {
                    return false;
                  }

                  const subcategoria = await onCreateSubcategoria(form.categoria_id, name);

                  if (subcategoria) {
                    onPatch({
                      subcategoria: subcategoria.nombre,
                      subcategoria_id: subcategoria.id
                    });
                    return true;
                  }

                  return false;
                }}
                onSelect={(id) => {
                  const subcategoria = activeSubcategorias.find((item) => item.id === id);

                  onPatch({
                    subcategoria: subcategoria?.nombre || "",
                    subcategoria_id: subcategoria?.id || ""
                  });
                }}
                onSelectOpen={() => setActiveCatalogAdd(null)}
                options={activeSubcategorias.map((subcategoria) => ({
                  id: subcategoria.id,
                  label: subcategoria.nombre
                }))}
                placeholder="Opcional"
                value={form.subcategoria_id}
              />
              <TextField error={errors.rendimiento} label="Rendimiento" onChange={(value) => onChange("rendimiento", value)} placeholder="1 por defecto" type="number" value={form.rendimiento} />
              <TextField error={errors.jornada_horas} label="Jornada hr/dia" onChange={(value) => onChange("jornada_horas", value)} type="number" value={form.jornada_horas} />
              <TextField error={errors.desperdicio_materiales_porcentaje} label="Desperdicio materiales %" onChange={(value) => onChange("desperdicio_materiales_porcentaje", value)} type="number" value={form.desperdicio_materiales_porcentaje} />
              <TextareaField error={errors.especificaciones} label="Notas y especificaciones" onChange={(value) => onChange("especificaciones", value)} value={form.especificaciones} wrapperClassName="md:col-span-2 xl:col-span-4" />
            </div>
          ) : (
            <div className="grid gap-5 p-6">
              <section className="rounded-xl border border-slate-200 p-4">
                <div className="grid items-end gap-4 lg:grid-cols-[minmax(180px,1.2fr)_minmax(220px,1.2fr)_minmax(140px,0.7fr)_minmax(190px,0.9fr)]">
                  <SelectField label="Grupo" onChange={(value) => changeApu("grupo", value as GrupoApu)} value={apuForm.grupo}>
                    <option value="mano_obra">Mano de obra</option>
                    <option value="materiales">Materiales</option>
                    <option value="equipos_herramientas">Equipos</option>
                  </SelectField>
                  <SelectField label="Recurso" onChange={(value) => changeApu("recurso_id", value)} value={apuForm.recurso_id}>
                    <option value="">
                      {filteredResources.length > 0 ? "Seleccionar recurso" : "No hay recursos en este grupo"}
                    </option>
                    {filteredResources.map((resource) => (
                      <option key={resource.id} value={resource.id}>{resource.nombre}</option>
                    ))}
                  </SelectField>
                  {apuForm.tipo_calculo_apu === "mano_obra_rendimiento" ||
                  apuForm.tipo_calculo_apu === "equipo_hm_rendimiento" ? (
                    <TextField label="Cuadrilla" onChange={(value) => changeApu("cuadrilla", value)} type="number" value={apuForm.cuadrilla} />
                  ) : apuForm.tipo_calculo_apu === "herramientas_porcentaje_mano_obra" ? (
                    <TextField label="% mano de obra" onChange={(value) => changeApu("porcentaje_aplicado", value)} type="number" value={apuForm.porcentaje_aplicado} />
                  ) : (
                    <TextField label="Cantidad" onChange={(value) => changeApu("cantidad_base", value)} type="number" value={apuForm.cantidad_base} />
                  )}
                  <Button className="h-11 w-full justify-center" icon={Plus} onClick={addApuResource}>Agregar al APU</Button>
                </div>
                {apuError ? <p className="mt-3 text-sm font-semibold text-red-600">{apuError}</p> : null}
              </section>

              <section className="min-w-0 rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 px-4 py-3">
                  <h3 className="font-bold text-slate-950">APU de la partida</h3>
                  <span className="text-sm font-bold text-brand-600">{formatCurrency(totals.costo_directo)}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead className="bg-slate-50 text-xs font-bold uppercase text-slate-500">
                      <tr>
                        <th className="px-4 py-3 text-left">Recurso</th>
                        <th className="px-4 py-3 text-center">Und.</th>
                        <th className="px-4 py-3 text-right">Base</th>
                        <th className="px-4 py-3 text-right">Cantidad</th>
                        <th className="px-4 py-3 text-right">Costo</th>
                        <th className="px-4 py-3 text-right">Parcial</th>
                        <th className="px-4 py-3 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewResources.length === 0 ? (
                        <tr><td className="px-4 py-8 text-center text-slate-500" colSpan={7}>Puedes guardar la partida sin APU o agregar recursos aqui.</td></tr>
                      ) : previewResources.map((resource) => (
                        <tr className="border-t border-slate-100" key={resource.id}>
                          <td className="px-4 py-3 font-semibold text-slate-800">
                            {(resource as PartidaRecurso & { nombre_snapshot: string }).nombre_snapshot}
                          </td>
                          <td className="px-4 py-3 text-center">{resource.unidad}</td>
                          <td className="px-4 py-3 text-right">{formatBase(resource)}</td>
                          <td className="px-4 py-3 text-right">{formatNumber(resource.cantidad, 3)}</td>
                          <td className="px-4 py-3 text-right">{formatCurrency(resource.costo_unitario_snapshot + resource.costo_transporte_snapshot)}</td>
                          <td className="px-4 py-3 text-right font-bold">{formatCurrency(resource.parcial)}</td>
                          <td className="px-4 py-3 text-right">
                            <button className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => setApuResources((current) => current.filter((item) => item.tempId !== resource.id))} type="button">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="grid gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm md:grid-cols-4">
                  <Summary label={grupoApuLabels.mano_obra} value={totals.costo_mano_obra} />
                  <Summary label={grupoApuLabels.materiales} value={totals.costo_materiales} />
                  <Summary label="Equipos" value={totals.costo_equipos_herramientas} />
                  <Summary label="Costo unitario" value={totals.costo_directo} strong />
                </div>
              </section>
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-4">
          <div>
            {step === "apu" ? (
              <Button disabled={isSubmitting} icon={ArrowLeft} onClick={() => setStep("datos")} variant="secondary">
                Volver
              </Button>
            ) : null}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Button disabled={isSubmitting} icon={X} onClick={handleCancel} variant="secondary">Cancelar</Button>
            <Button disabled={isSubmitting} icon={Save} onClick={() => onSubmit(apuResources, false)} variant="secondary">
              {isSubmitting ? "Guardando..." : "Guardar partida"}
            </Button>
            <Button disabled={isSubmitting || isEditing} icon={CheckCircle2} onClick={() => onSubmit(apuResources, true)}>
              Guardar y crear otra
            </Button>
          </div>
        </footer>
      </section>
    </div>
  );
}

function partidaContext(form: PartidaFormState) {
  return {
    desperdicio_materiales_porcentaje: Number(form.desperdicio_materiales_porcentaje || 5),
    jornada_horas: Number(form.jornada_horas || 8),
    rendimiento: Number(form.rendimiento || 1)
  };
}

function buildPreviewResources(resources: ApuDraftResource[], catalog: Recurso[], form: PartidaFormState): PartidaRecurso[] {
  const context = partidaContext(form);
  const rows: PartidaRecurso[] = [];

  for (let index = 0; index < resources.length; index += 1) {
    const draft = resources[index];
    const catalogResource = catalog.find((resource) => resource.id === draft.recurso_id);

    if (!catalogResource) {
      continue;
    }

    const subtotalManoObra = calculateApuDirectCost(rows.filter((row) => row.grupo === "mano_obra"), context).costo_mano_obra;
    const computed = calculateApuResourceValues({
      cantidad: Number(draft.cantidad_base || draft.cuadrilla || draft.porcentaje_aplicado || 0),
      cantidad_base: draft.cantidad_base ? Number(draft.cantidad_base) : null,
      costo_transporte_snapshot: catalogResource.costo_transporte,
      costo_unitario_snapshot: catalogResource.costo_unitario_actual,
      cuadrilla: draft.cuadrilla ? Number(draft.cuadrilla) : null,
      porcentaje_aplicado: draft.porcentaje_aplicado ? Number(draft.porcentaje_aplicado) : null,
      tipo_calculo_apu: draft.tipo_calculo_apu
    }, context, subtotalManoObra);

    rows.push({
      cantidad: computed.cantidad,
      cantidad_base: draft.cantidad_base ? Number(draft.cantidad_base) : null,
      costo_transporte_snapshot: catalogResource.costo_transporte,
      costo_unitario_snapshot: catalogResource.costo_unitario_actual,
      cuadrilla: draft.cuadrilla ? Number(draft.cuadrilla) : null,
      grupo: draft.grupo,
      id: draft.tempId,
      orden: index + 1,
      parcial: computed.parcial,
      partida_id: "",
      porcentaje_aplicado: draft.porcentaje_aplicado ? Number(draft.porcentaje_aplicado) : null,
      recurso_id: draft.recurso_id,
      tipo_calculo_apu: draft.tipo_calculo_apu,
      unidad: catalogResource.unidad,
      nombre_snapshot: catalogResource.nombre
    } as PartidaRecurso & { nombre_snapshot: string });
  }

  return rows;
}

function formatBase(resource: PartidaRecurso) {
  if (resource.tipo_calculo_apu === "herramientas_porcentaje_mano_obra") {
    return `${formatNumber(resource.porcentaje_aplicado ?? 3)}%`;
  }

  return formatNumber(resource.cuadrilla ?? resource.cantidad_base ?? resource.cantidad, 3);
}

function Summary({ label, strong, value }: { label: string; strong?: boolean; value: number }) {
  return (
    <div className={strong ? "font-bold text-brand-600" : "font-semibold text-slate-700"}>
      <span className="block text-xs uppercase text-slate-500">{label}</span>
      {formatCurrency(value)}
    </div>
  );
}

function StepButton({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      className={`rounded-lg px-3 py-2 text-sm font-bold transition ${active ? "bg-white text-brand-600 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

function TextField({
  error,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
  wrapperClassName
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  value: string;
  wrapperClassName?: string;
}) {
  return (
    <label className={wrapperClassName || "block"}>
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <input
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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

function TextareaField({
  error,
  label,
  onChange,
  value,
  wrapperClassName
}: {
  error?: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
  wrapperClassName?: string;
}) {
  return (
    <label className={wrapperClassName || "block"}>
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <textarea
        className="mt-2 min-h-28 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
    </label>
  );
}

function SelectField({
  children,
  label,
  onChange,
  value
}: {
  children: React.ReactNode;
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
    </label>
  );
}

function CatalogSelectField({
  addDisabled = false,
  addLabel,
  disabled = false,
  emptyLabel = "No hay opciones",
  error,
  isAdding,
  label,
  onAddingChange,
  onCreate,
  onSelect,
  onSelectOpen,
  onUpdateSelected,
  options,
  placeholder,
  value
}: {
  addDisabled?: boolean;
  addLabel: string;
  disabled?: boolean;
  emptyLabel?: string;
  error?: string;
  isAdding: boolean;
  label: string;
  onAddingChange: (isAdding: boolean) => void;
  onCreate: (name: string) => Promise<boolean>;
  onSelect: (id: string) => void;
  onSelectOpen: () => void;
  onUpdateSelected?: (id: string, values: { description?: string; label: string }) => Promise<boolean>;
  options: Array<{ description?: string; id: string; label: string }>;
  placeholder: string;
  value: string;
}) {
  const selectedOption = options.find((option) => option.id === value);
  const [newValue, setNewValue] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editLabel, setEditLabel] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function closeAddPanel() {
    onAddingChange(false);
    setNewValue("");
    setLocalError(null);
  }

  function closeEditPanel() {
    setIsEditing(false);
    setEditDescription("");
    setEditLabel("");
    setLocalError(null);
  }

  function openEditPanel() {
    if (!selectedOption) {
      return;
    }

    onAddingChange(false);
    setIsEditing(true);
    setEditLabel(selectedOption.label);
    setEditDescription(selectedOption.description || selectedOption.label);
    setLocalError(null);
  }

  async function handleCreate() {
    const trimmedValue = newValue.trim();

    if (!trimmedValue) {
      setLocalError("Escribe un valor para agregarlo.");
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    const created = await onCreate(trimmedValue);
    setIsSaving(false);

    if (!created) {
      setLocalError("No se pudo agregar. Revisa si ya existe o si tienes permisos.");
      return;
    }

    setNewValue("");
    onAddingChange(false);
  }

  async function handleUpdate() {
    const trimmedLabel = editLabel.trim();
    const trimmedDescription = editDescription.trim();

    if (!value || !onUpdateSelected || !trimmedLabel || !trimmedDescription) {
      setLocalError("Completa codigo y nombre para guardar la unidad.");
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    const updated = await onUpdateSelected(value, {
      description: trimmedDescription,
      label: trimmedLabel
    });
    setIsSaving(false);

    if (!updated) {
      setLocalError("No se pudo editar. Revisa si ya existe o si tienes permisos.");
      return;
    }

    closeEditPanel();
  }

  return (
    <div className={`relative block ${isAdding || isEditing ? "z-30" : "z-0"}`}>
      <span className="text-xs font-bold uppercase text-slate-500">{label}</span>
      <div className="mt-2 flex rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
        <select
          className="h-11 min-w-0 flex-1 rounded-l-xl bg-transparent px-3 text-sm font-medium text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          disabled={disabled}
          onChange={(event) => onSelect(event.target.value)}
          onFocus={() => {
            onSelectOpen();
            closeEditPanel();
          }}
          onMouseDown={() => {
            onSelectOpen();
            closeEditPanel();
          }}
          value={value}
        >
          <option value="">{options.length > 0 ? placeholder : emptyLabel}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.description ? `${option.label} - ${option.description}` : option.label}
            </option>
          ))}
        </select>
        <button
          className={`flex h-11 w-11 shrink-0 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300 ${onUpdateSelected ? "" : "rounded-r-xl"}`}
          disabled={disabled || addDisabled}
          onClick={() => {
            onAddingChange(!isAdding);
            setIsEditing(false);
            setNewValue("");
            setLocalError(null);
          }}
          title={addLabel}
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
        {onUpdateSelected ? (
          <button
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-xl border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
            disabled={disabled || !selectedOption}
            onClick={isEditing ? closeEditPanel : openEditPanel}
            title="Editar unidad"
            type="button"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      {isAdding ? (
        <div className="relative z-40 mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm sm:grid-cols-[1fr_auto_auto]">
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            disabled={isSaving}
            onChange={(event) => setNewValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleCreate();
              }
            }}
            placeholder={addLabel}
            value={newValue}
          />
          <button
            className="h-10 rounded-lg bg-brand-600 px-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSaving}
            onClick={() => void handleCreate()}
            type="button"
          >
            {isSaving ? "Guardando" : "Agregar"}
          </button>
          <button
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed"
            disabled={isSaving}
            onClick={closeAddPanel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      ) : null}
      {isEditing ? (
        <div className="relative z-40 mt-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2 shadow-sm sm:grid-cols-[0.8fr_1fr_auto_auto]">
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            disabled={isSaving}
            onChange={(event) => setEditLabel(event.target.value)}
            placeholder="Codigo"
            value={editLabel}
          />
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            disabled={isSaving}
            onChange={(event) => setEditDescription(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleUpdate();
              }
            }}
            placeholder="Nombre"
            value={editDescription}
          />
          <button
            className="h-10 rounded-lg bg-brand-600 px-3 text-sm font-bold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            disabled={isSaving}
            onClick={() => void handleUpdate()}
            type="button"
          >
            {isSaving ? "Guardando" : "Guardar"}
          </button>
          <button
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed"
            disabled={isSaving}
            onClick={closeEditPanel}
            type="button"
          >
            Cancelar
          </button>
        </div>
      ) : null}
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
      {localError ? <span className="mt-1 block text-xs font-semibold text-red-600">{localError}</span> : null}
    </div>
  );
}
