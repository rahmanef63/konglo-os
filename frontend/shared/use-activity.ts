"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Fire-and-forget audit-log writer (server SSOT, features/activity). Errors are
// swallowed — logging must never break the user action it accompanies.
export function useActivityLog() {
  const log = useMutation(api.features.activity.mutations.log);
  return (label: string, meta?: string) => {
    void log({ label, meta }).catch(() => {});
  };
}
