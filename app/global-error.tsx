"use client";

import { captureError } from "@/lib/observability";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  captureError(error, { boundary: "global-error", digest: error?.digest });

  return (
    <html lang="id">
      <body className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <h1 className="text-2xl font-bold">Terjadi kesalahan</h1>
          <button
            onClick={() => reset()}
            className="mt-4 rounded-xl border px-4 py-2"
          >
            Coba lagi
          </button>
        </div>
      </body>
    </html>
  );
}
