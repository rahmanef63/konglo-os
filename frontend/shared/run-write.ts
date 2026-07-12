"use client";

import { useCallback } from "react";
import { useToast, useActivityLog, isConflict } from "@/frontend/shared";

// SSOT for the slice write-hook error envelope: await the mutation, toast + audit-
// log on success, toast a (conflict-aware) warn + rethrow on failure. Replaces the
// identical try/await/toast/log/catch block hand-written in ~36 add/edit/del
// methods across the slice writes.ts. The win is policy-centralization (the
// "muat ulang" conflict copy, the rethrow-so-FormModal-stays-open default, the
// success/warn tone convention) — the per-site call/ok/log/warn are genuine data.
//
// LEAF MODULE — deliberately NOT re-exported from the @/frontend/shared barrel.
// The slice writes.ts import it directly (`@/frontend/shared/run-write`) while the
// 12 tests/components/*-writes.test.tsx vi.mock the BARREL. useRunWrite (real,
// here) pulls useToast/useActivityLog/isConflict THROUGH that barrel, so it picks
// up each test's mocked spies and the suites validate it unchanged. Adding it to
// the barrel would make it `undefined` inside those mock factories (the trap that
// broke 7 tests once). No cycle: the barrel never imports this module back.
const CONFLICT = "Data sudah berubah — muat ulang";

export type RunWrite = (opts: {
  /** The mutation call, already bound with its args. */
  call: () => Promise<unknown>;
  /** Success toast text. Omit for silent-on-success (reactive cell edits). */
  ok?: string;
  /** Success toast tone. Default "success"; deletes pass "warn". */
  okTone?: "success" | "warn";
  /** Activity-log entry [message, actor?]. Spread so a 1-tuple logs with one arg. */
  log?: [string, string?];
  /** Warn-toast text on failure (the non-conflict message). */
  warn: string;
  /** When true, a server CAS conflict shows the "muat ulang" warn instead of `warn`. */
  conflict?: boolean;
  /** Rethrow on failure so FormModal stays open. Default true; pass false to swallow. */
  rethrow?: boolean;
}) => Promise<void>;

export function useRunWrite(): RunWrite {
  const toast = useToast();
  const logActivity = useActivityLog();
  return useCallback(
    async ({ call, ok, okTone = "success", log, warn, conflict, rethrow = true }) => {
      try {
        await call();
        if (ok) toast(ok, okTone);
        if (log) logActivity(...log);
      } catch (e) {
        toast(conflict && isConflict(e) ? CONFLICT : warn, "warn");
        if (rethrow) throw e;
      }
    },
    [toast, logActivity],
  );
}
