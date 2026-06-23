/** Tiny inline SVG sparkline (pure SVG — server-safe). Gold by default. */
export function Sparkline({
  data,
  className = "text-[#caa14a]",
}: {
  data: number[];
  className?: string;
}) {
  if (data.length < 2) return null;
  const w = 120;
  const h = 30;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const points = data
    .map(
      (d, i) =>
        `${(i * step).toFixed(1)},${(h - ((d - min) / range) * h).toFixed(1)}`,
    )
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={`h-7 w-full ${className}`}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
