/* Deterministic faux-QR (no Math.random → SSR-stable). Navy modules with
   municipal-red finder centres, on a white plate — reads on-brand inside cards.
   The hash/build logic lives in module-level helpers so nothing mutates or
   defines components inside the component's render scope. */
import type { ReactNode } from "react";

const N = 25;

function buildModules(value: string, cell: number): ReactNode[] {
  let h = 2166136261;
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const rng = (n: number) => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return Math.abs((h ^ (n * 2654435761)) % 1000) / 1000;
  };
  const isFinder = (x: number, y: number) =>
    (x < 7 && y < 7) || (x >= N - 7 && y < 7) || (x < 7 && y >= N - 7);
  const rects: ReactNode[] = [];
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      if (isFinder(x, y)) continue;
      if (rng(y * N + x) > 0.52)
        rects.push(
          <rect key={x + "-" + y} x={x * cell} y={y * cell} width={cell} height={cell} rx={cell * 0.18} fill="#13235c" />,
        );
    }
  return rects;
}

function finder(ox: number, oy: number, cell: number): ReactNode {
  return (
    <g key={`f-${ox}-${oy}`} transform={`translate(${ox * cell},${oy * cell})`}>
      <rect width={7 * cell} height={7 * cell} rx={cell} fill="#13235c" />
      <rect x={cell} y={cell} width={5 * cell} height={5 * cell} rx={cell * 0.7} fill="#fff" />
      <rect x={2 * cell} y={2 * cell} width={3 * cell} height={3 * cell} rx={cell * 0.5} fill="#b51d2b" />
    </g>
  );
}

export function QR({ value = "MTOP", size = 116 }: { value?: string; size?: number }) {
  const cell = size / N;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="#fff" />
      {buildModules(value, cell)}
      {finder(0, 0, cell)}
      {finder(N - 7, 0, cell)}
      {finder(0, N - 7, cell)}
    </svg>
  );
}
