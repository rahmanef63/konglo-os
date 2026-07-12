"use client";

import { GlassCard } from "@/frontend/shared";
import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/observability";

// Segment error boundary for /os. Captures the render error so it surfaces in
// logs, then offers an in-card retry. Theme tokens only (rr: no hex).
export default function OsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  captureError(error, { boundary: "os/error", digest: error?.digest });

  return (
    <div className="grid min-h-[60vh] place-items-center p-6">
      <GlassCard className="max-w-md p-7 text-center">
        <h2 className="font-display text-xl font-bold text-foreground">
          Gagal memuat bagian ini
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Terjadi kesalahan saat menampilkan bagian ini. Coba lagi.
        </p>
        <Button size="sm" onClick={() => reset()} className="mt-5">
          Coba lagi
        </Button>
      </GlassCard>
    </div>
  );
}
