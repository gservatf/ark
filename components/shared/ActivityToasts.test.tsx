import { describe, expect, it, vi } from "vitest";

import { ActivityToasts } from "./ActivityToasts";

describe("ActivityToasts", () => {
  it("expone una region live para avisos dinamicos", () => {
    const element = ActivityToasts({
      onDismiss: vi.fn(),
      status: "connected",
      toasts: [
        {
          description: "Cambio guardado por otro usuario.",
          id: "toast-1",
          title: "Actividad actualizada"
        }
      ]
    });

    expect(element).not.toBeNull();
    expect(element && "props" in element ? element.props.role : undefined).toBe("status");
    expect(element && "props" in element ? element.props["aria-live"] : undefined).toBe("polite");
    expect(element && "props" in element ? element.props["aria-atomic"] : undefined).toBe("false");
  });
});
