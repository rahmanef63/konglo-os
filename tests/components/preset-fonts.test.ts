import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import { PRESET_FONT_VAR } from "@/frontend/shared/preset-fonts";

// Guards the one silent-failure mode of the preset font self-host: PRESET_FONT_VAR
// maps a family → var(--font-x), but if app/layout.tsx doesn't actually load a
// next/font with that `variable`, the var resolves to nothing and the font never
// changes — with NO error. This asserts every mapped var has a matching load.
describe("preset fonts self-host wiring", () => {
  const layout = readFileSync(join(process.cwd(), "app/layout.tsx"), "utf8");
  const declared = new Set(
    [...layout.matchAll(/variable:\s*"(--font-[a-z0-9-]+)"/g)].map((m) => m[1]),
  );

  it("layout.tsx declares every var referenced by the map", () => {
    for (const [family, value] of Object.entries(PRESET_FONT_VAR)) {
      const varName = value.match(/var\((--font-[a-z0-9-]+)\)/)?.[1];
      expect(varName, `${family} → ${value} must be var(--font-…)`).toBeTruthy();
      expect(declared, `${family}: ${varName} not loaded in layout.tsx`).toContain(varName);
    }
  });

  it("maps at least the high-frequency families", () => {
    for (const f of ["Inter", "Poppins", "Montserrat", "JetBrains Mono", "Source Serif 4"]) {
      expect(PRESET_FONT_VAR[f]).toBeTruthy();
    }
  });
});
