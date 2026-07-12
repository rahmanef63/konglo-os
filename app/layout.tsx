import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import {
  Fraunces,
  Inter,
  Montserrat,
  DM_Sans,
  Outfit,
  Plus_Jakarta_Sans,
  Open_Sans,
  Geist,
  Source_Serif_4,
  Lora,
  Playfair_Display,
  JetBrains_Mono,
  Fira_Code,
  Geist_Mono,
  Poppins,
} from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import { AnalyticsBeacon } from "@/frontend/shared/analytics-beacon";

// Display serif. globals.css references `--font-display` ("Fraunces") but never
// loaded the webfont, so every headline silently fell back to Georgia. Load it
// here (self-hosted by next/font → zero render-blocking request, no layout
// shift) and expose it as `--font-fraunces`; `@theme --font-display` points at
// this var. `swap` keeps text painted during the (now near-instant) font swap;
// weights cover the only display weights in use (600 semibold + 700 bold) plus
// 400/500 headroom.
const fraunces = Fraunces({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-fraunces",
});

// Self-hosted preset fonts (owner decision 2026-07-09): tweakcn presets set
// --font-sans/serif/mono to Google families, but the webfont was never loaded
// AND the enforcing CSP (font-src 'self', next.config.mjs) blocks any CDN — so
// switching preset changed colors but never the font. These next/font/google
// families are self-hosted AT BUILD (CSP-safe, no external request) and mapped
// by PresetFontLoader (frontend/shared/preset-font-loader.tsx) to the active
// preset. `preload: false` = no <link preload>; each downloads LAZILY only when
// its preset is active, so a visitor fetches just the one font in use. This is
// the ~14 highest-frequency families across the registry (variable fonts → weight
// omitted = full axis, zero build-error risk); unmapped presets fall back to the
// system stack. Curate here + in preset-fonts.ts together.
const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter", preload: false });
const montserrat = Montserrat({ subsets: ["latin"], display: "swap", variable: "--font-montserrat", preload: false });
const dmSans = DM_Sans({ subsets: ["latin"], display: "swap", variable: "--font-dm-sans", preload: false });
const outfit = Outfit({ subsets: ["latin"], display: "swap", variable: "--font-outfit", preload: false });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-jakarta", preload: false });
const openSans = Open_Sans({ subsets: ["latin"], display: "swap", variable: "--font-open-sans", preload: false });
const geist = Geist({ subsets: ["latin"], display: "swap", variable: "--font-geist", preload: false });
const sourceSerif = Source_Serif_4({ subsets: ["latin"], display: "swap", variable: "--font-source-serif", preload: false });
const lora = Lora({ subsets: ["latin"], display: "swap", variable: "--font-lora", preload: false });
const playfair = Playfair_Display({ subsets: ["latin"], display: "swap", variable: "--font-playfair", preload: false });
const jetbrainsMono = JetBrains_Mono({ subsets: ["latin"], display: "swap", variable: "--font-jetbrains-mono", preload: false });
const firaCode = Fira_Code({ subsets: ["latin"], display: "swap", variable: "--font-fira-code", preload: false });
const geistMono = Geist_Mono({ subsets: ["latin"], display: "swap", variable: "--font-geist-mono", preload: false });
// Poppins is NOT a variable font on Google Fonts → weights must be explicit.
const poppins = Poppins({ subsets: ["latin"], display: "swap", weight: ["400", "500", "600", "700"], variable: "--font-poppins", preload: false });

// All font CSS-var classes for <html>. Order irrelevant — each just defines its
// own --font-* custom property; PresetFontLoader picks which one --font-sans uses.
const fontVars = [
  fraunces, inter, montserrat, dmSans, outfit, jakarta, openSans, geist,
  sourceSerif, lora, playfair, jetbrainsMono, firaCode, geistMono, poppins,
]
  .map((f) => f.variable)
  .join(" ");

const DESCRIPTION =
  "Satu sumber kebenaran untuk seluruh grup usaha keluarga — anak usaha, kas, investasi, properti, hingga warisan. Swakelola dan privat, di infrastruktur Anda sendiri.";

// Icons/OG/apple wired to the WebP brand package in /public. Favicons are WebP
// (every current browser accepts them); the OG image is the 1200×630 marketing
// render. Fixed brand colors here are browser chrome / social cards only — the
// in-app UI still follows the active theme preset.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://konglo.rahmanef.com"),
  // Lead with the value category (P3 positioning); "Konglo" is the machine name.
  title: "Konglo OS — Family Office Operating System",
  description: DESCRIPTION,
  applicationName: "Konglo OS",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/02-product/konglo-favicon-32.webp", sizes: "32x32", type: "image/webp" },
      { url: "/02-product/konglo-favicon-16.webp", sizes: "16x16", type: "image/webp" },
      { url: "/02-product/konglo-favicon-512.webp", sizes: "512x512", type: "image/webp" },
    ],
    // apple-touch-icon MUST be PNG: iOS/iPadOS never decodes WebP for it (unlike
    // <img> or tab favicons), and there's no PNG in the WebP-only brand package —
    // so this one is derived (opaque 180×180) from konglo-app-icon-512.webp.
    apple: [{ url: "/02-product/konglo-apple-touch-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: { capable: true, title: "Konglo OS", statusBarStyle: "black-translucent" },
  openGraph: {
    type: "website",
    siteName: "Konglo OS",
    title: "Konglo OS — Family Office Operating System",
    description: DESCRIPTION,
    images: [
      { url: "/03-marketing/konglo-open-graph-1200x630.webp", width: 1200, height: 630, alt: "Konglo OS" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Konglo OS — Family Office Operating System",
    description: DESCRIPTION,
    images: ["/03-marketing/konglo-open-graph-1200x630.webp"],
  },
};

// themeColor lives in `viewport` (Next 16). Obsidian in dark, warm paper in light
// — matches the app's own :root / .dark background tokens.
export const viewport: Viewport = {
  // Cover the safe areas so env(safe-area-inset-*) resolves to real values in
  // iOS Safari (0 without it) — the app's dock/toast/landing bar all depend on it.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf7" },
    { media: "(prefers-color-scheme: dark)", color: "#17150f" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ConvexAuthNextjsServerProvider>
      {/* next-themes (inside <Providers>) injects its own pre-paint class script
          (attribute="class", defaultTheme="system") to set light/dark before first
          paint — kills the mode FOUC with no hardcoded class here. The theme-presets
          slice boots the persisted / default ("claude") color preset on mount.
          suppressHydrationWarning is required: next-themes mutates the <html> class
          on the client, which would otherwise mismatch SSR. */}
      <html lang="id" className={fontVars} suppressHydrationWarning>
        <body className="antialiased">
          <Providers>{children}</Providers>
          {/* Cookieless visitor beacon — tracks the public marketing surface
              (/, /pendekatan) only; skips /os, /login, /api internally. Sits
              outside Providers (it just calls navigator.sendBeacon, needs no
              Convex/theme context) and inside Suspense so it never blocks paint. */}
          <Suspense fallback={null}>
            <AnalyticsBeacon />
          </Suspense>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
