import { cn } from "@/lib/utils";

// Theme-adaptive Konglo brand marks. The transparent WebP logos (RGBA, gold-on-
// nothing) are used as CSS masks: the alpha channel supplies the SHAPE, and
// `background: currentColor` paints it in the ambient text color. So the mark
// recolors to whatever the active theme preset sets (text-gold by default,
// override with any text-* class) instead of a fixed-gold raster that clashes on
// off-brand presets — the "blend across presets" requirement. CSP-safe: the mask
// url() is same-origin ('self'), no external fetch; height comes from the caller
// (e.g. h-5), width derives from aspect-ratio.
//
// ponytail: masking recolors the mark for free — no per-preset color variants to ship.
const SRC = {
  mark: "/01-logo/konglo-logomark-shield-transparent.webp", // 302×360 shield
  wordmark: "/01-logo/konglo-wordmark-gold-transparent.webp", // 1117×289 "Konglo OS"
  lockup: "/01-logo/konglo-logo-primary-horizontal-transparent.webp", // 1276×366 shield+word
} as const;

const RATIO = { mark: "302 / 360", wordmark: "1117 / 289", lockup: "1276 / 366" } as const;

export function BrandMark({
  variant = "mark",
  className,
}: {
  variant?: keyof typeof SRC;
  className?: string;
}) {
  const url = `url(${SRC[variant]})`;
  // aria-hidden: every current placement sits next to a visible "Konglo OS"
  // label, so an accessible name here would just double-announce the brand.
  // ponytail: give it a name (role="img" + aria-label) if a standalone, text-less
  // use ever appears — none does today.
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block text-gold", className)}
      style={{
        aspectRatio: RATIO[variant],
        backgroundColor: "currentColor",
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
        WebkitMaskSize: "contain",
        maskSize: "contain",
      }}
    />
  );
}
