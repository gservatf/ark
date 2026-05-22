const localAppUrl = "http://127.0.0.1:3000";

export function sanitizeNextPath(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }

  try {
    const parsed = new URL(value, localAppUrl);

    if (parsed.origin !== localAppUrl) {
      return "/";
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/";
  }
}

export function validatePassword(value: string) {
  const hasMinimumLength = value.length >= 12;
  const hasLowercase = /[a-z]/.test(value);
  const hasUppercase = /[A-Z]/.test(value);
  const hasDigit = /\d/.test(value);

  return hasMinimumLength && hasLowercase && hasUppercase && hasDigit;
}

export const passwordRequirementsMessage =
  "La contrasena debe tener al menos 12 caracteres e incluir minuscula, mayuscula y numero.";
