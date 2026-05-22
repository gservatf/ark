"use client";

import { AlertTriangle, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useId, useRef } from "react";
import { Button } from "@/components/shared/Button";
import { cn } from "@/lib/utils";
import { useModalFocus } from "./useModalFocus";

type ConfirmTone = "danger" | "warning";

type ConfirmDialogProps = {
  children: ReactNode;
  confirmIcon?: LucideIcon;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  tone?: ConfirmTone;
};

const toneClasses: Record<ConfirmTone, string> = {
  danger: "bg-red-600 shadow-red-100 hover:bg-red-700",
  warning: "bg-amber-600 shadow-amber-100 hover:bg-amber-700"
};

export function ConfirmDialog({
  children,
  confirmIcon: ConfirmIcon,
  confirmLabel,
  onCancel,
  onConfirm,
  open,
  title,
  tone = "warning"
}: ConfirmDialogProps) {
  const descriptionId = useId();
  const titleId = useId();
  const dialogRef = useRef<HTMLElement>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useModalFocus({
    dialogRef,
    initialFocusRef: confirmButtonRef,
    onClose: onCancel,
    open
  });

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6">
      <section
        aria-describedby={descriptionId}
        aria-labelledby={titleId}
        aria-modal="true"
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <div id={descriptionId}>
            <h2 className="text-lg font-bold text-slate-950" id={titleId}>{title}</h2>
            <div>{children}</div>
          </div>
        </div>

        <footer className="mt-6 flex justify-end gap-3">
          <Button icon={X} onClick={onCancel} variant="secondary">
            Cancelar
          </Button>
          <Button className={cn(toneClasses[tone])} icon={ConfirmIcon} onClick={onConfirm} ref={confirmButtonRef}>
            {confirmLabel}
          </Button>
        </footer>
      </section>
    </div>
  );
}
