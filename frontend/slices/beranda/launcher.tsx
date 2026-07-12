"use client";

import { type Role } from "@/lib/roles";
import { SearchWidget } from "./search-widget";
import { MenuChips } from "./menu-chips";
import { FeatureCards } from "./feature-cards";
import { SetupGuide } from "./setup-guide";
import { useGreeting } from "./use-greeting";

// Desktop/tablet (md+) launcher — a calm "pure launcher" home (Google-homepage
// feel). Top→bottom: a soft primary-wash hero with a warm eyebrow + the centered
// search widget + quick menu chips, then scroll to the full feature-card grid.
// Navigation only — NO financial/data cards (kept on disk, unrendered here).
export function Launcher({ role }: { role: Role }) {
  const { greeting, date } = useGreeting(role);

  return (
    <div className="space-y-10">
      {/* 1) Cover / hero — soft top-down primary wash, generous padding. */}
      <section
        className="rounded-3xl px-6 py-14 sm:px-10 sm:py-20"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--primary) 9%, transparent), transparent 90%)",
        }}
      >
        {/* Staged top-down entrance (greeting → search → chips) for a composed,
            concierge-desk first impression. Gated: reduced-motion renders static. */}
        <p className="animate-reveal text-center text-sm text-muted-foreground">
          <span className="text-foreground">{greeting}</span>
          {date && <span> · {date}</span>}
        </p>

        {/* 2) Centered search widget — the focal point. */}
        <div className="animate-reveal mt-6" style={{ animationDelay: "90ms" }}>
          <SearchWidget />
        </div>

        {/* 3) Menu shortcuts — compact quick-launch chips. */}
        <div className="animate-reveal mx-auto mt-6 max-w-[640px]" style={{ animationDelay: "180ms" }}>
          <MenuChips role={role} />
        </div>
      </section>

      {/* Onboarding: where to start filling data (self-retires once complete). */}
      <SetupGuide />

      {/* 4) Scroll → the full feature directory (grouped accordion, card/list). */}
      <section className="space-y-4">
        <h2 className="text-sm font-medium tracking-wide text-muted-foreground">
          Semua fitur
        </h2>
        <FeatureCards role={role} />
      </section>
    </div>
  );
}
