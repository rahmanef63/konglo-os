"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useIsDemo } from "./use-me";

// The OS's form of address for the owner (Tuan / Nyonya), set by the owner in
// Settings → Sapaan. Falls back to the neutral "Tuan/Nyonya" until chosen — and
// always for the demo session (no real owner). Used by greetings, onboarding,
// and any direct address to the principal.
export function useHonorific(): string {
  const isDemo = useIsDemo();
  const settings = useQuery(api.features.appSettings.queries.get, isDemo ? "skip" : {});
  return settings?.honorific ?? "Tuan/Nyonya";
}
