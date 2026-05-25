import { Trash2 } from "lucide-react";

import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Proveedor } from "@/types/domain";

type ConfirmDeleteProviderDialogProps = {
  onCancel: () => void;
  onConfirm: () => void;
  provider?: Proveedor;
  resourceCount: number;
};

export function ConfirmDeleteProviderDialog({
  onCancel,
  onConfirm,
  provider,
  resourceCount
}: ConfirmDeleteProviderDialogProps) {
  return (
    <ConfirmDialog
      confirmIcon={Trash2}
      confirmLabel="Eliminar"
      onCancel={onCancel}
      onConfirm={onConfirm}
      open={Boolean(provider)}
      title="Eliminar proveedor"
      tone="danger"
    >
      {provider ? (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            El proveedor <strong className="text-slate-900">{provider.nombre}</strong> se quitara del
            directorio si no tiene historicos o cotizaciones protegidas.
          </p>
          {resourceCount > 0 ? (
            <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-sm font-medium leading-6 text-red-800">
              Tiene {resourceCount} recursos vinculados. Si la base necesita conservar historicos,
              usa Desactivar en lugar de Eliminar.
            </p>
          ) : null}
        </>
      ) : null}
    </ConfirmDialog>
  );
}
