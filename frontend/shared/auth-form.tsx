"use client";

import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Loader2, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandMark } from "./brand-mark";
import { DemoQuickLogin } from "./demo-quick-login";
import { useHonorific } from "./use-honorific";

// rr: auth surface. Password provider (signIn/signUp). Themed, no hex.
// Used inside Modal (dialog/sheet) and the /login fallback. Redirects to /os.
export function AuthForm({
  onDone,
  demoPassword,
}: {
  onDone?: () => void;
  demoPassword?: string;
}) {
  const { signIn } = useAuthActions();
  const honorific = useHonorific();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const field =
    "w-full rounded-lg border border-border bg-background/60 py-2.5 pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold transition-colors";

  // OAuth: redirects to Google when the Convex deployment has AUTH_GOOGLE_ID/SECRET
  // set (env-gated in convex/auth.ts). If unprovisioned it errors before redirect —
  // caught so the password path stays usable. Access is allowlist-gated server-side.
  const googleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn("google");
    } catch (err) {
      console.error("[auth-form] google signIn failed", err);
      setError("Masuk dengan Google belum tersedia saat ini. Mohon gunakan email dan kata sandi untuk sementara.");
      setBusy(false);
    }
  };

  return (
    <div className="p-7 pt-8">
      <div className="mb-6">
        <BrandMark variant="mark" className="mb-3 h-10" />
        <p className="text-xs uppercase tracking-[0.2em] text-gold">Konglo OS</p>
        <h2 className="font-display mt-1 text-3xl font-bold">
          {mode === "signIn" ? "Masuk" : "Daftar"}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "signIn"
            ? `Selamat datang kembali, ${honorific}. Silakan masuk untuk mengakses ruang kerja family office Anda.`
            : "Siapkan akun untuk mulai menata dan mengelola portofolio keluarga."}
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        size="lg"
        disabled={busy}
        onClick={googleSignIn}
        className="w-full"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden focusable="false">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.24 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
          <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84Z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38Z" />
        </svg>
        Lanjutkan dengan Google
      </Button>

      <div className="my-4 flex items-center gap-3 text-[11px] uppercase tracking-wider text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        atau email
        <span className="h-px flex-1 bg-border" />
      </div>

      <form
        className="flex flex-col gap-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          setBusy(true);
          const fd = new FormData(e.currentTarget);
          fd.set("flow", mode);
          try {
            await signIn("password", fd);
            onDone?.();
            window.location.href = "/os";
          } catch (err) {
            console.error("[auth-form] signIn failed", err);
            setError("Email atau kata sandi tidak sesuai. Mohon periksa kembali.");
            setBusy(false);
          }
        }}
      >
        {/* a11y: explicit label↔control pairing via htmlFor/id (replaces the
            prior aria-label-only association). The fields are visually
            icon+placeholder only, so the paired label text is sr-only — but it
            is a REAL <label htmlFor>, so getByLabelText / assistive tech resolve
            each control by name. */}
        <div className="relative block">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input id="email" name="email" type="email" placeholder="Email" required autoComplete="email" className={field} />
        </div>
        <div className="relative block">
          <label htmlFor="password" className="sr-only">
            Kata sandi
          </label>
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Kata sandi"
            required
            autoComplete={mode === "signIn" ? "current-password" : "new-password"}
            className={field}
          />
        </div>

        {error && (
          <p
            role="alert"
            aria-live="assertive"
            className="text-sm font-medium text-[color:var(--color-mk-red)]"
          >
            {error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={busy} className="mt-1">
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {mode === "signIn" ? "Masuk" : "Daftar"}
        </Button>
      </form>

      <button
        type="button"
        className="mt-5 w-full text-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        onClick={() => {
          setError(null);
          setMode(mode === "signIn" ? "signUp" : "signIn");
        }}
      >
        {mode === "signIn" ? (
          <>Belum punya akun? <span className="text-gold">Daftar</span></>
        ) : (
          <>Sudah punya akun? <span className="text-gold">Masuk</span></>
        )}
      </button>

      <DemoQuickLogin password={demoPassword} />
    </div>
  );
}
