"use client";

import { Building2, CheckCircle2, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/shared/Button";
import { useModalFocus } from "@/components/shared/useModalFocus";
import type { ProjectInput } from "@/lib/validations/projects";

type ProjectCreateDialogProps = {
  error?: string | null;
  isSubmitting?: boolean;
  onClose: () => void;
  onSubmit: (input: ProjectInput) => Promise<void> | void;
  open: boolean;
};

const initialForm = {
  cliente: "",
  nombre: "",
  ubicacion: ""
};

export function ProjectCreateDialog({
  error,
  isSubmitting = false,
  onClose,
  onSubmit,
  open
}: ProjectCreateDialogProps) {
  const [form, setForm] = useState(initialForm);
  const descriptionId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useModalFocus({
    dialogRef,
    initialFocusRef: firstInputRef,
    onClose,
    open
  });

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
    }
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand-600">
            <Building2 className="h-5 w-5" />
          </span>
          <div className="min-w-0" id={descriptionId}>
            <h2 className="text-lg font-bold text-slate-950" id={titleId}>
              Nuevo proyecto
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              Crea el proyecto y abre su presupuesto para empezar a trabajar.
            </p>
          </div>
        </div>

        <form
          className="mt-5 space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            void onSubmit(form);
          }}
        >
          <label className="block">
            <span className="text-sm font-semibold text-slate-700">Nombre del proyecto</span>
            <input
              className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
              onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
              ref={firstInputRef}
              required
              value={form.nombre}
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Cliente</span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setForm((current) => ({ ...current, cliente: event.target.value }))}
                placeholder="Opcional"
                value={form.cliente || ""}
              />
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-slate-700">Ubicacion</span>
              <input
                className="mt-2 h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-blue-100"
                onChange={(event) => setForm((current) => ({ ...current, ubicacion: event.target.value }))}
                placeholder="Opcional"
                value={form.ubicacion || ""}
              />
            </label>
          </div>

          {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

          <footer className="flex justify-end gap-3 pt-2">
            <Button icon={X} onClick={onClose} type="button" variant="secondary">
              Cancelar
            </Button>
            <Button disabled={isSubmitting} icon={CheckCircle2} type="submit">
              {isSubmitting ? "Creando..." : "Crear proyecto"}
            </Button>
          </footer>
        </form>
      </section>
    </div>
  );
}
