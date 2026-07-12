"use client";

import { useEffect, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// On first authed load: self-register a role row (defaults to staf).
//
// NO auto-seed. Previously this ran seed.run for principal/cfo, so every owner
// login silently filled the shared tables with the mock showcase dataset — which
// is exactly why real users saw fake data. Sample data is now an explicit,
// undoable action in Settings (seed:run behind a snapshot). A real user starts
// empty; onboarding invites them to load the sample or begin from scratch.
export function useOsBootstrap(ready: boolean) {
  const claim = useMutation(api.features.rbac.mutations.claimRole);
  const done = useRef(false);

  useEffect(() => {
    if (!ready || done.current) return;
    done.current = true;
    void claim().catch((e) => console.error("[os-bootstrap]", e));
  }, [ready, claim]);
}
