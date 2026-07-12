"use client";

import { Sparkles } from "lucide-react";
import { MENU } from "@/frontend/slices/menu";
import { canAccess, type Role } from "@/lib/roles";
import { MenuIcon } from "./menu-icon";
import { useIsDemo } from "./use-me";
import { cn } from "@/lib/utils";

// Mobile primary nav — an iOS-style fixed bottom dock (md:hidden; desktop keeps
// the OsNav sidebar). Five fixed slots: [tab][tab][CHAT FAB][tab][Menu]. The
// raised center FAB is the Asisten AI chat — the app's main action (owner's
// request). "Menu" opens the "Semua Fitur" drawer (MoreDrawer), which lists
// EVERY role-accessible item incl. Admin & Akses. Same RBAC MENU source as OsNav.
const MAX_TABS = 3;

export function OsDock({
  role,
  active,
  onSelect,
  onOpenMenu,
}: {
  role: Role;
  active: string;
  onSelect: (slug: string) => void;
  onOpenMenu: () => void;
}) {
  const isDemo = useIsDemo();
  // asisten is the center FAB, so exclude it from the flat tabs.
  const tabs = MENU.filter(
    (m) => canAccess(role, m.slug, isDemo) && m.slug !== "asisten",
  ).slice(0, MAX_TABS);
  // Highlight "Menu" when the open slice isn't a dock tab and isn't asisten.
  const activeInOverflow = active !== "asisten" && !tabs.some((m) => m.slug === active);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(env(safe-area-inset-bottom)+0.6rem)] pt-2 md:hidden">
      <nav
        aria-label="Navigasi utama"
        className="pointer-events-auto mx-auto grid max-w-md grid-cols-5 items-end rounded-2xl border border-border bg-card/95 p-1.5 shadow-lg backdrop-blur"
      >
        <Slot m={tabs[0]} active={active} onSelect={onSelect} />
        <Slot m={tabs[1]} active={active} onSelect={onSelect} />
        <ChatFab active={active === "asisten"} onClick={() => onSelect("asisten")} />
        <Slot m={tabs[2]} active={active} onSelect={onSelect} />
        <DockButton slug="__menu" label="Menu" active={activeInOverflow} onClick={onOpenMenu} />
      </nav>
    </div>
  );
}

// A tab slot: renders a DockButton if the tab exists, else an empty spacer so
// the center FAB stays in the middle regardless of how many tabs the role has.
function Slot({
  m,
  active,
  onSelect,
}: {
  m: { slug: string; label: string } | undefined;
  active: string;
  onSelect: (slug: string) => void;
}) {
  if (!m) return <span aria-hidden />;
  return (
    <DockButton slug={m.slug} label={m.label} active={m.slug === active} onClick={() => onSelect(m.slug)} />
  );
}

// Raised center action = Asisten AI chat. ring-4 ring-background makes it appear
// to punch through the dock; -mt lifts it above the pill.
function ChatFab({ active, onClick }: { active: boolean; onClick: () => void }) {
  return (
    <div className="flex flex-col items-center justify-end">
      <button
        type="button"
        onClick={onClick}
        aria-label="Asisten AI"
        aria-current={active ? "page" : undefined}
        className={cn(
          "-mt-7 grid h-14 w-14 place-items-center rounded-full bg-[color:var(--color-gold)] text-[color:var(--color-gold-ink)] shadow-lg ring-4 ring-background transition-transform motion-safe:active:scale-95",
          active && "ring-[color:var(--color-gold)]/30",
        )}
      >
        <Sparkles className="h-6 w-6" />
      </button>
      <span
        className={cn(
          "mt-1 text-[10px] font-medium leading-none",
          active ? "text-[color:var(--color-gold)]" : "text-muted-foreground",
        )}
      >
        Asisten
      </span>
    </div>
  );
}

function DockButton({
  slug,
  label,
  active,
  onClick,
}: {
  slug: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex min-h-[3.25rem] min-w-0 flex-col items-center justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium leading-none transition-colors",
        active
          ? "bg-[color:var(--color-gold)]/12 text-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
      )}
    >
      <span
        className="grid h-6 w-6 place-items-center"
        style={{ color: active ? "var(--color-gold)" : undefined }}
      >
        {slug === "__menu" ? <MoreIcon /> : <MenuIcon name={slug} size={18} />}
      </span>
      <span className="w-full truncate text-center">{label}</span>
    </button>
  );
}

function MoreIcon() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </svg>
  );
}
