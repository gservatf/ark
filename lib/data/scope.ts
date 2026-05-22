import { dataFailure, dataSuccess, validationError } from "./errors";
import type { DataResult, DataScope } from "./types";

export function validateDataScope(
  scope: DataScope,
  options: { requireActor?: boolean } = {}
): DataResult<DataScope> {
  if (!scope.organizacionId?.trim()) {
    return dataFailure(validationError("La organización es obligatoria para consultar datos."));
  }

  if (options.requireActor && !scope.actorId?.trim()) {
    return dataFailure(validationError("El actor es obligatorio para registrar auditoria."));
  }

  return dataSuccess({
    actorId: scope.actorId?.trim(),
    organizacionId: scope.organizacionId.trim(),
    proyectoId: scope.proyectoId?.trim() || undefined
  });
}
