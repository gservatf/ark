import { PowerOff } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Partida } from "@/types/domain";

type ConfirmDeactivatePartidaDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  partida?: Partida;
};

export function ConfirmDeactivatePartidaDialog({
  onCancel,
  onConfirm,
  partida
}: ConfirmDeactivatePartidaDialogProps) {
  return (
    <ConfirmDialog
      confirmIcon={PowerOff}
      confirmLabel="Desactivar"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(partida)}
      title="Desactivar partida"
      tone="warning"
    >
      <p className="mt-2 text-sm leading-6 text-slate-600">
        {partida
          ? `La partida ${partida.codigo} dejará de estar disponible para nuevos presupuestos.`
          : ""}
      </p>
    </ConfirmDialog>
  );
}
