/** A compact trend line for metric history. Pure SVG, theme-aware. */
export function Sparkline({ values, width = 220, height = 56 }: { values: number[]; width?: number; height?: number }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pad = 4;
  const x = (i: number) => pad + (i / (values.length - 1)) * (width - pad * 2);
  const y = (v: number) => height - pad - ((v - min) / span) * (height - pad * 2);
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`);
  const line = `M ${pts.join(" L ")}`;
  const area = `${line} L ${x(values.length - 1).toFixed(1)},${height - pad} L ${x(0).toFixed(1)},${height - pad} Z`;
  const up = values[values.length - 1] >= values[0];
  const color = up ? "var(--health-green)" : "var(--health-red)";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full" role="img" aria-label="Trend">
      <path d={area} fill={color} opacity={0.08} />
      <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={x(values.length - 1)} cy={y(values[values.length - 1])} r={3} fill={color} />
    </svg>
  );
}
