"use client";

import { type Role } from "@/lib/roles";
import { SearchWidget } from "./search-widget";
import { FeatureCards } from "./feature-cards";
import { SetupGuide } from "./setup-guide";
import { useGreeting } from "./use-greeting";

// Mobile launcher (<md) — calmer, more spacious hero: a full-bleed soft wash with
// an eyebrow date + a display greeting + the centered search, then the setup guide
// and the grouped feature accordion (card/list toggle). NO separate app-grid — the
// accordion's CARD view is the thumbnail launcher now (DRY). Navigation only.
export function MobileHome({ role }: { role: Role }) {
  const { greeting, date } = useGreeting(role);

  return (
    <div className="space-y-9">
      <section
        className="-mx-5 rounded-b-3xl px-5 pb-10 pt-[calc(env(safe-area-inset-top)+1.75rem)]"
        style={{
          background:
            "linear-gradient(180deg, color-mix(in oklab, var(--primary) 13%, transparent), transparent 92%)",
        }}
      >
        {date && (
          <p className="animate-reveal text-xs uppercase tracking-[0.14em] text-muted-foreground">
            {date}
          </p>
        )}
        {/* Display greeting styled as a headline but kept a <p> so the OsTopbar's
            slice <h1> stays the page's single h1 (a11y). */}
        <p
          className="animate-reveal mt-1.5 font-display text-2xl font-bold leading-tight text-foreground"
          style={{ animationDelay: "60ms" }}
        >
          {greeting}
        </p>
        <div className="animate-reveal mt-6" style={{ animationDelay: "130ms" }}>
          <SearchWidget />
        </div>
      </section>

      <SetupGuide />

      <section className="space-y-3">
        <h2 className="text-sm font-medium text-muted-foreground">Semua fitur</h2>
        <FeatureCards role={role} />
      </section>
    </div>
  );
}
