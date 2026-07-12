"use client";

import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";

// Lazy per-slice loading fallback (mirrors os-shell ScreenSkeleton shape so the
// per-panel swap stays visually stable while the chunk streams in).
function SliceFallback() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-56 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// Each screen is a 'use client' DEFAULT export → next/dynamic resolves the
// default automatically. ssr:false keeps every slice out of the /os first-load
// bundle (esp. the heavy vendored data-studio notion-database) and code-splits
// each into its own chunk loaded on first selection.
const lazy = (load: () => Promise<{ default: ComponentType }>) =>
  dynamic(load, { ssr: false, loading: () => <SliceFallback /> });

// SSOT slug → screen. Lookup map (rr: no switch-chains). Menu order in menu.ts.
export const SCREENS: Record<string, ComponentType> = {
  beranda: lazy(() => import("./beranda/screen")),
  asisten: lazy(() => import("./asisten/screen")),
  "portofolio-bisnis": lazy(() => import("./portofolio-bisnis/screen")),
  "kekayaan-kas": lazy(() => import("./kekayaan-kas/screen")),
  "investasi-pasar": lazy(() => import("./investasi-pasar/screen")),
  "properti-aset": lazy(() => import("./properti-aset/screen")),
  "keluarga-warisan": lazy(() => import("./keluarga-warisan/screen")),
  "hiburan-gaya-hidup": lazy(() => import("./hiburan-gaya-hidup/screen")),
  kesehatan: lazy(() => import("./kesehatan/screen")),
  filantropi: lazy(() => import("./filantropi/screen")),
  "relasi-jaringan": lazy(() => import("./relasi-jaringan/screen")),
  "keamanan-staf": lazy(() => import("./keamanan-staf/screen")),
  "data-studio": lazy(() => import("./data-studio/screen")),
  pengaturan: lazy(() => import("./pengaturan/screen")),
  admin: lazy(() => import("./admin/screen")),
};
