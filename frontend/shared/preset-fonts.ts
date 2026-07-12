// Maps a tweakcn preset's font family (first name in the --font-sans/serif/mono
// stack) → the self-hosted next/font CSS variable loaded in app/layout.tsx.
// Keep this in lockstep with layout.tsx's font imports: a family here MUST have a
// matching next/font/google load there, or its var() resolves to nothing. Families
// NOT listed fall back to the system stack (globals.css default) — acceptable, most
// presets use one of these ~14 highest-frequency families. Keys are the exact
// Google-Fonts display names as they appear in registry-data.json.
export const PRESET_FONT_VAR: Record<string, string> = {
  Inter: "var(--font-inter)",
  Montserrat: "var(--font-montserrat)",
  "DM Sans": "var(--font-dm-sans)",
  Outfit: "var(--font-outfit)",
  "Plus Jakarta Sans": "var(--font-jakarta)",
  "Open Sans": "var(--font-open-sans)",
  Geist: "var(--font-geist)",
  "Source Serif 4": "var(--font-source-serif)",
  Lora: "var(--font-lora)",
  "Playfair Display": "var(--font-playfair)",
  "JetBrains Mono": "var(--font-jetbrains-mono)",
  "Fira Code": "var(--font-fira-code)",
  "Geist Mono": "var(--font-geist-mono)",
  Poppins: "var(--font-poppins)",
};
