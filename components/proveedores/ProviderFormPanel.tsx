import { useId } from "react";
import { CheckCircle2, Plus, X } from "lucide-react";
import { Button } from "@/components/shared/Button";

export type ProviderFormState = {
  contacto: string;
  disponible_para_cliente: boolean;
  direccion: string;
  email: string;
  nombre: string;
  notas: string;
  ruc: string;
  telefono: string;
};

type ProviderFormPanelProps = {
  errors: Partial<Record<keyof ProviderFormState, string>>;
  form: ProviderFormState;
  isEditing: boolean;
  isSubmitting?: boolean;
  onCancel: () => void;
  onChange: <Field extends keyof ProviderFormState>(
    field: Field,
    value: ProviderFormState[Field]
  ) => void;
  onSubmit: () => void;
};

export function ProviderFormPanel({
  errors,
  form,
  isEditing,
  isSubmitting = false,
  onCancel,
  onChange,
  onSubmit
}: ProviderFormPanelProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white shadow-soft">
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-slate-950">
            {isEditing ? "Editar proveedor" : "Nuevo proveedor"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Datos comerciales para alimentar recursos y futuras cotizaciones.
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
          error={errors.nombre}
          disabled={isSubmitting}
          label="Nombre"
          onChange={(value) => onChange("nombre", value)}
          placeholder="Ej. Proveedor Constructora SAC"
          value={form.nombre}
        />
        <TextField
          error={errors.ruc}
          disabled={isSubmitting}
          label="RUC"
          maxLength={11}
          onChange={(value) => onChange("ruc", value.replace(/\D/g, "").slice(0, 11))}
          placeholder="11 digitos"
          value={form.ruc}
        />
        <TextField
          disabled={isSubmitting}
          label="Contacto"
          onChange={(value) => onChange("contacto", value)}
          placeholder="Nombre de contacto"
          value={form.contacto}
        />
        <TextField
          disabled={isSubmitting}
          label="Telefono"
          onChange={(value) => onChange("telefono", value)}
          placeholder="Ej. 987 654 321"
          value={form.telefono}
        />
        <TextField
          error={errors.email}
          disabled={isSubmitting}
          label="Email"
          onChange={(value) => onChange("email", value)}
          placeholder="ventas@proveedor.pe"
          type="email"
          value={form.email}
        />
        <TextField
          disabled={isSubmitting}
          label="Direccion"
          onChange={(value) => onChange("direccion", value)}
          placeholder="Ciudad, distrito o direccion"
          value={form.direccion}
        />
        <TextareaField
          disabled={isSubmitting}
          label="Notas"
          onChange={(value) => onChange("notas", value)}
          placeholder="Condiciones comerciales, cobertura o detalles utiles"
          value={form.notas}
          wrapperClassName="md:col-span-2 block"
        />
        <CheckboxField
          checked={form.disponible_para_cliente}
          description="Sus cotizaciones pueden usarse como referencia en exportaciones para cliente."
          disabled={isSubmitting}
          label="Disponible para cliente"
          onChange={(checked) => onChange("disponible_para_cliente", checked)}
        />
      </div>

      <footer className="flex flex-wrap justify-end gap-3 border-t border-slate-200 px-5 py-4">
        <Button disabled={isSubmitting} icon={X} onClick={onCancel} variant="secondary">
          Cancelar
        </Button>
        <Button disabled={isSubmitting} icon={isEditing ? CheckCircle2 : Plus} onClick={onSubmit}>
          {isSubmitting ? "Guardando..." : isEditing ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </footer>
    </section>
  );
}

function TextField({
  disabled,
  error,
  label,
  maxLength,
  onChange,
  placeholder,
  type = "text",
  value
}: {
  disabled?: boolean;
  error?: string;
  label: string;
  maxLength?: number;
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
        className="mt-2 h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        disabled={disabled}
        id={inputId}
        maxLength={maxLength}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
      {error ? <span className="mt-1 block text-xs font-semibold text-red-600">{error}</span> : null}
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
        className="mt-2 min-h-[92px] w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
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
