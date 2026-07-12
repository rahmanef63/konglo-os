"use client";

import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Modal } from "./modal";
import { BrandMark } from "./brand-mark";
import { Button } from "@/components/ui/button";
import { useLocalStorageState } from "./use-local-storage-state";
import { useIsDemo, useMe } from "./use-me";
import { useHonorific } from "./use-honorific";
import { useToast } from "./toast";
import { ArrowRight, Check, Database, Loader2 } from "lucide-react";

const DONE_KEY = "konglo.onboarding.done";
// Settings dispatches this to re-open the guide on demand ("resumable").
export const OPEN_ONBOARDING_EVENT = "konglo:onboarding:open";

// First-run welcome + setup. Shows once per browser for a real (non-demo) user
// until skipped/finished; re-openable from Settings via OPEN_ONBOARDING_EVENT.
// The persistent "Lengkapi data" checklist on Beranda (onboarding.overview) is
// the always-on companion — this modal is just the first-touch. Demo users never
// see it (their data is fixed mock).
export function OnboardingDialog() {
  const isDemo = useIsDemo();
  const me = useMe();
  const honorific = useHonorific();
  const isPrincipal = me?.role === "principal";
  const [done, setDone, hydrated] = useLocalStorageState(DONE_KEY, false);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const loadSample = useMutation(api.features.dataManagement.mutations.loadSample);
  const toast = useToast();

  // Auto-open on first run (once hydrated so there's no SSR flash), and on the
  // re-open event from Settings.
  useEffect(() => {
    if (hydrated && !done && !isDemo && me) setOpen(true);
  }, [hydrated, done, isDemo, me]);
  useEffect(() => {
    const onOpen = () => {
      setStep(0);
      setOpen(true);
    };
    window.addEventListener(OPEN_ONBOARDING_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_ONBOARDING_EVENT, onOpen);
  }, []);

  if (isDemo || !me || !open) return null;

  const finish = () => {
    setDone(true);
    setOpen(false);
  };

  const load = async () => {
    setBusy(true);
    try {
      await loadSample();
      toast("Data contoh berhasil dimuat.", "success");
      setStep(2);
    } catch (e) {
      toast((e as Error).message.replace(/^.*Forbidden:\s*/, "") || "Gagal memuat data contoh.", "error");
    } finally {
      setBusy(false);
    }
  };

  const STEPS = 3;

  return (
    <Modal open={open} onClose={finish} label="Panduan awal Konglo OS">
      <div className="p-7">
        {/* progress dots */}
        <div className="mb-6 flex items-center gap-1.5" aria-hidden>
          {Array.from({ length: STEPS }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i <= step ? "bg-gold" : "bg-border"
              }`}
            />
          ))}
        </div>

        {step === 0 && (
          <div>
            <BrandMark variant="mark" className="mb-4 h-11" />
            <h2 className="font-display text-2xl font-bold">Selamat datang di Konglo OS</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Satu sumber kebenaran untuk seluruh grup usaha keluarga Anda — mulai dari
              anak usaha, kas, dan investasi, hingga properti dan warisan.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground">
                Lewati
              </button>
              <Button onClick={() => setStep(1)}>
                Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 1 && isPrincipal && (
          <div>
            <h2 className="font-display text-2xl font-bold">Mulai dengan data?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Silakan mulai, {honorific} — dari nol dengan data asli Anda sendiri, atau
              muat data contoh terlebih dahulu untuk menjelajah. Anda dapat menggantinya
              atau mengosongkannya kapan saja melalui Pengaturan.
            </p>
            <div className="mt-6 grid gap-2.5 sm:grid-cols-2">
              <button
                onClick={() => setStep(2)}
                disabled={busy}
                className="rounded-xl border border-border p-4 text-left transition-colors hover:border-gold/50 disabled:opacity-50"
              >
                <p className="text-sm font-semibold">Mulai dari nol</p>
                <p className="mt-0.5 text-xs text-muted-foreground">Basis data kosong, siap Anda isi sendiri.</p>
              </button>
              <button
                onClick={load}
                disabled={busy}
                className="rounded-xl border border-gold/40 bg-gold/5 p-4 text-left transition-colors hover:border-gold disabled:opacity-50"
              >
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4 text-gold" />}
                  Muat data contoh
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">Telusuri terlebih dahulu dengan data contoh.</p>
              </button>
            </div>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setStep(0)} className="text-sm text-muted-foreground hover:text-foreground">
                Kembali
              </button>
              <button onClick={finish} className="text-sm text-muted-foreground hover:text-foreground">
                Lewati
              </button>
            </div>
          </div>
        )}

        {step === 1 && !isPrincipal && (
          <div>
            <h2 className="font-display text-2xl font-bold">Ruang kerja Anda</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Menu menyesuaikan dengan peran akses Anda. Data dikelola langsung oleh
              pemilik; Anda dapat melihat dan mengerjakan bagian yang dipercayakan kepada
              Anda.
            </p>
            <div className="mt-6 flex items-center justify-between">
              <button onClick={() => setStep(0)} className="text-sm text-muted-foreground hover:text-foreground">
                Kembali
              </button>
              <Button onClick={() => setStep(2)}>
                Lanjut <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gold/15 text-gold">
              <Check className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-2xl font-bold">Semuanya siap.</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Silakan buka Beranda untuk ringkasan menyeluruh, atau gunakan menu untuk
              menjelajah setiap domain. Panduan ini dapat Anda buka kembali kapan saja
              melalui Pengaturan.
            </p>
            <div className="mt-6 flex justify-end">
              <Button onClick={finish}>Selesai</Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
