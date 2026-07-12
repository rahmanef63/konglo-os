"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import { ArrowRight, ArrowUpRight, Loader2 } from "lucide-react";
import { MENU } from "@/frontend/slices/menu";
import { Button } from "@/components/ui/button";
import { Eyebrow, useHonorific } from "@/frontend/shared";
import { MenuIcon } from "./menu-icon";
import { BrandMark } from "./brand-mark";
import { HeroShowcase, BrandLockups, ClosingCTA } from "./landing-visuals";
import { IosShowcase } from "./landing-ios";
import { AuthDialog } from "./auth-dialog";

// Public marketing surface — a committed dark-luxury editorial experience (force
// `dark` so the gold-on-obsidian brand assets carry the whole page, independent of
// the viewer's theme). Outcome-first, deferential aide voice; addresses the owner
// by honorific. Module-level arrays use the literal "Tuan/Nyonya" (no hooks in
// module scope); the JSX interpolates the live {honorific}.
const PROBLEMS = [
  "Laporan konsolidasi grup baru rampung tanggal 15 — dan itu pun sekadar potret bulan lalu?",
  "Belum benar-benar yakin entitas mana yang diam-diam menguras kas Tuan/Nyonya?",
  "Keputusan penting tertahan, menanti satu orang untuk memutuskan — dan orang itu Tuan/Nyonya sendiri?",
  "Kekayaan grup terserak di belasan berkas dan aplikasi yang tak saling bicara?",
];
const OUTCOMES = [
  "Bisnis mana yang benar-benar untung — dan mana yang diam-diam merugi.",
  "Siapa penyumbat terbesar: keputusan mana yang macet, menunggu siapa, sejak kapan.",
  "Proyek mana yang tertinggal jadwal, jauh sebelum menjadi krisis.",
  "Di mana kas bocor — hingga ke rekening dan entitasnya.",
  "Satu keputusan yang menuntut perhatian Tuan/Nyonya, hari ini.",
];
const PROOF = [
  { value: "11 domain", label: "terintegrasi dalam satu sumber kebenaran" },
  { value: "100% swakelola", label: "data tersimpan di server Tuan/Nyonya sendiri" },
  { value: "Per peran", label: "akses yang Tuan/Nyonya tentukan, bukan bawaan sistem" },
];

export function Landing({
  defaultAuthOpen = false,
  demoPassword,
}: {
  defaultAuthOpen?: boolean;
  demoPassword?: string;
}) {
  const [authOpen, setAuthOpen] = useState(defaultAuthOpen);
  const open = () => setAuthOpen(true);
  const honorific = useHonorific();

  // Committed-dark surface: pin the scroll background obsidian + kill the iOS
  // rubber-band so a light-OS viewer never flashes light behind the page on
  // overscroll (the per-route viewport handles the status-bar chrome). #14130f =
  // the .dark --background value; set literally since body's own token is light-mode.
  useEffect(() => {
    const b = document.body.style;
    const prevBg = b.background;
    const prevOs = b.overscrollBehavior;
    b.background = "#14130f";
    b.overscrollBehavior = "none";
    return () => {
      b.background = prevBg;
      b.overscrollBehavior = prevOs;
    };
  }, []);

  const { signIn } = useAuthActions();
  const [demoBusy, setDemoBusy] = useState(false);
  const startDemo = async () => {
    setDemoBusy(true);
    try {
      await signIn("anonymous");
      window.location.href = "/os";
    } catch (e) {
      console.error("[landing] demo signIn failed", e);
      setDemoBusy(false);
      open();
    }
  };

  return (
    // force-dark obsidian world + a soft gold aurora from the top
    <div
      className="dark relative min-h-dvh bg-background text-foreground"
      style={{
        background:
          "radial-gradient(120% 75% at 50% -8%, color-mix(in oklab, var(--color-gold) 11%, transparent), transparent 55%), var(--background)",
      }}
    >
      {/* NAV — floating, hairline, blurred. */}
      <header className="sticky top-0 z-30 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-gold/15">
              <BrandMark variant="mark" className="h-5" />
            </span>
            <span className="font-display text-lg font-semibold tracking-wide">Konglo OS</span>
          </div>
          <Button variant="outline" size="sm" onClick={open}>
            Masuk
          </Button>
        </div>
      </header>

      <main>
      {/* HERO — the serif does the selling; gold is the only accent. */}
      <section className="mx-auto max-w-5xl px-6 pb-24 pt-14 sm:pt-24">
        {/* Mobile: App-Store-style product header — app icon leads the hero. */}
        <div className="animate-reveal mb-7 flex items-center gap-3 md:hidden">
          <img
            src="/02-product/konglo-app-icon-1024.webp"
            alt=""
            width={1024}
            height={1024}
            className="h-14 w-14 rounded-[1rem] shadow-lg ring-1 ring-gold/25"
          />
          <div>
            <p className="font-display text-lg font-semibold leading-tight">Konglo OS</p>
            <p className="text-xs text-muted-foreground">Family Office Operating System</p>
          </div>
        </div>
        <div className="animate-reveal">
          <Eyebrow>Untuk pemilik grup usaha</Eyebrow>
        </div>
        <h1
          className="animate-reveal font-display mt-5 max-w-4xl text-balance text-5xl font-bold leading-[1.02] sm:text-6xl lg:text-7xl"
          style={{ animationDelay: "80ms" }}
        >
          Pandang seluruh grup {honorific} <span className="text-gradient-gold">sejernih satu neraca</span>.
        </h1>
        <p
          className="animate-reveal mt-6 max-w-xl text-lg text-muted-foreground"
          style={{ animationDelay: "160ms" }}
        >
          Dari anak usaha, kas, dan investasi hingga properti, keluarga, dan warisan — sebelas
          domain kami himpun dalam satu sumber kebenaran yang {honorific} simpan sendiri, bukan di
          cloud pihak lain. Dirancang bagi pemilik yang mesti memutuskan.
        </p>
        <div
          className="animate-reveal mt-9 flex flex-wrap items-center gap-3"
          style={{ animationDelay: "240ms" }}
        >
          <Button size="lg" onClick={startDemo} disabled={demoBusy}>
            {demoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Lihat demo langsung <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="lg" onClick={open}>
            Masuk
          </Button>
        </div>

        <Link
          href="/pendekatan"
          className="animate-reveal group mt-5 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          style={{ animationDelay: "280ms" }}
        >
          Belum berkenan masuk? Perkenankan kami tunjukkan dahulu — sepuluh titik buta yang jarang disadari pemilik grup usaha
          <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
        </Link>

        <div
          className="animate-reveal mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-gold/15 bg-gold/15 sm:grid-cols-3"
          style={{ animationDelay: "320ms" }}
        >
          {PROOF.map((p) => (
            <div key={p.value} className="bg-background/95 px-6 py-7">
              <div className="text-gradient-gold font-display text-3xl font-semibold sm:text-4xl">{p.value}</div>
              <p className="mt-2.5 text-xs leading-relaxed text-muted-foreground">{p.label}</p>
            </div>
          ))}
        </div>

        <HeroShowcase />
      </section>

      {/* PROBLEM — recognitions, hairline-separated. */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="font-display text-3xl font-semibold">Terdengar tak asing, {honorific}?</h2>
        <div className="mt-8">
          {PROBLEMS.map((p) => (
            <p
              key={p}
              className="font-display border-t border-border py-6 text-xl leading-snug text-foreground first:border-t-0 first:pt-0"
            >
              {p}
            </p>
          ))}
        </div>
      </section>

      {/* HASIL — the emotional peak. */}
      <section className="mx-auto max-w-2xl px-6 py-24">
        <Eyebrow>Bukan kira-kira, tapi terukur</Eyebrow>
        <h2 className="font-display mt-3 text-3xl font-semibold">Dalam 30 hari, {honorific} mengetahui —</h2>
        <ul className="mt-8 space-y-5">
          {OUTCOMES.map((o) => (
            <li key={o} className="flex gap-3">
              <ArrowRight className="mt-1.5 h-4 w-4 shrink-0 text-gold" />
              <span className="font-display text-lg leading-snug text-foreground">{o}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* IN YOUR POCKET — the iOS-app moment. */}
      <IosShowcase />

      {/* ENGINE — the eleven domains behind the clarity. */}
      <section className="mx-auto max-w-5xl px-6 py-24">
        <h2 className="font-display text-2xl font-semibold text-muted-foreground">Mesin di baliknya.</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sebelas domain, satu sumber kebenaran — bekerja senyap di balik setiap hasil di atas.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {MENU.filter((m) => m.slug !== "beranda").map((m) => (
            <div
              key={m.slug}
              className="group rounded-2xl border border-gold/10 bg-white/[0.02] p-4 transition-all hover:-translate-y-0.5 hover:border-gold/40"
            >
              {/* Single gold accent — the luxury palette is obsidian + gold only
                  (per-slice accents belong inside the app, not on this surface). */}
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-gold/10 text-gold">
                <MenuIcon name={m.slug} size={18} />
              </span>
              <div className="mt-3 text-sm font-medium">{m.label}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{m.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* BRAND CRAFT — one identity across every surface. */}
      <BrandLockups />

      {/* CLOSING CTA. */}
      <ClosingCTA onDemo={startDemo} onOpen={open} demoBusy={demoBusy} />
      </main>

      <footer className="border-t border-white/5">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-6 pb-[calc(6rem+env(safe-area-inset-bottom))] pt-8 text-sm text-muted-foreground sm:flex-row md:pb-8">
          <div className="flex items-center gap-2">
            <BrandMark variant="mark" className="h-4" />
            <span>© 2026 Konglo OS — swakelola dan privat.</span>
          </div>
          <button onClick={open} className="transition-colors hover:text-foreground">
            Masuk
          </button>
        </div>
      </footer>

      {/* MOBILE iOS-STYLE ACTION BAR — fixed tab-bar feel; safe-area aware. */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-background/80 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden">
        <div className="flex items-center gap-2.5">
          <Button size="lg" className="flex-1 transition-transform active:scale-[0.98]" onClick={startDemo} disabled={demoBusy}>
            {demoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Coba demo
          </Button>
          <Button variant="outline" size="lg" className="flex-1 transition-transform active:scale-[0.98]" onClick={open}>
            Masuk
          </Button>
        </div>
      </div>

      <AuthDialog open={authOpen} onClose={() => setAuthOpen(false)} demoPassword={demoPassword} />
    </div>
  );
}
