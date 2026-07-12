"use client";

import { useCallback, useEffect, useState } from "react";

// SSR-safe localStorage-backed state. Renders from `seed` on the server and first
// paint (so hydration matches), then swaps in the persisted value on mount and
// writes through on every change. Returns [value, set, hydrated].
// ponytail: JSON round-trip, last-write-wins; enough for a per-browser demo sandbox.
export function useLocalStorageState<T>(key: string, seed: T) {
  const [value, setValue] = useState<T>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw != null) setValue(JSON.parse(raw) as T);
    } catch {
      /* absent / corrupt / no storage → keep seed */
    }
    setHydrated(true);
  }, [key]);

  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const v = typeof next === "function" ? (next as (p: T) => T)(prev) : next;
        try {
          localStorage.setItem(key, JSON.stringify(v));
        } catch {
          /* quota / SSR — value still lives in React state this session */
        }
        return v;
      });
    },
    [key],
  );

  return [value, set, hydrated] as const;
}
