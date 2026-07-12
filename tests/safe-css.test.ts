import { describe, it, expect } from "vitest";
import { safeColor } from "../lib/safe-css";

describe("safeColor — color value guard for inline styles", () => {
  it("passes legitimate colors untouched (hex, var token, color functions)", () => {
    expect(safeColor("#a78bfa")).toBe("#a78bfa");
    expect(safeColor("var(--color-mk-blue)")).toBe("var(--color-mk-blue)");
    expect(safeColor("oklch(0.7 0.1 200)")).toBe("oklch(0.7 0.1 200)");
    expect(safeColor("rgb(10, 20, 30)")).toBe("rgb(10, 20, 30)");
  });

  it("strips a url() beacon attempt -> undefined (caller falls back to default)", () => {
    expect(safeColor("url(https://evil.example/x.gif)")).toBeUndefined();
    expect(safeColor("red; background: url(https://evil/x)")).toBeUndefined();
  });

  it("strips other dangerous CSS tokens", () => {
    expect(safeColor("expression(alert(1))")).toBeUndefined();
    expect(safeColor("</style><script>")).toBeUndefined();
    expect(safeColor("@import 'evil.css'")).toBeUndefined();
  });

  it("returns undefined for empty/undefined input", () => {
    expect(safeColor(undefined)).toBeUndefined();
    expect(safeColor("")).toBeUndefined();
  });
});
