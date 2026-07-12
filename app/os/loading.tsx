import { Skeleton } from "@/components/ui/skeleton";

// Route-level loading skeleton for /os: mirrors OsShell's sidebar + topbar +
// content grid so the layout doesn't jump when the shell hydrates. A11y:
// labelled status region; Skeleton bars are aria-hidden. Theme tokens only.
export default function OsLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat Konglo OS"
      className="flex h-dvh overflow-hidden"
    >
      <span className="sr-only">Memuat…</span>

      <aside className="hidden w-64 shrink-0 overflow-y-auto border-r border-border bg-card/40 p-4 md:flex md:flex-col">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="space-y-1.5">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-5 sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-3">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-9 w-9 rounded-xl" />
          </div>

          <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
