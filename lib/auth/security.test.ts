import { describe, expect, it } from "vitest";

import { buildOAuthRedirectTo, getOAuthCallbackRedirectUrl } from "./oauth";
import { sanitizeNextPath, validatePassword } from "./security";
import { buildAppUrl, getPublicAppUrl } from "../supabase/config";

describe("auth security helpers", () => {
  it("sanitiza next para permitir solo rutas internas", () => {
    expect(sanitizeNextPath("/presupuestos?x=1#top")).toBe("/presupuestos?x=1#top");
    expect(sanitizeNextPath(null)).toBe("/");
    expect(sanitizeNextPath("https://evil.test")).toBe("/");
    expect(sanitizeNextPath("//evil.test/path")).toBe("/");
    expect(sanitizeNextPath("presupuestos")).toBe("/");
  });

  it("valida contrasenas fuertes", () => {
    expect(validatePassword("Password1234")).toBe(true);
    expect(validatePassword("password1234")).toBe(false);
    expect(validatePassword("PASSWORD1234")).toBe(false);
    expect(validatePassword("PasswordOnly")).toBe(false);
    expect(validatePassword("Pass123")).toBe(false);
  });

  it("construye URLs publicas con fallback local", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;

    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getPublicAppUrl()).toBe("http://127.0.0.1:3000");
    expect(buildAppUrl("/onboarding")).toBe("http://127.0.0.1:3000/onboarding");

    process.env.NEXT_PUBLIC_APP_URL = "https://app.cyp.test/";
    expect(getPublicAppUrl()).toBe("https://app.cyp.test");
    expect(buildAppUrl("actualizar-clave")).toBe("https://app.cyp.test/actualizar-clave");

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });

  it("construye y sanitiza redirects OAuth", () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;

    process.env.NEXT_PUBLIC_APP_URL = "https://app.cyp.test";
    expect(buildOAuthRedirectTo("/presupuestos?x=1")).toBe(
      "https://app.cyp.test/auth/callback?next=%2Fpresupuestos%3Fx%3D1"
    );
    expect(buildOAuthRedirectTo("https://evil.test")).toBe(
      "https://app.cyp.test/auth/callback?next=%2F"
    );
    expect(
      getOAuthCallbackRedirectUrl("https://app.cyp.test/auth/callback?next=%2Freportes").toString()
    ).toBe("https://app.cyp.test/reportes");
    expect(
      getOAuthCallbackRedirectUrl("https://app.cyp.test/auth/callback?next=https%3A%2F%2Fevil.test").toString()
    ).toBe("https://app.cyp.test/");

    if (previous === undefined) {
      delete process.env.NEXT_PUBLIC_APP_URL;
    } else {
      process.env.NEXT_PUBLIC_APP_URL = previous;
    }
  });
});
