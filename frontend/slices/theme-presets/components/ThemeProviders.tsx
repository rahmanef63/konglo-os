"use client";

import { ThemeProvider } from "next-themes";
import { ThemePresetProvider } from "./ThemePresetProvider";
import type { ReactNode } from "react";

/**
 * App-wide theme providers. next-themes drives light/dark/system mode;
 * ThemePresetProvider (from the theme-presets slice) layers runtime
 * tweakcn color-preset swapping on top. Mounted high in the root layout
 * so every route (public + dashboard) shares the same theme state.
 *
 * `defaultMode` + `defaultPreset` = the template's build-time look
 * (poster-matching). The owner overrides both at runtime via settings
 * (push with useThemePreset().setSiteDefault + next-themes setTheme);
 * each visitor can still override locally via the switcher.
 */
export function ThemeProviders({
  children,
  defaultMode = "system",
  defaultPreset = null,
}: {
  children: ReactNode;
  defaultMode?: "light" | "dark" | "system";
  defaultPreset?: string | null;
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={defaultMode}
      enableSystem
      disableTransitionOnChange
    >
      <ThemePresetProvider hostDefault={defaultPreset}>{children}</ThemePresetProvider>
    </ThemeProvider>
  );
}
