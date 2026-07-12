import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescript from "eslint-config-next/typescript";

// Flat config (Next 16: bare `eslint`, no `next lint`). Build output,
// generated Convex client, and the gitignored prototype are excluded.
const config = [
  ...coreWebVitals,
  ...typescript,
  {
    ignores: [".next/", "node_modules/", "convex/_generated/", "_proto/"],
  },
  {
    rules: {
      // SSR-safe `mounted` flags + localStorage hydration are deliberate,
      // standard patterns here (Modal/toast/palette portals, theme, bell).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    // Vendored, verbatim rr notion-database slice. Kept byte-for-byte with
    // upstream so it can be re-synced; exempt from the 200-LOC cap and from
    // stylistic react-hooks rules that flag its (functionally correct) drag-
    // fill ref pattern + stable lucide icon-component lookups. The public
    // CellArgs contract intentionally carries params the trimmed cell set
    // does not consume (no-unused-vars). Type-safety + build are unaffected.
    files: ["frontend/slices/data-studio/notion-database/**/*.{ts,tsx}"],
    rules: {
      "react-hooks/static-components": "off",
      "react-hooks/refs": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
];

export default config;
