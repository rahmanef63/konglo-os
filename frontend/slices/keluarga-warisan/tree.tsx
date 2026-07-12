// Static family-tree illustration for Keluarga & Warisan (slice-local).
// Split out of screen.tsx to keep the orchestrator under the ~200-line cap.
// The tree structure is illustrative ('data contoh') and there is no live source
// for it, so it renders for the demo user only; a real user sees a neutral empty.
import { SectionCard, Avatar, EmptyState, useIsDemo } from "@/frontend/shared";
import { CHILDREN } from "./data";

export function FamilyTree() {
  const isDemo = useIsDemo();
  if (!isDemo) {
    return (
      <SectionCard title="Pohon Keluarga" sub="Struktur keluarga & kepemilikan">
        <EmptyState message="Belum ada data pohon keluarga." />
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Pohon Keluarga" sub="Struktur keluarga & kepemilikan · data contoh">
      <div className="flex flex-col items-center gap-2 py-2">
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-center gap-1">
            <Avatar name="Pendiri" color="var(--color-gold)" size={44} />
            <span className="text-[11px] text-muted-foreground">Pendiri</span>
          </div>
          <span className="text-lg text-muted-foreground">♥</span>
          <div className="flex flex-col items-center gap-1">
            <Avatar name="Nyonya" color="var(--color-mk-red)" size={44} />
            <span className="text-[11px] text-muted-foreground">Istri</span>
          </div>
        </div>
        <span className="h-5 w-px bg-border" />
        <div className="flex items-center gap-5">
          {CHILDREN.map((c) => (
            <div key={c.name} className="flex flex-col items-center gap-1">
              <Avatar name={c.name} color={c.color} size={40} />
              <span className="text-[11px] text-muted-foreground">{c.name}</span>
            </div>
          ))}
        </div>
        <span className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2.5">
          {[1, 2, 3, 4].map((g) => (
            <span key={g} className="grid h-7 w-7 place-items-center rounded-full border border-border bg-muted text-[10px] text-muted-foreground">
              G3
            </span>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
