"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { buildGraph, type KongloGroup } from "./types";
import { DEFAULT_CONFIG, tick, type SimNode } from "./graph-sim";

const W = DEFAULT_CONFIG.width;
const H = DEFAULT_CONFIG.height;

const KIND_COLOR: Record<string, string> = {
  group: "var(--color-gold)",
  person: "var(--color-mk-blue)",
  company: "var(--color-mk-green)",
};

// Deterministic angle from an id (spreads satellites without Math.random).
function hashAngle(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return (h % 360) * (Math.PI / 180);
}

type XY = { id: string; x: number; y: number };

// Obsidian-style relation graph. Groups + sector-overlap backbone; people and
// companies toggle in as satellites. Force layout blooms on mount then stops
// (static SVG when idle); drag a node to re-heat, wheel to zoom, drag canvas to
// pan, click a node to open its group dashboard.
export function KongloGraph({
  groups,
  onOpen,
}: {
  groups: KongloGroup[];
  onOpen: (groupId: string) => void;
}) {
  const [show, setShow] = useState({ people: false, companies: true });
  const [hover, setHover] = useState<string | null>(null);
  const [view, setView] = useState({ x: 0, y: 0, w: W, h: H });
  // Render coordinates live in state (pure render); the sim's velocity/pin state
  // lives in nodesRef and is mutated by the rAF loop.
  const [pos, setPos] = useState<XY[]>([]);

  const graph = useMemo(() => buildGraph(groups, show), [groups, show]);
  const svgRef = useRef<SVGSVGElement>(null);
  const nodesRef = useRef<SimNode[]>([]);
  const rafRef = useRef<number | null>(null);
  const alphaRef = useRef(1);
  const drag = useRef<{ id: string | null; moved: boolean; px: number; py: number } | null>(null);
  const pan = useRef<{ px: number; py: number; vx: number; vy: number } | null>(null);

  const publish = useCallback(
    () => setPos(nodesRef.current.map((n) => ({ id: n.id, x: n.x, y: n.y }))),
    [],
  );
  const stopLoop = useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  }, []);
  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
    const step = () => {
      tick(nodesRef.current, graph.links, DEFAULT_CONFIG, alphaRef.current);
      alphaRef.current = Math.max(0, alphaRef.current * 0.985);
      publish();
      if (alphaRef.current > 0.03 || drag.current?.id) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
      }
    };
    rafRef.current = requestAnimationFrame(step);
  }, [graph.links, publish]);
  const reheat = useCallback(() => {
    alphaRef.current = Math.max(alphaRef.current, 0.6);
    startLoop();
  }, [startLoop]);

  // (Re)seed positions whenever the node set changes, then bloom.
  useEffect(() => {
    const gi = new Map(groups.map((g, i) => [g.id, i]));
    nodesRef.current = graph.nodes.map((n) => {
      const idx = gi.get(n.groupId) ?? 0;
      const ga = (idx / groups.length) * 2 * Math.PI;
      const gx = W / 2 + Math.cos(ga) * 300;
      const gy = H / 2 + Math.sin(ga) * 300;
      if (n.kind === "group") return { id: n.id, x: gx, y: gy, vx: 0, vy: 0, fx: null, fy: null };
      const a = hashAngle(n.id);
      return { id: n.id, x: gx + Math.cos(a) * 46, y: gy + Math.sin(a) * 46, vx: 0, vy: 0, fx: null, fy: null };
    });
    alphaRef.current = 1;
    publish();
    startLoop();
    return stopLoop;
  }, [graph, groups, publish, startLoop, stopLoop]);

  // Screen → viewBox coordinate.
  const toVB = useCallback(
    (clientX: number, clientY: number) => {
      const r = svgRef.current!.getBoundingClientRect();
      return {
        x: view.x + ((clientX - r.left) / r.width) * view.w,
        y: view.y + ((clientY - r.top) / r.height) * view.h,
      };
    },
    [view],
  );

  function onNodeDown(e: React.PointerEvent, id: string) {
    e.stopPropagation();
    (e.target as Element).setPointerCapture(e.pointerId);
    const p = toVB(e.clientX, e.clientY);
    drag.current = { id, moved: false, px: p.x, py: p.y };
  }
  function onPointerDown(e: React.PointerEvent) {
    pan.current = { px: e.clientX, py: e.clientY, vx: view.x, vy: view.y };
  }
  function onPointerMove(e: React.PointerEvent) {
    if (drag.current?.id) {
      const p = toVB(e.clientX, e.clientY);
      if (Math.hypot(p.x - drag.current.px, p.y - drag.current.py) > 4) drag.current.moved = true;
      const n = nodesRef.current.find((m) => m.id === drag.current!.id);
      if (n) {
        n.fx = p.x;
        n.fy = p.y;
      }
      reheat();
      return;
    }
    if (pan.current) {
      const r = svgRef.current!.getBoundingClientRect();
      const dx = ((e.clientX - pan.current.px) / r.width) * view.w;
      const dy = ((e.clientY - pan.current.py) / r.height) * view.h;
      setView((v) => ({ ...v, x: pan.current!.vx - dx, y: pan.current!.vy - dy }));
    }
  }
  function onPointerUp() {
    if (drag.current) {
      const d = drag.current;
      const n = nodesRef.current.find((m) => m.id === d.id);
      if (n) {
        n.fx = null;
        n.fy = null;
      }
      if (!d.moved && d.id) {
        const node = graph.nodes.find((g) => g.id === d.id);
        if (node) onOpen(node.groupId);
      }
      drag.current = null;
    }
    pan.current = null;
  }
  function onWheel(e: React.WheelEvent) {
    const p = toVB(e.clientX, e.clientY);
    const k = e.deltaY > 0 ? 1.12 : 1 / 1.12;
    const nw = Math.min(W * 2.5, Math.max(W * 0.25, view.w * k));
    const nh = nw * (H / W);
    setView({ x: p.x - ((p.x - view.x) * nw) / view.w, y: p.y - ((p.y - view.y) * nh) / view.h, w: nw, h: nh });
  }

  const byId = new Map(pos.map((p) => [p.id, p]));
  const zoomed = view.w < W * 0.75; // reveal satellite labels when zoomed in

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Toggle on={show.companies} onClick={() => setShow((s) => ({ ...s, companies: !s.companies }))} color={KIND_COLOR.company}>
          Perusahaan
        </Toggle>
        <Toggle on={show.people} onClick={() => setShow((s) => ({ ...s, people: !s.people }))} color={KIND_COLOR.person}>
          Tokoh
        </Toggle>
        <span className="text-xs text-muted-foreground">
          <span className="text-[color:var(--color-gold)]">●</span> Grup · garis = sektor bersama
        </span>
        <button
          type="button"
          onClick={reheat}
          className="ml-auto rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground hover:border-[color:var(--color-gold)]/40 hover:text-foreground"
        >
          Rapikan
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card/40">
        <svg
          ref={svgRef}
          viewBox={`${view.x} ${view.y} ${view.w} ${view.h}`}
          className="h-[60vh] w-full touch-none select-none"
          role="img"
          aria-label="Graf relasi konglomerat — grup, tokoh, dan perusahaan"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
          onWheel={onWheel}
        >
          <g stroke="currentColor" className="text-border">
            {graph.links.map((l, i) => {
              const a = byId.get(l.source);
              const b = byId.get(l.target);
              if (!a || !b) return null;
              const lit = hover && (l.source === hover || l.target === hover);
              return (
                <line
                  key={i}
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  strokeWidth={l.kind === "sektor" ? 1 : 0.6}
                  strokeOpacity={lit ? 0.9 : l.kind === "sektor" ? 0.5 : 0.28}
                  style={lit ? { stroke: "var(--color-gold)" } : undefined}
                />
              );
            })}
          </g>
          {graph.nodes.map((n) => {
            const p = byId.get(n.id);
            if (!p) return null;
            const showLabel = n.kind === "group" || hover === n.id || zoomed;
            return (
              <g
                key={n.id}
                transform={`translate(${p.x} ${p.y})`}
                className="cursor-pointer"
                onPointerDown={(e) => onNodeDown(e, n.id)}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
              >
                <circle
                  r={n.weight}
                  style={{ fill: KIND_COLOR[n.kind] }}
                  fillOpacity={hover && hover !== n.id && n.kind !== "group" ? 0.5 : 0.92}
                  stroke="var(--color-background)"
                  strokeWidth={1}
                />
                {showLabel && (
                  <text
                    y={-n.weight - 4}
                    textAnchor="middle"
                    className="pointer-events-none fill-foreground"
                    style={{ fontSize: n.kind === "group" ? 13 : 10 }}
                  >
                    {n.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Seret simpul untuk menata · gulir untuk zoom · klik untuk buka dasbor
      </p>
    </div>
  );
}

function Toggle({ on, onClick, color, children }: { on: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        on ? "border-transparent text-foreground" : "border-border text-muted-foreground hover:text-foreground"
      }`}
      style={on ? { background: `color-mix(in oklab, ${color} 16%, transparent)`, borderColor: `color-mix(in oklab, ${color} 45%, transparent)` } : undefined}
    >
      <span className="h-2 w-2 rounded-full" style={{ background: color }} />
      {children}
    </button>
  );
}
