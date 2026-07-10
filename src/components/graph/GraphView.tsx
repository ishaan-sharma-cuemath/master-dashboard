"use client";

import dynamic from "next/dynamic";
import type { GraphData } from "@/lib/queries/graph";

/**
 * react-force-graph-2d touches window/canvas at module scope — it must never
 * be evaluated on the server. This wrapper is the only place that imports it,
 * behind a client-side-only dynamic() boundary.
 */
const GraphCanvas = dynamic(() => import("./GraphCanvas"), {
  ssr: false,
  loading: () => (
    <div
      className="card relative flex items-center justify-center"
      style={{ height: "calc(100vh - 260px)", minHeight: 480 }}
      aria-busy="true"
    >
      <span className="microlabel animate-pulse">Preparing graph…</span>
    </div>
  ),
});

export function GraphView({ data }: { data: GraphData }) {
  return <GraphCanvas data={data} />;
}
