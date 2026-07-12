"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Eyebrow } from "./eyebrow";
import { useHonorific } from "./use-honorific";

// Brand-asset visuals for the (force-dark) marketing landing. The gold-on-obsidian
// WebP package is the hero here — framed as cinematic showcases, never full-bleed.
// Plain <img> (same-origin, CSP-safe, already WebP), lazy + explicit dims (no CLS).

// Hero plate — the cinematic wallpaper (art-deco arches + embossed shield, no
// wordmark repeat). The nav + h1 already carry the name; this sets the mood.
export function HeroShowcase() {
  return (
    <figure
      className="animate-reveal group relative mt-16 overflow-hidden rounded-[1.75rem] border border-gold/20 shadow-[0_50px_120px_-40px_rgba(0,0,0,0.85)] ring-1 ring-white/5"
      style={{ animationDelay: "360ms" }}
    >
      <img
        src="/02-product/konglo-wallpaper-desktop-1920x1080.webp"
        alt="Konglo OS — estat privat, sejernih satu neraca"
        width={1920}
        height={1080}
        loading="lazy"
        decoding="async"
        className="w-full motion-safe:transition-transform motion-safe:duration-[1.2s] motion-safe:ease-out motion-safe:group-hover:scale-[1.02]"
      />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-white/8 to-transparent" />
    </figure>
  );
}

// Brand-craft strip — one identity across every surface (the transparent gold
// lockups). A quiet trust signal for a house that cares how it presents.
const LOCKUPS = [
  { src: "/01-logo/konglo-logo-primary-horizontal-transparent.webp", label: "Lambang utama", w: 1276, h: 366 },
  { src: "/01-logo/konglo-wordmark-gold-transparent.webp", label: "Wordmark", w: 1117, h: 289 },
  { src: "/01-logo/konglo-logo-secondary-stacked-transparent.webp", label: "Tersusun", w: 703, h: 591 },
];
export function BrandLockups() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <p className="text-center text-xs uppercase tracking-[0.24em] text-muted-foreground">
        Satu identitas, setiap permukaan
      </p>
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {LOCKUPS.map((l) => (
          <div
            key={l.label}
            className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-gold/10 bg-white/[0.02] px-6 py-10"
          >
            <img
              src={l.src}
              alt={l.label}
              width={l.w}
              height={l.h}
              loading="lazy"
              decoding="async"
              className="h-14 w-auto max-w-[80%] object-contain"
            />
            <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

// Closing CTA — the brand-guidelines board beside a final call to action.
export function ClosingCTA({
  onDemo,
  onOpen,
  demoBusy,
}: {
  onDemo: () => void;
  onOpen: () => void;
  demoBusy: boolean;
}) {
  const honorific = useHonorific();
  return (
    <section className="mx-auto max-w-5xl px-6 py-20">
      <div className="grid items-center gap-8 rounded-[1.75rem] border border-gold/20 bg-white/[0.02] p-8 sm:p-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <Eyebrow>Berkenan mulai?</Eyebrow>
          <h2 className="font-display mt-3 text-3xl font-bold sm:text-4xl">
            Pandang grup {honorific} <span className="text-gradient-gold">sejernih satu neraca</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            Silakan coba demo langsung dengan data contoh — tanpa perlu mendaftar — atau masuk dengan akun {honorific}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button size="lg" onClick={onDemo} disabled={demoBusy}>
              {demoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Lihat demo langsung <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="lg" onClick={onOpen}>
              Masuk
            </Button>
          </div>
        </div>
        <img
          src="/00-original-generations/konglo-10-brand-board.webp"
          alt="Papan identitas merek Konglo OS — logo, palet warna, dan tipografi"
          width={1122}
          height={1402}
          loading="lazy"
          decoding="async"
          className="mx-auto w-full max-w-[16rem] rounded-xl border border-border shadow-xl lg:max-w-xs"
        />
      </div>
    </section>
  );
}
