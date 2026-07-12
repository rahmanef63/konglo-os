import type { MetadataRoute } from "next";

// PWA manifest — Next native route, served at /manifest.webmanifest (referenced by
// metadata.manifest in layout.tsx). Icons are the WebP product icons in
// /public/02-product. Install background/theme use the brand obsidian so the OS-
// install splash matches the marketing splash; the in-APP UI still follows theme
// presets. (public/manifest.json is a separate BRAND-asset catalog, not this.)
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Konglo OS — Family Office Operating System",
    short_name: "Konglo OS",
    description:
      "Satu sumber kebenaran untuk seluruh grup usaha keluarga, swakelola dan privat.",
    start_url: "/os",
    display: "standalone",
    background_color: "#17150f",
    theme_color: "#17150f",
    icons: [
      { src: "/02-product/konglo-app-icon-512.webp", sizes: "512x512", type: "image/webp", purpose: "any" },
      { src: "/02-product/konglo-favicon-256.webp", sizes: "256x256", type: "image/webp" },
      { src: "/02-product/konglo-favicon-128.webp", sizes: "128x128", type: "image/webp" },
    ],
  };
}
