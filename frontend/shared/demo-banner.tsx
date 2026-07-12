"use client";

import { Sparkles, LogOut } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useIsDemo } from "./use-me";

// Shown atop the OS content while in an anonymous demo session; real (email)
// sessions render nothing (zero footprint). Exit = signOut → proxy sends the
// visitor to /login, where a real account can sign in. Demo data is in-code mock,
// so there is nothing to lose on exit. Theme tokens only.
export function DemoBanner() {
  const isDemo = useIsDemo();
  const { signOut } = useAuthActions();
  if (!isDemo) return null;

  return (
    <div
      role="status"
      className="mb-4 flex flex-col gap-3 rounded-xl border border-gold/30 bg-gold/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/15 text-gold">
          <Sparkles className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Mode Demo</p>
          <p className="text-xs text-muted-foreground">
            Menampilkan data contoh — hanya untuk sesi ini. Silakan keluar untuk
            masuk dengan akun asli.
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => void signOut()}
        className="inline-flex items-center gap-1.5 self-start rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-gold/50 sm:self-auto"
      >
        <LogOut className="h-3.5 w-3.5" aria-hidden /> Keluar dari demo
      </button>
    </div>
  );
}
