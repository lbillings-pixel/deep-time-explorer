// Drawings used by more than one group of parts: the coiled shell behind every
// ammonoid, and footprints along a route.

import { circ, ell, line, n, polyline } from '../draw';
import { type PartCtx, rad } from '../part';

export function shell(c: PartCtx, ribbed: boolean): string {
  const { tone } = c;
  const base = tone(ribbed ? '#c98a5c' : '#dcc79c');
  const dark = tone(ribbed ? '#7d4a30' : '#8f6a45');
  const flesh = tone('#d98f7a');
  let out = line('M28,13Q40,14 48,22M29,10Q42,9 52,14M29,7Q44,3 54,6M27,15Q36,20 40,29M28,4Q40,-2 48,-3', flesh, 2);
  out += ell(26, 9, 9, 7.2, flesh, 'transform="rotate(20 26 9)"');
  out += circ(0, 0, 26, base);
  let marks = '';
  const step = ribbed ? 13 : 36;
  for (let a = 0; a < 360; a += step) {
    const r = rad(a);
    marks += `M${n(Math.cos(r) * 14.5)},${n(Math.sin(r) * 14.5)}L${n(Math.cos(r + 0.12) * 25.5)},${n(Math.sin(r + 0.12) * 25.5)}`;
  }
  out += line(marks, dark, ribbed ? 1.4 : 3.2, ribbed ? 'opacity=".8"' : 'opacity=".45"');
  const pts: [number, number][] = [];
  for (let th = 0; th <= 12.1; th += 0.3) {
    const r = 3 * Math.exp(0.18 * th);
    pts.push([Math.cos(th + 0.35) * r, Math.sin(th + 0.35) * r]);
  }
  out += line(polyline(pts), dark, 1.5);
  out += circ(28.5, 7.5, 2.4, tone('#f4ead0')) + circ(29, 7.5, 1.2, tone('#201a14'));
  return out;
}

/**
 * Footprints along a route. `kind` 5 is a wide five-toed sprawling trackway,
 * 3 a narrow three-toed one. Prints shrink from `s0` to `s1` along the route.
 */
export function trackway(kind: 3 | 5, pts: [number, number][], s0: number, s1: number, col: string): string {
  let toes = '';
  let pads = '';
  let total = 0;
  for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
  let walked = 0;
  let next = 0;
  let side = 1;
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]!;
    const [x1, y1] = pts[i]!;
    const seg = Math.hypot(x1 - x0, y1 - y0);
    const dx = (x1 - x0) / seg;
    const dy = (y1 - y0) / seg;
    while (next <= walked + seg) {
      const t = (next - walked) / seg;
      const s = s0 + (s1 - s0) * (next / total);
      const gauge = (kind === 5 ? 9 : 3.2) * s * side;
      const px = x0 + (x1 - x0) * t - dy * gauge;
      const py = y0 + (y1 - y0) * t + dx * gauge * 0.55;
      const ang = Math.atan2(dy, dx);
      if (kind === 5) {
        pads += circ(px, py, 2.3 * s, col);
        for (const off of [-0.75, -0.25, 0.25, 0.75]) {
          const a = ang + off + side * 0.25;
          toes += `M${n(px + Math.cos(a) * 3.2 * s)},${n(py + Math.sin(a) * 2.2 * s)}L${n(px + Math.cos(a) * 6.4 * s)},${n(py + Math.sin(a) * 4.2 * s)}`;
        }
      } else {
        for (const off of [-0.5, 0, 0.5]) {
          const a = ang + off;
          const L = (off === 0 ? 8 : 6) * s;
          toes += `M${n(px)},${n(py)}L${n(px + Math.cos(a) * L)},${n(py + Math.sin(a) * L * 0.7)}`;
        }
      }
      side = -side;
      next += (kind === 5 ? 9.5 : 21) * s;
    }
    walked += seg;
  }
  const w = (kind === 5 ? 1.5 : 2.1) * ((s0 + s1) / 2);
  return pads + line(toes, col, w);
}
