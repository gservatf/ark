"use client";

import { RefreshCcw, RotateCcw, ShieldAlert } from "lucide-react";
import { useId, useRef } from "react";

import { getConflictFieldLabels } from "@/lib/data/conflicts";
import type { DataError } from "@/lib/data/types";

import { Button } from "./Button";
import { useModalFocus } from "./useModalFocus";

type ConflictResolutionDialogProps = {
  error: DataError | null;
  onDiscard: () => void;
  onOverwrite: () => void;
  open: boolean;
};

export function ConflictResolutionDialog({
  error,
  onDiscard,
  onOverwrite,
  open
}: ConflictResolutionDialogProps) {
  const descriptionId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const overwriteButtonRef = useRef<HTMLButtonElement>(null);

  useModalFocus({
    dialogRef,
    initialFocusRef: overwriteButtonRef,
    onClose: onDiscard,
    open
  });

  if (!open || !error) {
    return null;
  }

  const fields = getConflictFieldLabels(error);

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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShieldAlert className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-slate-950" id={titleId}>Cambio detectado</h2>
            <p className="mt-2 text-sm text-slate-600" id={descriptionId}>
              Otro usuario guardo cambios mientras estabas editando. Revisa antes de aplicar tu version.
            </p>
            {fields.length > 0 ? (
              <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                Campos cambiados: {fields.slice(0, 6).join(", ")}
              </p>
            ) : null}
          </div>
        </div>

        <footer className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button icon={RotateCcw} onClick={onDiscard} variant="secondary">
            Cargar remoto
          </Button>
          <Button icon={RefreshCcw} onClick={onOverwrite} ref={overwriteButtonRef}>
            Aplicar mi version
          </Button>
        </footer>
      </section>
    </div>
  );
}
