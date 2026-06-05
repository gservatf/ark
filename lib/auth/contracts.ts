export type AuthErrorCode =
  | "invalid_credentials"
  | "session_expired"
  | "email_not_confirmed"
  | "password_policy"
  | "rate_limited"
  | "provider_error"
  | "unknown";

export type AuthError = {
  code: AuthErrorCode;
  message: string;
};

export type AuthResult<T> =
  | { data: T; ok: true }
  | { error: AuthError; ok: false };

export type AuthUser = {
  email: string | null;
  id: string;
};

export type OAuthProvider = "google";

export type OAuthSignInInput = {
  provider: OAuthProvider;
  redirectTo?: string;
};

export type SignInInput = {
  captchaToken?: string | null;
  email: string;
  password: string;
};

export type SignUpInput = SignInInput;

export type PasswordResetInput = {
  captchaToken?: string | null;
  email: string;
  redirectTo?: string;
};

export type UpdatePasswordInput = {
  password: string;
};
