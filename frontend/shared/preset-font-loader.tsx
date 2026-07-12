"use client";

import { useEffect } from "react";
import { useThemePreset, findTweakcnPreset } from "@/features/theme-presets";
import { PRESET_FONT_VAR } from "./preset-fonts";

// tweakcn presets set --font-sans/serif/mono to Google families, but the slice
// never loads the webfont AND the enforcing CSP blocks any CDN (see layout.tsx),
// so a preset's font silently fell back to the system stack ("only colors change"
// trap). This maps the active preset's family → a self-hosted next/font var
// (PRESET_FONT_VAR, loaded in app/layout.tsx) and writes it as an INLINE style on
// <html>. Inline beats the tweakcn `<style id="tweakcn-vars">` :root rule by
// specificity, so injection order doesn't matter. Unmapped families (or the
// default "claude" system stack) removeProperty → the injected/globals value wins.
// Headings keep Fraunces (--font-display, brand); this only drives body/UI text.

const TARGET = {
  "font-sans": { cssVar: "--font-sans", fallback: "sans-serif" },
  "font-serif": { cssVar: "--font-serif", fallback: "serif" },
  "font-mono": { cssVar: "--font-mono", fallback: "monospace" },
} as const;

function firstFamily(stack?: string): string | null {
  if (!stack) return null;
  const first = stack.split(",")[0].trim().replace(/^["']|["']$/g, "");
  return first || null;
}

export function PresetFontLoader() {
  const { presetName, registry } = useThemePreset();

  useEffect(() => {
    const root = document.documentElement.style;
    const preset = presetName && registry ? findTweakcnPreset(registry, presetName) : null;
    const vars: Record<string, string> = preset
      ? { ...(preset.cssVars?.theme ?? {}), ...(preset.cssVars?.light ?? {}) }
      : {};
    for (const key of Object.keys(TARGET) as (keyof typeof TARGET)[]) {
      const fam = firstFamily(vars[key]);
      const mapped = fam ? PRESET_FONT_VAR[fam] : undefined;
      if (mapped) root.setProperty(TARGET[key].cssVar, `${mapped}, ${TARGET[key].fallback}`);
      else root.removeProperty(TARGET[key].cssVar);
    }
  }, [presetName, registry]);

  return null;
}
