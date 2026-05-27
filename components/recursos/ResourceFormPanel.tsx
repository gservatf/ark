import { useId, useMemo, useState } from "react";
import { CheckCircle2, Pencil, Plus, X } from "lucide-react";
import { Button } from "@/components/shared/Button";
import type { EstadoRegistro, Proveedor, TipoRecurso, UnidadMedida } from "@/types/domain";
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
  unidad_id: string;
};

type ResourceFormPanelProps = {
  errors: Partial<Record<keyof ResourceFormState, string>>;
  form: ResourceFormState;
  isEditing: boolean;
  isSubmitting?: boolean;
  providers: Proveedor[];
  unidades: UnidadMedida[];
  onCancel: () => void;
  onChange: <Field extends keyof ResourceFormState>(
    field: Field,
    value: ResourceFormState[Field]
  ) => void;
  onCreateUnidad: (codigo: string) => Promise<UnidadMedida | null>;
  onPatch: (values: Partial<ResourceFormState>) => void;
  onSubmit: () => void;
  onUpdateUnidad: (unidadId: string, values: { codigo: string; nombre: string }) => Promise<UnidadMedida | null>;
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
  onCreateUnidad,
  onPatch,
  onSubmit,
  onUpdateUnidad,
  providers,
  unidades
}: ResourceFormPanelProps) {
  const [isAddingUnidad, setIsAddingUnidad] = useState(false);
  const [isEditingUnidad, setIsEditingUnidad] = useState(false);
  const activeUnidades = useMemo(
    () => unidades.filter((unidad) => unidad.estado === "activo" || unidad.id === form.unidad_id),
    [form.unidad_id, unidades]
  );

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
        <CatalogUnitField
          disabled={isSubmitting}
          error={errors.unidad || errors.unidad_id}
          isAdding={isAddingUnidad}
          isEditing={isEditingUnidad}
          label="Unidad"
          onAddingChange={(isAdding) => {
            setIsAddingUnidad(isAdding);
            if (isAdding) {
              setIsEditingUnidad(false);
            }
          }}
          onCreate={async (codigo) => {
            const unidad = await onCreateUnidad(codigo);

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
          onEditingChange={(isEditing) => {
            setIsEditingUnidad(isEditing);
            if (isEditing) {
              setIsAddingUnidad(false);
            }
          }}
          onUpdate={async (id, values) => {
            const unidad = await onUpdateUnidad(id, values);

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
          value={form.unidad_id}
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

function CatalogUnitField({
  disabled,
  error,
  isAdding,
  isEditing,
  label,
  onAddingChange,
  onCreate,
  onEditingChange,
  onSelect,
  onUpdate,
  options,
  value
}: {
  disabled?: boolean;
  error?: string;
  isAdding: boolean;
  isEditing: boolean;
  label: string;
  onAddingChange: (isAdding: boolean) => void;
  onCreate: (codigo: string) => Promise<boolean>;
  onEditingChange: (isEditing: boolean) => void;
  onSelect: (id: string) => void;
  onUpdate: (id: string, values: { codigo: string; nombre: string }) => Promise<boolean>;
  options: Array<{ description?: string; id: string; label: string }>;
  value: string;
}) {
  const selectId = useId();
  const selectedOption = options.find((option) => option.id === value);
  const [editCode, setEditCode] = useState("");
  const [editName, setEditName] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  function closeAddPanel() {
    onAddingChange(false);
    setNewValue("");
    setLocalError(null);
  }

  function closeEditPanel() {
    onEditingChange(false);
    setEditCode("");
    setEditName("");
    setLocalError(null);
  }

  function openEditPanel() {
    if (!selectedOption) {
      return;
    }

    onAddingChange(false);
    onEditingChange(true);
    setEditCode(selectedOption.label);
    setEditName(selectedOption.description || selectedOption.label);
    setLocalError(null);
  }

  async function handleCreate() {
    const trimmedValue = newValue.trim();

    if (!trimmedValue) {
      setLocalError("Escribe una unidad para agregarla.");
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
    const trimmedCode = editCode.trim();
    const trimmedName = editName.trim();

    if (!value || !trimmedCode || !trimmedName) {
      setLocalError("Completa codigo y nombre para guardar la unidad.");
      return;
    }

    setIsSaving(true);
    setLocalError(null);
    const updated = await onUpdate(value, {
      codigo: trimmedCode,
      nombre: trimmedName
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
      <label className="text-xs font-bold uppercase text-slate-500" htmlFor={selectId}>
        {label}
      </label>
      <div className="mt-2 flex rounded-xl border border-slate-200 bg-white transition focus-within:border-blue-300 focus-within:ring-4 focus-within:ring-blue-100">
        <select
          className="h-11 min-w-0 flex-1 rounded-l-xl bg-transparent px-3 text-sm font-medium text-slate-700 outline-none disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          disabled={disabled}
          id={selectId}
          onChange={(event) => onSelect(event.target.value)}
          onFocus={() => {
            onAddingChange(false);
            closeEditPanel();
          }}
          onMouseDown={() => {
            onAddingChange(false);
            closeEditPanel();
          }}
          value={value}
        >
          <option value="">{options.length > 0 ? "Seleccionar unidad" : "No hay unidades"}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.description ? `${option.label} - ${option.description}` : option.label}
            </option>
          ))}
        </select>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          disabled={disabled}
          onClick={() => {
            onAddingChange(!isAdding);
            onEditingChange(false);
            setNewValue("");
            setLocalError(null);
          }}
          title="Nueva unidad"
          type="button"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-r-xl border-l border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-brand-600 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-300"
          disabled={disabled || !selectedOption}
          onClick={isEditing ? closeEditPanel : openEditPanel}
          title="Editar unidad"
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </button>
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
            placeholder="Nueva unidad"
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
            onChange={(event) => setEditCode(event.target.value)}
            placeholder="Codigo"
            value={editCode}
          />
          <input
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
            disabled={isSaving}
            onChange={(event) => setEditName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                void handleUpdate();
              }
            }}
            placeholder="Nombre"
            value={editName}
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
