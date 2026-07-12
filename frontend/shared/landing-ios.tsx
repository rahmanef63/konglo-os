"use client";

import { Sparkles, Fingerprint, WifiOff } from "lucide-react";
import { Eyebrow } from "./eyebrow";
import { useHonorific } from "./use-honorific";

// The "in your pocket" moment — Konglo OS presented as a native-feeling iOS app:
// the real app icon, an iPhone device frame around the mobile splash, and the
// Add-to-Home-Screen promise. Maximizes the product-icon + mobile-splash assets.

// CSS iPhone frame (dynamic island + rounded bezel). Black/white here are the
// physical device, not brand tokens.
function PhoneFrame({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mx-auto w-[240px] rounded-[2.75rem] border border-white/15 bg-black p-2.5 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] ring-1 ring-gold/15 sm:w-[272px]">
      <div className="absolute left-1/2 top-4 z-10 h-5 w-[5.5rem] -translate-x-1/2 rounded-full bg-black" />
      <div className="overflow-hidden rounded-[2.15rem]">
        <img
          src={src}
          alt={alt}
          width={1080}
          height={1920}
          loading="lazy"
          decoding="async"
          className="aspect-[9/19.5] w-full object-cover"
        />
      </div>
    </div>
  );
}

const POINTS = [
  { Icon: Sparkles, title: "Layar penuh", body: "Tanpa bilah browser — hadir seperti aplikasi asli." },
  { Icon: Fingerprint, title: "Privat", body: "Data tetap di server sendiri, bukan cloud pihak lain." },
  { Icon: WifiOff, title: "Selalu siap", body: "Terpasang di Layar Utama, terbuka seketika." },
];

export function IosShowcase() {
  const honorific = useHonorific();
  return (
    <section className="mx-auto max-w-5xl px-6 py-24">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        {/* Copy + app-icon lockup + iOS points */}
        <div className="animate-reveal order-2 lg:order-1">
          <Eyebrow>Di saku {honorific}</Eyebrow>
          <h2 className="font-display mt-3 text-4xl font-bold leading-[1.06] sm:text-5xl">
            Seluruh estat, <span className="text-gradient-gold">satu aplikasi</span>.
          </h2>
          <p className="mt-4 max-w-md text-muted-foreground">
            Buka di iPhone atau iPad lalu pasang ke Layar Utama. Konglo OS hadir bak
            aplikasi asli — cepat, penuh layar, dan privat, di mana pun {honorific} berada.
          </p>

          <div className="mt-7 inline-flex items-center gap-4 rounded-2xl border border-border bg-card/40 p-3 pr-5">
            <img
              src="/02-product/konglo-app-icon-1024.webp"
              alt="Ikon aplikasi Konglo OS"
              width={1024}
              height={1024}
              loading="lazy"
              className="h-14 w-14 rounded-[1rem] shadow-lg ring-1 ring-gold/25"
            />
            <div>
              <p className="font-display text-sm font-semibold">Konglo OS</p>
              <p className="text-xs text-muted-foreground">Tambah ke Layar Utama · untuk pemilik</p>
            </div>
          </div>

          <ul className="mt-8 grid gap-4 sm:grid-cols-3">
            {POINTS.map(({ Icon, title, body }) => (
              <li key={title}>
                <Icon className="h-4 w-4 text-gold" aria-hidden />
                <p className="mt-2 text-sm font-medium text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Device */}
        <div className="animate-reveal order-1 lg:order-2" style={{ animationDelay: "120ms" }}>
          <PhoneFrame src="/02-product/konglo-splash-mobile-1080x1920.webp" alt="Konglo OS di iPhone" />
        </div>
      </div>
    </section>
  );
}
