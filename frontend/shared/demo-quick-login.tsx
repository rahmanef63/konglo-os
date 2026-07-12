"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { FlaskConical, Loader2 } from "lucide-react";

// Demo-only quick sign-in. Renders ONLY when a password is forwarded from the
// server (DEMO_MODE=1) — otherwise null, so nothing ships to the client. The
// password is a runtime server env (not NEXT_PUBLIC), passed down as a prop.
// Emails match the seeded accounts (authSeed.ts SEED_USERS / SEED_PRINCIPAL_EMAIL).
// The principal is the owner's account; keep in lockstep with authSeed + the OAuth
// allowlist (_shared/allowlist.ts). Prefer "Lanjut dengan Google" for the real demo
// — this password path is DEMO_MODE-only and forwards the demo password to the client.
const ACCOUNTS = [
  { email: "konglo@mail.com", label: "Principal", role: "Pemilik", color: "var(--color-gold)" },
  { email: "ajudan@mail.com", label: "Ajudan", role: "CFO", color: "var(--color-mk-blue)" },
];

export function DemoQuickLogin({ password }: { password?: string }) {
  const { signIn } = useAuthActions();
  const [busy, setBusy] = useState<string | null>(null);

  if (!password) return null;

  const go = async (email: string) => {
    setBusy(email);
    try {
      await signIn("password", { email, password, flow: "signIn" });
      // eslint-disable-next-line react-hooks/immutability -- hard nav after auth, same as AuthForm
      window.location.href = "/os";
    } catch (e) {
      console.error("[demo-quick-login] signIn failed", e);
      setBusy(null);
    }
  };

  return (
    <div className="mt-5 rounded-xl border border-dashed border-gold/40 bg-gold/5 p-3">
      <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
        <FlaskConical className="h-3.5 w-3.5" /> Demo · masuk cepat
      </div>
      <div className="grid grid-cols-2 gap-2">
        {ACCOUNTS.map((a) => (
          <button
            key={a.email}
            type="button"
            onClick={() => go(a.email)}
            disabled={busy !== null}
            className="flex items-center gap-2.5 rounded-lg border border-border bg-background/60 p-2.5 text-left transition-colors hover:border-gold/50 disabled:opacity-50"
          >
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full border text-xs font-bold"
              style={{
                color: a.color,
                borderColor: `color-mix(in oklab, ${a.color} 45%, transparent)`,
                background: `color-mix(in oklab, ${a.color} 16%, transparent)`,
              }}
            >
              {busy === a.email ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : a.label[0]}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium text-foreground">{a.label}</span>
              <span className="block truncate text-xs text-muted-foreground">{a.role}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
