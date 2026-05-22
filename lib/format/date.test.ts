import { describe, expect, it } from "vitest";
import { formatDisplayDate } from "./date";

describe("formatDisplayDate", () => {
  it("formats a date-only value", () => {
    expect(formatDisplayDate("2026-05-19")).toContain("2026");
  });

  it("formats a timestamp value from Supabase", () => {
    expect(formatDisplayDate("2026-05-19T15:32:10.123456+00:00")).toContain("2026");
  });

  it("returns a fallback for empty or invalid dates", () => {
    expect(formatDisplayDate(null)).toBe("Sin fecha");
    expect(formatDisplayDate("")).toBe("Sin fecha");
    expect(formatDisplayDate("2026-05-19T15:32:10.123456+00:00T00:00:00")).toBe("Sin fecha");
  });
});
