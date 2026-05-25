import { Trash2 } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { Proveedor } from "@/types/domain";

type ConfirmDeleteProviderDialogProps = {
  provider?: Proveedor;
  resourceCount: number;
  onCancel: () => void;
  onConfirm: () => void;
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
      tone="warning"
    >
      {provider ? (
        <>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            El proveedor <strong className="text-slate-900">{provider.nombre}</strong> quedara
            inactivo y podra seguir apareciendo en historicos y recursos ya vinculados.
          </p>
          {resourceCount > 0 ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm font-medium leading-6 text-amber-800">
              Tiene {resourceCount} recursos vinculados. Esta acción no modifica esos recursos.
            </p>
          ) : null}
        </>
      ) : null}
    </ConfirmDialog>
  );
}
