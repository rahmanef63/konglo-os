"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// Current user identity + demo status (Convex `rbac.me`). undefined while loading,
// null when signed out.
export function useMe() {
  return useQuery(api.features.rbac.queries.me);
}

// True while the current session is the anonymous demo user (no email). The demo
// user is an effective principal in the UI but reads ALL data from the in-code
// mock, never Convex — see useDemoValue.
export function useIsDemo(): boolean {
  return useMe()?.isDemo ?? false;
}

// Read-source switch: mock for the demo user, real (Convex) otherwise.
// ponytail: demo is READ-ONLY over code constants — there is no Convex write path
// in demo mode, so a demo visitor can never mutate the shared family-office data.
// A per-browser localStorage sandbox (useLocalStorageState) is the upgrade path
// if editable demos are ever wanted.
export function useDemoValue<T>(mock: T, real: T): T {
  return useIsDemo() ? mock : real;
}
