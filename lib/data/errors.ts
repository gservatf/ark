import { ZodError } from "zod";

import type { DataError, DataResult } from "./types";

interface SupabaseErrorLike {
  code?: string;
  details?: unknown;
  message?: string;
}

export function dataSuccess<T>(data: T): DataResult<T> {
  return { data, ok: true };
}

export function dataFailure(error: DataError): DataResult<never> {
  return { error, ok: false };
}

export function validationError(message: string, details?: unknown): DataError {
  return {
    code: "validation",
    details,
    message
  };
}

export function notFoundError(message = "No se encontró el registro solicitado."): DataError {
  return {
    code: "not_found",
    message
  };
}

export function normalizeValidationError(error: ZodError): DataError {
  return validationError("Los datos enviados no son válidos.", error.flatten());
}

export function normalizeSupabaseError(error: unknown, source?: string): DataError {
  const supabaseError = error as SupabaseErrorLike | null | undefined;
  const code = supabaseError?.code;
  const message = supabaseError?.message || "Supabase devolvió un error inesperado.";
  const rpcError = parseControlledRpcError(message);
  const details = sanitizeSupabaseErrorDetails(supabaseError || error);

  if (rpcError) {
    return {
      code: rpcError.code,
      details,
      message: rpcError.message,
      source
    };
  }

  if (code === "PGRST116") {
    return {
      code: "not_found",
      details,
      message: "No se encontró el registro solicitado.",
      source
    };
  }

  if (code === "42501" || code === "PGRST301") {
    return {
      code: "permission",
      details,
      message: "No tienes permisos para realizar esta acción.",
      source
    };
  }

  if (code === "23505" || code === "409") {
    return {
      code: "conflict",
      details,
      message: "El cambio entra en conflicto con un registro existente.",
      source
    };
  }

  return {
    code: code ? "supabase" : "unknown",
    details,
    message: isProductionRuntime() ? "No se pudo completar la operación solicitada." : message,
    source
  };
}

function sanitizeSupabaseErrorDetails(error: unknown) {
  if (!isProductionRuntime()) {
    return error;
  }

  const supabaseError = error as SupabaseErrorLike | null | undefined;
  return supabaseError?.code ? { code: supabaseError.code } : undefined;
}

function isProductionRuntime() {
  return process.env.NODE_ENV === "production";
}

function parseControlledRpcError(message: string): Pick<DataError, "code" | "message"> | null {
  const [prefix, ...rest] = message.split(":");
  const normalizedMessage = rest.join(":").trim() || message;

  if (prefix === "CYP_VALIDATION") {
    return { code: "validation", message: normalizedMessage };
  }

  if (prefix === "CYP_CONFLICT") {
    return { code: "conflict", message: normalizedMessage };
  }

  if (prefix === "CYP_PERMISSION") {
    return { code: "permission", message: normalizedMessage };
  }

  if (prefix === "CYP_NOT_FOUND") {
    return { code: "not_found", message: normalizedMessage };
  }

  return null;
}
