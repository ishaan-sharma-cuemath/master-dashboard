"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, {
  type ForceGraphMethods,
  type LinkObject,
  type NodeObject,
} from "react-force-graph-2d";
import { pinGraphPosition } from "@/lib/actions/graph";
import type { GraphData, GraphHealthKey, GraphLink, GraphNode } from "@/lib/queries/graph";
import { GraphControls } from "./GraphControls";

type FGNode = NodeObject<GraphNode>;
type FGLink = LinkObject<GraphNode, GraphLink>;

/* ————— Canvas can't consume var() strings — resolve tokens once per theme ————— */

type Palette = {
  ink: string;
  inkSecondary: string;
  inkMuted: string;
  lineStrong: string;
  accent: string;
  surface: string;
  green: string;
  amber: string;
  red: string;
  stale: string;
  mono: string;
};

function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fallback: string) => cs.getPropertyValue(name).trim() || fallback;
  return {
    ink: v("--ink", "#1a1915"),
    inkSecondary: v("--ink-secondary", "#57554e"),
    inkMuted: v("--ink-muted", "#8a887f"),
    lineStrong: v("--line-strong", "rgba(26,25,21,0.22)"),
    accent: v("--accent", "#3d63dd"),
    surface: v("--surface", "#fcfbf9"),
    green: v("--health-green", "#0e9f6e"),
    amber: v("--health-amber", "#d97706"),
    red: v("--health-red", "#dc2626"),
    stale: v("--health-stale", "#8a887f"),
    mono: v("--font-plex-mono", "") || "ui-monospace, monospace",
  };
}

function withAlpha(color: string, alpha: number): string {
  const c = color.trim();
  if (c.startsWith("#")) {
    const hex = c.slice(1);
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((ch) => ch + ch)
            .join("")
        : hex;
    const n = parseInt(full.slice(0, 6), 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(",").map((s) => parseFloat(s));
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return c;
}

/** After the sim starts, link endpoints are node objects, not ids. */
const idOf = (end: string | number | FGNode | null | undefined): string =>
  typeof end === "object" && end !== null ? String(end.id) : String(end);

const truncate = (s: string, max = 28) => (s.length > max ? s.slice(0, max - 1) + "…" : s);

/** healthKey → CSS var, for the HTML tooltip (which CAN use var()). */
const HEALTH_VAR: Record<GraphHealthKey, string> = {
  green: "var(--health-green)",
  amber: "var(--health-amber)",
  red: "var(--health-red)",
  stale: "var(--health-stale)",
  neutral: "var(--line-strong)",
  completed: "var(--health-green)",
};

const DIM = 0.15;

export default function GraphCanvas({ data }: { data: GraphData }) {
  const router = useRouter();
  const fgRef = useRef<ForceGraphMethods<NodeObject<GraphNode>, LinkObject<GraphNode, GraphLink>> | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [palette, setPalette] = useState<Palette | null>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });
  const [showTags, setShowTags] = useState(true);
  const [spotlightOrphans, setSpotlightOrphans] = useState(false);
  const [hover, setHover] = useState<FGNode | null>(null);
  // Bumped on zoom/pan while a tooltip is open so it re-anchors.
  const [, setViewTick] = useState(0);
  const didFit = useRef(false);
  const pinTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  /* Theme tokens: read once, re-read when next-themes flips the html class. */
  useEffect(() => {
    setPalette(readPalette());
    const mo = new MutationObserver(() => setPalette(readPalette()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);

  /* Fill the card. */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDims({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setDims({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  /* Flush pending pins on unmount. */
  useEffect(() => {
    const timers = pinTimers.current;
    return () => {
      for (const t of timers.values()) clearTimeout(t);
    };
  }, []);

  /* The library mutates node objects (x/y/vx…) — hand it a private clone. */
  const graphData = useMemo(
    () => ({
      nodes: data.nodes.map((n) => ({ ...n })),
      links: data.links.map((l) => ({ ...l })),
    }),
    [data],
  );

  /* Precomputed 1-hop adjacency for hover highlighting. */
  const neighbors = useMemo(() => {
    const map = new Map<string, Set<string>>();
    const add = (a: string, b: string) => {
      if (!map.has(a)) map.set(a, new Set());
      map.get(a)!.add(b);
    };
    for (const l of data.links) {
      add(l.source, l.target);
      add(l.target, l.source);
    }
    return map;
  }, [data]);

  /* Projects with zero related/blocks edges — the unconnected work. */
  const orphanIds = useMemo(() => {
    const wired = new Set<string>();
    for (const l of data.links) {
      if (l.kind === "related" || l.kind === "blocks") {
        wired.add(l.source);
        wired.add(l.target);
      }
    }
    return new Set(data.nodes.filter((n) => n.kind === "project" && !wired.has(n.id)).map((n) => n.id));
  }, [data]);

  const hoverId = hover ? String(hover.id) : null;

  const nodeAlpha = useCallback(
    (id: string): number => {
      if (hoverId) return id === hoverId || neighbors.get(hoverId)?.has(id) ? 1 : DIM;
      if (spotlightOrphans) return orphanIds.has(id) ? 1 : DIM;
      return 1;
    },
    [hoverId, neighbors, spotlightOrphans, orphanIds],
  );

  const linkDimFactor = useCallback(
    (l: FGLink): number => {
      const s = idOf(l.source);
      const t = idOf(l.target);
      if (hoverId) return s === hoverId || t === hoverId ? 1 : DIM;
      if (spotlightOrphans) return orphanIds.has(s) || orphanIds.has(t) ? 1 : DIM;
      return 1;
    },
    [hoverId, spotlightOrphans, orphanIds],
  );

  /* Physics: gentler decay, kind-aware link lengths, stronger repulsion. */
  const ready = palette !== null && dims.w > 0;
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || !ready) return;
    fg.d3Force("charge")?.strength?.(-120);
    const linkForce = fg.d3Force("link");
    if (linkForce) {
      linkForce.distance((l: FGLink) => (l.kind === "membership" ? 55 : l.kind === "tag" ? 40 : 90));
    }
    fg.d3ReheatSimulation();
  }, [ready, graphData]);

  /* ————— Painters ————— */

  const healthFill = useCallback(
    (key: GraphHealthKey | undefined): string => {
      if (!palette) return "#888";
      switch (key) {
        case "green":
          return palette.green;
        case "amber":
          return palette.amber;
        case "red":
          return palette.red;
        case "stale":
          return palette.stale;
        default:
          return palette.lineStrong;
      }
    },
    [palette],
  );

  const paintNode = useCallback(
    (node: FGNode, ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!palette || node.x == null || node.y == null) return;
      const id = String(node.id);
      const { x, y } = node;
      const highlighted = hoverId !== null && (id === hoverId || Boolean(neighbors.get(hoverId)?.has(id)));

      ctx.save();
      ctx.globalAlpha = nodeAlpha(id);

      if (node.kind === "folder") {
        // Hub: surface disc + 2px ring in folder color, mono-caps label always on.
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = palette.surface;
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = node.color || palette.inkMuted;
        ctx.stroke();
        const size = 10 / globalScale;
        ctx.font = `600 ${size}px ${palette.mono}`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        ctx.fillStyle = palette.inkMuted;
        ctx.fillText(truncate(node.name.toUpperCase(), 24), x, y + 13 + 3 / globalScale);
      } else if (node.kind === "tag") {
        ctx.beginPath();
        ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = palette.stale;
        ctx.fill();
        if (id === hoverId || highlighted) {
          const size = 9.5 / globalScale;
          ctx.font = `500 ${size}px ${palette.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = palette.inkMuted;
          ctx.fillText(truncate(node.name), x, y + 6 + 3 / globalScale);
        }
      } else {
        // Project: health disc + accent progress arc from 12 o'clock.
        const r = 7;
        const stale = node.healthKey === "stale";
        const hollow = node.healthKey === "neutral" || node.healthKey === "completed";

        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = hollow ? palette.surface : healthFill(node.healthKey);
        ctx.fill();
        if (node.healthKey === "neutral") {
          ctx.lineWidth = 1.5;
          ctx.strokeStyle = palette.lineStrong;
          ctx.stroke();
        } else if (node.healthKey === "completed") {
          ctx.lineWidth = 1.6;
          ctx.strokeStyle = palette.green;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(x - 3, y + 0.4);
          ctx.lineTo(x - 0.8, y + 2.8);
          ctx.lineTo(x + 3.2, y - 2.6);
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          ctx.stroke();
        }
        if (stale) {
          // Decay ring — dashed, matching the HealthGlyph language.
          ctx.setLineDash([2.6, 2.4]);
          ctx.beginPath();
          ctx.arc(x, y, r + 2.2, 0, 2 * Math.PI);
          ctx.lineWidth = 1.1;
          ctx.strokeStyle = palette.stale;
          ctx.stroke();
          ctx.setLineDash([]);
        }
        if (node.progress && node.progress > 0) {
          ctx.beginPath();
          ctx.arc(x, y, r + 4, -Math.PI / 2, -Math.PI / 2 + Math.min(node.progress, 1) * 2 * Math.PI);
          ctx.lineWidth = 2;
          ctx.lineCap = "butt";
          ctx.strokeStyle = palette.accent;
          ctx.stroke();
        }
        if (globalScale > 1.15 || id === hoverId || highlighted) {
          const size = 10.5 / globalScale;
          ctx.font = `500 ${size}px ${palette.mono}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = palette.inkSecondary;
          ctx.fillText(truncate(node.name), x, y + r + 4 + 3 / globalScale);
        }
      }
      ctx.restore();
    },
    [palette, hoverId, neighbors, nodeAlpha, healthFill],
  );

  const paintPointerArea = useCallback(
    (node: FGNode, color: string, ctx: CanvasRenderingContext2D) => {
      if (node.x == null || node.y == null) return;
      const r = node.kind === "folder" ? 14 : node.kind === "tag" ? 7.5 : 11;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, 2 * Math.PI);
      ctx.fill();
    },
    [],
  );

  /* Blueprint signature: a very faint dot-grid behind everything. */
  const paintGrid = useCallback(
    (ctx: CanvasRenderingContext2D, globalScale: number) => {
      if (!palette) return;
      const spacing = 28;
      if (spacing * globalScale < 9) return; // zoomed way out — grid would turn to noise
      const inv = ctx.getTransform().inverse();
      const p0 = inv.transformPoint(new DOMPoint(0, 0));
      const p1 = inv.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
      const x0 = Math.floor(Math.min(p0.x, p1.x) / spacing) * spacing;
      const x1 = Math.max(p0.x, p1.x);
      const y0 = Math.floor(Math.min(p0.y, p1.y) / spacing) * spacing;
      const y1 = Math.max(p0.y, p1.y);
      ctx.save();
      ctx.fillStyle = palette.ink;
      ctx.globalAlpha = 0.05;
      const r = 0.65 / globalScale;
      for (let gx = x0; gx <= x1; gx += spacing) {
        for (let gy = y0; gy <= y1; gy += spacing) {
          ctx.beginPath();
          ctx.arc(gx, gy, r, 0, 2 * Math.PI);
          ctx.fill();
        }
      }
      ctx.restore();
    },
    [palette],
  );

  const linkColor = useCallback(
    (l: FGLink): string => {
      if (!palette) return "rgba(128,128,128,0.2)";
      const dim = linkDimFactor(l);
      switch (l.kind) {
        case "blocks":
          return withAlpha(palette.amber, 0.55 * dim);
        case "related":
          return withAlpha(palette.ink, 0.5 * dim);
        case "tag":
          return withAlpha(palette.ink, 0.15 * dim);
        default:
          return withAlpha(palette.ink, 0.25 * dim);
      }
    },
    [palette, linkDimFactor],
  );

  /* ————— Interaction ————— */

  const handleNodeClick = useCallback(
    (node: FGNode) => {
      if (node.kind === "project") router.push(`/projects/${node.id}`);
      else if (node.kind === "folder") router.push(`/?folder=${node.id}`);
    },
    [router],
  );

  const handleDragEnd = useCallback((node: FGNode) => {
    node.fx = node.x;
    node.fy = node.y;
    if (node.kind !== "project" || node.x == null || node.y == null) return;
    const id = String(node.id);
    const { x, y } = node;
    const prev = pinTimers.current.get(id);
    if (prev) clearTimeout(prev);
    pinTimers.current.set(
      id,
      setTimeout(() => {
        pinTimers.current.delete(id);
        void pinGraphPosition(id, x, y);
      }, 500),
    );
  }, []);

  /* Tooltip anchor (project nodes only). */
  let tooltipPos: { x: number; y: number } | null = null;
  if (hover && hover.kind === "project" && hover.x != null && hover.y != null && fgRef.current) {
    tooltipPos = fgRef.current.graph2ScreenCoords(hover.x, hover.y);
  }

  return (
    <div
      ref={containerRef}
      className="card relative overflow-hidden"
      style={{ height: "calc(100vh - 260px)", minHeight: 480 }}
    >
      <GraphControls
        showTags={showTags}
        onToggleTags={() => setShowTags((v) => !v)}
        spotlightOrphans={spotlightOrphans}
        onToggleOrphans={() => setSpotlightOrphans((v) => !v)}
      />

      {data.nodes.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-1.5 text-center">
          <div className="text-[15px] font-semibold">Nothing to map yet</div>
          <div className="text-[13px]" style={{ color: "var(--ink-muted)" }}>
            Add projects and relations to see how the work connects.
          </div>
        </div>
      ) : ready ? (
        <ForceGraph2D<GraphNode, GraphLink>
          ref={fgRef}
          graphData={graphData}
          width={dims.w}
          height={dims.h}
          backgroundColor="rgba(0,0,0,0)"
          warmupTicks={60}
          cooldownTicks={120}
          d3VelocityDecay={0.3}
          autoPauseRedraw={true}
          onRenderFramePre={paintGrid}
          nodeCanvasObject={paintNode}
          nodePointerAreaPaint={paintPointerArea}
          nodeVisibility={(n) => showTags || n.kind !== "tag"}
          linkVisibility={(l) => showTags || l.kind !== "tag"}
          linkColor={linkColor}
          linkWidth={(l) => (l.kind === "related" || l.kind === "blocks" ? 1.5 : 1)}
          linkDirectionalArrowLength={(l) => (l.kind === "blocks" ? 4 : 0)}
          linkDirectionalArrowRelPos={0.9}
          linkDirectionalArrowColor={(l) =>
            palette ? withAlpha(palette.amber, 0.75 * linkDimFactor(l)) : "rgba(0,0,0,0)"
          }
          onNodeHover={(node) => setHover(node ?? null)}
          onNodeClick={handleNodeClick}
          onNodeDragEnd={handleDragEnd}
          onBackgroundClick={() => setHover(null)}
          onZoom={hover ? () => setViewTick((t) => t + 1) : undefined}
          onEngineStop={() => {
            if (!didFit.current) {
              didFit.current = true;
              fgRef.current?.zoomToFit(400, 60);
            }
          }}
        />
      ) : null}

      {hover && hover.kind === "project" && tooltipPos && (
        <div
          className="card pointer-events-none absolute z-20 p-3"
          style={{
            left: Math.round(tooltipPos.x + 14),
            top: Math.round(tooltipPos.y + 14),
            background: "var(--surface-raised)",
            borderColor: "var(--line-strong)",
            maxWidth: 260,
          }}
        >
          <div className="text-[13px] font-semibold leading-snug" style={{ color: "var(--ink)" }}>
            {hover.name}
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: HEALTH_VAR[hover.healthKey ?? "neutral"] }}
            />
            <span className="text-[12px]" style={{ color: "var(--ink-secondary)" }}>
              {hover.healthWord ?? "—"}
            </span>
            <span className="ml-auto font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
              {Math.round((hover.progress ?? 0) * 100)}%
            </span>
          </div>
          {hover.sublabel && (
            <div className="mt-1 font-mono text-[11px]" style={{ color: "var(--ink-muted)" }}>
              {hover.sublabel}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
