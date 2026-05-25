import { Power, PowerOff } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Proveedor } from "@/types/domain";

type ConfirmProviderStatusDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  provider?: Proveedor;
};

export function ConfirmProviderStatusDialog({
  onCancel,
  onConfirm,
  provider
}: ConfirmProviderStatusDialogProps) {
  const nextActive = provider?.estado === "inactivo";

  return (
    <ConfirmDialog
      confirmIcon={nextActive ? Power : PowerOff}
      confirmLabel={nextActive ? "Activar" : "Desactivar"}
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(provider)}
      title={nextActive ? "Activar proveedor" : "Desactivar proveedor"}
      tone="warning"
    >
      {provider ? (
        <p className="mt-2 text-sm leading-6 text-slate-600">
          El proveedor <strong className="text-slate-900">{provider.nombre}</strong>{" "}
          {nextActive
            ? "volvera a estar disponible para seleccionarlo en recursos y cotizaciones."
            : "quedara inactivo, pero seguira apareciendo en historicos y recursos ya vinculados."}
        </p>
      ) : null}
    </ConfirmDialog>
  );
}
