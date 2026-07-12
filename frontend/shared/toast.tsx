"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

// Dependency-free toast system (ports prototype window.toast). Glass panel,
// tone icon, auto-dismiss. useToast() anywhere under <ToastProvider>.
export type ToastTone = "success" | "info" | "warn" | "error";

interface ToastItem {
  id: number;
  msg: string;
  tone: ToastTone;
}

// `assertive` toasts interrupt the screen-reader queue (failures the user must
// notice now); `success`/`info` stay `polite` so they don't cut off other
// output. a11y politeness is set per-toast (see live region below), not on the
// container, so the two tiers can coexist.
const TONES: Record<
  ToastTone,
  { Icon: typeof Info; color: string; assertive: boolean }
> = {
  success: { Icon: CheckCircle2, color: "var(--color-mk-green)", assertive: false },
  info: { Icon: Info, color: "var(--color-mk-blue)", assertive: false },
  warn: { Icon: AlertTriangle, color: "var(--color-mk-orange)", assertive: true },
  error: { Icon: AlertTriangle, color: "var(--color-mk-red)", assertive: true },
};

const ToastCtx = createContext<(msg: string, tone?: ToastTone) => void>(() => {});

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  // SSR-safe portal (same pattern as Modal): mount only after first effect.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const idRef = useRef(0);

  const push = useCallback((msg: string, tone: ToastTone = "info") => {
    const id = ++idRef.current;
    setItems((t) => [...t, { id, msg, tone }].slice(-4));
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3800);
  }, []);

  return (
    <ToastCtx.Provider value={push}>
      {children}
      {mounted &&
        createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:pr-6 md:bottom-5">
            {items.map((t) => {
              const { Icon, color, assertive } = TONES[t.tone];
              return (
                <div
                  key={t.id}
                  role={assertive ? "alert" : "status"}
                  aria-live={assertive ? "assertive" : "polite"}
                  className="glass animate-dialog pointer-events-auto flex max-w-sm items-center gap-2.5 rounded-xl px-4 py-3 shadow-2xl"
                >
                  <Icon className="h-4 w-4 shrink-0" style={{ color }} />
                  <span className="text-sm text-foreground">{t.msg}</span>
                </div>
              );
            })}
          </div>,
          document.body,
        )}
    </ToastCtx.Provider>
  );
}
