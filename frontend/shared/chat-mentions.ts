"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { MENU } from "@/frontend/slices/menu";
import { useIsDemo } from "./use-me";

// Mentionable entities for the "@" menu — gives the AI plain-text context
// (@Name) about which feature / subsidiary / contact the user means. Reuses the
// exact queries the ⌘K CommandPalette consumes, so no new backend surface.

export interface Mention {
  label: string;
  group: "Fitur" | "Anak Usaha" | "Kontak";
}

// `enabled` gates the two live queries: the input mounts on every beranda render
// (launcher), so we only subscribe once the user actually types "@" — same
// "skip"-until-open discipline the CommandPalette uses.
export function useMentionSource(enabled: boolean): Mention[] {
  // Demo never subscribes to the real subsidiaries/contacts tables — mirrors the
  // CommandPalette gate. (A role-less demo would also be rejected server-side and
  // crash the launcher panel.) Feature mentions still work from MENU.
  const isDemo = useIsDemo();
  const live = enabled && !isDemo;
  const subs = useQuery(api.features.subsidiaries.queries.list, live ? {} : "skip");
  const contacts = useQuery(api.features.contacts.queries.list, live ? {} : "skip");

  return useMemo<Mention[]>(() => {
    const feats: Mention[] = MENU.filter(
      (m) => m.slug !== "beranda" && m.slug !== "asisten",
    ).map((m) => ({ label: m.label, group: "Fitur" }));
    const cos: Mention[] = (subs ?? []).map((s) => ({
      label: s.name,
      group: "Anak Usaha",
    }));
    const vips: Mention[] = (contacts ?? []).map((c) => ({
      label: c.name,
      group: "Kontak",
    }));
    return [...feats, ...cos, ...vips];
  }, [subs, contacts]);
}

// Filter by the token after "@", cap per group so the popover stays tidy.
export function filterMentions(all: Mention[], query: string): Mention[] {
  const q = query.trim().toLowerCase();
  const match = (m: Mention) => !q || m.label.toLowerCase().includes(q);
  const take = (group: Mention["group"], n: number) =>
    all.filter((m) => m.group === group && match(m)).slice(0, n);
  return [...take("Fitur", 6), ...take("Anak Usaha", 5), ...take("Kontak", 5)];
}
