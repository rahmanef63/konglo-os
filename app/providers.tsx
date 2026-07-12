"use client";

import { useState } from "react";
import { ConvexAuthNextjsProvider } from "@convex-dev/auth/nextjs";
import { ConvexReactClient } from "convex/react";
import { ThemeProvider } from "next-themes";
import { ThemePresetProvider, ThemeColorSync } from "@/features/theme-presets";
import { PresetFontLoader } from "@/frontend/shared";

// Default color preset for first-time visitors (no saved choice). Must match a
// `name` in the vendored tweakcn registry-data.json. "claude" = warm terracotta,
// the look shipped today (owner decision, 2026-07-09). Applied non-persisted via
// ThemePresetProvider's hostDefault; users can still switch or hit Default.
const DEFAULT_PRESET = "claude";

// next-themes ThemeProvider (light/dark/system) → theme-presets ThemePresetProvider
// (runtime tweakcn color swap). storageKey keeps the existing "konglo.theme" key.
// defaultTheme="system" + enableSystem = owner's default mode.
function ThemeShell({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey="konglo.theme"
    >
      <ThemePresetProvider hostDefault={DEFAULT_PRESET}>
        {/* Keeps <meta name="theme-color"> in sync with the active preset. */}
        <ThemeColorSync />
        {/* Maps the active preset's font family → a self-hosted next/font var so
            switching preset also changes the body/UI font (CSP-safe, no CDN).
            After ThemeColorSync so its inline --font-* override lands last. */}
        <PresetFontLoader />
        {children}
      </ThemePresetProvider>
    </ThemeProvider>
  );
}

// Client built lazily inside the component so module import never throws during
// build-time config collection. At runtime in the browser a missing
// NEXT_PUBLIC_CONVEX_URL is fatal — without it the whole app silently serves a
// dataless 200 (no client = no queries). Fail loud at startup instead.
export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      // Only assert in the browser: during SSR/SSG the env may not be inlined
      // yet, but a client render with no URL means the deploy shipped misconfigured.
      if (typeof window !== "undefined") {
        throw new Error(
          "NEXT_PUBLIC_CONVEX_URL is not set — the app cannot reach Convex. " +
            "Set it in the Dokploy app env and rebuild (see CLAUDE.md › DEPLOY != PUSH).",
        );
      }
      return null;
    }
    return new ConvexReactClient(url);
  });

  // Theme providers wrap in both branches so light/dark + presets work even in
  // the degraded no-Convex path; in the normal path they sit INSIDE the Convex
  // auth provider (keeps Convex the outer auth boundary).
  if (!client) return <ThemeShell>{children}</ThemeShell>;
  return (
    <ConvexAuthNextjsProvider client={client}>
      <ThemeShell>{children}</ThemeShell>
    </ConvexAuthNextjsProvider>
  );
}
