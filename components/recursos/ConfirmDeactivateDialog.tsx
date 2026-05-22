import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Recurso } from "@/types/domain";

type ConfirmDeactivateDialogProps = {
  resource?: Recurso;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDeactivateDialog({
  onCancel,
  onConfirm,
  resource
}: ConfirmDeactivateDialogProps) {
  return (
    <ConfirmDialog
      confirmLabel="Desactivar"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(resource)}
      title="Desactivar recurso"
      tone="warning"
    >
      {resource ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          El recurso <strong className="text-slate-900">{resource.nombre}</strong> quedara inactivo
          en el catálogo. Podrá seguir viéndose con el filtro de estado.
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
