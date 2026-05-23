type AuthLikeError = {
  message?: string;
  status?: number;
};

export function getAuthErrorMessage(error: AuthLikeError | null | undefined, fallback: string) {
  const message = error?.message?.toLowerCase() ?? "";

  if (!message) {
    return fallback;
  }

  if (message.includes("already registered") || message.includes("user already registered")) {
    return "Ese correo ya esta registrado. Inicia sesion o recupera tu contrasena.";
  }

  if (message.includes("password")) {
    return "La contrasena debe tener al menos 12 caracteres, mayuscula, minuscula y numero.";
  }

  if (message.includes("captcha")) {
    return "No se pudo validar la verificacion de seguridad. Recarga la pagina e intenta nuevamente.";
  }

  if (message.includes("rate limit") || message.includes("too many")) {
    return "Hay demasiados intentos recientes. Espera unos minutos e intenta nuevamente.";
  }

  if (message.includes("email")) {
    return "Revisa que el correo sea valido y que no este registrado previamente.";
  }

  return `${fallback} Detalle: ${error?.message ?? "error desconocido"}`;
}
