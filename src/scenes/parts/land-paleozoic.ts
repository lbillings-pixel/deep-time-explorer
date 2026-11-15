// Drawings: land animals of the Paleozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-paleozoic.ts.

import { circ, ell, line, n, path, poly } from '../draw';
import { type PartCtx, type PartDef } from '../part';
import { trackway } from './shared';

type Pt = [number, number];

/**
 * A leg: a chain of joints from the body down to the ankle, thinning as it goes,
 * with a flat foot on the ground (y = 0) pointing forward.
 */
function limb(pts: Pt[], w: number, col: string, foot: number, taper = 0.2, toe = ''): string {
  let out = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]!;
    const b = pts[i + 1]!;
    out += line(`M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`, col, w * (1 - taper * i));
  }
  const [ax, ay] = pts[pts.length - 1]!;
  const b = w * 0.36;
  out += path(`M${n(ax - b)},0L${n(ax - b)},${n(ay)}L${n(ax + b)},${n(ay - b * 0.5)}Q${n(ax + foot * 0.8)},${n(ay * 0.9)} ${n(ax + foot)},0Z`, col);
  if (toe) out += line(`M${n(ax + foot * 0.76)},-0.3l${n(-foot * 0.1)},${n(ay * 0.34)}M${n(ax + foot * 0.52)},-0.3l${n(-foot * 0.1)},${n(ay * 0.42)}`, toe, Math.max(0.6, w * 0.07), 'opacity=".6"');
  return out;
}

/** A back sail: tall spines from the back with skin between them. `x0` is the front end. */
function sail(x0: number, x1: number, yb: number, hMax: number, lean: number, count: number, pow: number) {
  const tips: Pt[] = [];
  const bases: Pt[] = [];
  let spines = '';
  let web = '';
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const bx = x0 + (x1 - x0) * t;
    const h = hMax * Math.sin(Math.PI * (0.1 + 0.8 * t)) ** pow;
    const tip: Pt = [bx + (0.5 - t) * lean, yb - h];
    const prev = tips[i - 1];
    web += prev
      ? `Q${n((prev[0] + tip[0]) / 2)},${n((prev[1] + tip[1]) / 2 + 3)} ${n(tip[0])},${n(tip[1])}`
      : `M${n(bx)},${yb}L${n(tip[0])},${n(tip[1])}`;
    spines += `M${n(bx)},${yb}L${n(tip[0])},${n(tip[1])}`;
    tips.push(tip);
    bases.push([bx, yb]);
  }
  web += `L${n(x1)},${yb}Z`;
  return { web, spines, tips, bases };
}

const eye = (c: PartCtx, x: number, y: number, r: number, iris = '#d9c66a') =>
  circ(x, y, r, c.tone(iris)) + circ(x + r * 0.15, y, r * 0.52, c.tone('#1b1c14'));

const RIPPLE = '#f4f7ee';

// ---- invertebrates ---------------------------------------------------------

function meganeura(c: PartCtx): string {
  const { tone } = c;
  const wingFill = tone('#e8f1e4');
  const vein = tone('#55664f');
  const wing = (rx: number, tx: number, ty: number) => {
    const mx = (rx + tx) / 2;
    const my = ty / 2;
    const s = ty < 0 ? -1 : 1;
    return (
      path(
        `M${rx},${s * 3}Q${n(mx + 13)},${n(my)} ${tx},${ty}Q${n(mx - 9)},${n(my + s * 4)} ${rx},${s * 3}Z`,
        wingFill,
        `opacity=".78" stroke="${vein}" stroke-width=".9"`,
      ) + line(`M${rx},${s * 3}L${tx},${ty}M${rx},${s * 3}L${n(tx + 5)},${n(ty * 0.8)}`, vein, 0.6, 'opacity=".7"')
    );
  };
  let out = wing(15, 2, -54) + wing(24, 31, -60) + wing(15, 2, 54) + wing(24, 31, 60);
  out += path('M14,-3.2L-52,-1.3L-52,1.3L14,3.2Z', tone('#3b473b'));
  out += line('M4,-3v6M-6,-2.8v5.6M-16,-2.5v5M-26,-2.2v4.4M-36,-1.9v3.8M-45,-1.6v3.2', tone('#9aa85e'), 1.3);
  out += ell(20, 0, 9, 5.6, tone('#3b473b')) + circ(32, 0, 4.6, tone('#3b473b'));
  out += circ(33.6, -3.3, 2.7, tone('#2b6a66')) + circ(33.6, 3.3, 2.7, tone('#2b6a66'));
  return out;
}

function palaeodictyopteran(c: PartCtx): string {
  const { tone } = c;
  const fill = tone('#e6d7a4');
  const band = tone('#7d5632');
  const vein = tone('#5e4426');
  const body = tone('#473829');
  const q = (a: Pt, b: Pt, d: Pt, t: number): Pt => [
    (1 - t) ** 2 * a[0] + 2 * t * (1 - t) * b[0] + t * t * d[0],
    (1 - t) ** 2 * a[1] + 2 * t * (1 - t) * b[1] + t * t * d[1],
  ];
  // One broad wing from its root on the body to its tip, with dark bands across it.
  const wing = (rx: number, tx: number, ty: number, front: number, back: number, s: number) => {
    const root: Pt = [rx, 3 * s];
    const tip: Pt = [tx, ty * s];
    const cf: Pt = [(rx + tx) / 2 + front, (ty * s) / 2];
    const cb: Pt = [(rx + tx) / 2 - back, (ty * s) / 2];
    let bands = '';
    for (const [a, b] of [
      [0.28, 0.4],
      [0.54, 0.68],
      [0.82, 0.96],
    ] as const) {
      const m = (a + b) / 2;
      bands += poly([q(root, cf, tip, a), q(root, cf, tip, m), q(root, cf, tip, b), q(root, cb, tip, b), q(root, cb, tip, m), q(root, cb, tip, a)]);
    }
    return (
      path(`M${root[0]},${root[1]}Q${n(cf[0])},${n(cf[1])} ${tip[0]},${tip[1]}Q${n(cb[0])},${n(cb[1])} ${root[0]},${root[1]}Z`, fill, `opacity=".9" stroke="${vein}" stroke-width=".8"`) +
      path(bands, band, 'opacity=".72"') +
      line(`M${root[0]},${root[1]}L${tip[0]},${tip[1]}M${root[0]},${root[1]}L${n(tip[0] - back * 0.5)},${n(tip[1] * 0.8)}`, vein, 0.6, 'opacity=".7"')
    );
  };
  let out = line('M-30,-0.8C-42,-3 -54,-8 -64,-15M-30,0.8C-42,3 -54,8 -64,15', body, 0.9);
  for (const s of [-1, 1]) out += wing(7, -7, -43, 11, 15, s) + wing(17, 25, -46, 17, 11, s);
  // The extra pair of winglets on the first body segment, in front of the wings.
  out += path('M21,-3C20,-10 28,-11 28,-3.5ZM21,3C20,10 28,11 28,3.5Z', fill, `stroke="${vein}" stroke-width=".8"`);
  out += path('M8,-3.2L-30,-1.3L-30,1.3L8,3.2Z', body);
  out += line('M0,-2.8v5.6M-8,-2.4v4.8M-16,-2v4M-24,-1.6v3.2', tone('#b08a4e'), 1.1);
  out += ell(16, 0, 9.5, 4.8, body) + circ(28.5, 0, 3.8, body);
  out += path('M31,-1.4L43,0L31,1.4Z', body);
  out += circ(30, -3, 2, tone('#8a3f2c')) + circ(30, 3, 2, tone('#8a3f2c'));
  return out;
}

function arthropleura(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#55301c');
  const mid = tone('#804c2e');
  const light = tone('#b0723f');
  let legs = '';
  let plates = '';
  const N = 24;
  for (let i = 0; i < N; i++) {
    const x = -68 + i * 5.9;
    const y = -9 + Math.sin(i * 0.55) * 1.4;
    const ry = 8.6 * Math.sqrt(Math.sin((Math.PI * (i + 1.6)) / (N + 2.2)));
    legs += `M${n(x)},${n(y + ry * 0.5)}L${n(x - 2.6)},0.5M${n(x)},${n(y - ry * 0.6)}L${n(x - 1.6)},${n(y - ry - 2.5)}`;
    plates += ell(x, y, 4.5, ry, dark) + ell(x - 0.9, y - 0.6, 3.5, ry - 1.2, mid) + ell(x - 0.9, y - ry * 0.42, 2.7, 2, light);
  }
  let out = line(legs, dark, 1.3) + plates;
  out += ell(74.5, -8.5, 5, 5.6, dark) + line('M78,-11L88,-16M78,-7L89,-7', dark, 1);
  return out;
}

function scorpion(c: PartCtx): string {
  const { tone } = c;
  const amber = tone('#b7812f');
  const dark = tone('#74501f');
  let out = line('M6,-7l-2,-6l5,-2M2,-7l-3,-6l4,-3M-2,-7l-4,-5l3,-3M-6,-7l-5,-4l2,-3', dark, 1.2);
  out += line('M13,-7L22,-12L30,-10M13,-3L23,1L31,-1', amber, 2.2);
  out += ell(32, -10.4, 4.4, 2.3, amber) + ell(33, -1, 4.4, 2.3, amber);
  out += line('M-19,-6L-27,-10L-30,-18L-26,-26L-18,-29', amber, 3.6);
  for (const [x, y] of [
    [-27, -10],
    [-30, -18],
    [-26, -26],
    [-18, -29],
  ] as const)
    out += circ(x, y, 2.3, dark);
  out += line('M-18,-29C-14,-30 -11,-27 -12,-23', dark, 1.5);
  for (let i = 0; i < 5; i++) out += ell(0.5 - i * 4.4, -5, 4.2, 5 - i * 0.5, i % 2 ? amber : dark);
  out += ell(8, -5, 7, 4.8, amber);
  out += line('M6,-3l-2,6l5,3M2,-3l-3,6l4,3M-2,-3l-4,6l3,3M-6,-3l-5,5l2,4', dark, 1.3);
  out += circ(11, -6.5, 0.9, tone('#2a1c0c'));
  return out;
}

function trigonotarbid(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#4a2f1e');
  const mid = tone('#7c5134');
  const light = tone('#ad7d4c');
  // Eight legs: the four far ones first, darker, then the body, then the near four.
  let out = line('M17,-10L25,-17.5L32,-2M14,-10L18,-19L23,-2M11,-10L5,-19L-3,-2M8,-10L-7,-18.5L-23,-2', dark, 1.2);
  out += ell(-9, -9, 14.5, 8, dark) + ell(-9.6, -9.7, 12.8, 6.7, mid);
  // The plates of the abdomen.
  out += line('M-18,-14.6C-16.4,-10.5 -16.4,-7.5 -18,-4M-13,-16C-11.4,-11 -11.4,-7.5 -13,-3.2M-8,-16.3C-6.4,-11 -6.4,-7.5 -8,-3M-3,-15.6C-1.4,-11 -1.4,-7.5 -3,-3.4M1.6,-13.6C2.8,-10.5 2.8,-8 1.6,-5', dark, 1);
  out += ell(-9.5, -13.6, 9, 1.7, light, 'opacity=".65"');
  out += path('M3,-15.2C11,-15.8 19,-12.4 22.5,-8.2C19,-4.4 11,-2.4 3,-2.9C1,-7 1,-11 3,-15.2Z', mid);
  out += path('M4.5,-14.2C11,-14.6 17,-12 20,-9.2C14,-11.6 9,-12.4 4.5,-12.2Z', light, 'opacity=".7"');
  out += line('M20,-7L26.5,-8L28.5,-4', mid, 1.7);
  out += line('M15,-6L23,-13L30,0M12,-5.5L16,-14.5L20,0M9,-5.5L3,-14.5L-4,0M6,-6L-9,-14L-24,0', tone('#93663e'), 1.4);
  out += circ(17.6, -9.6, 0.9, tone('#150d07')) + circ(15.2, -11, 0.8, tone('#150d07'));
  return out;
}

function roachoid(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#472a17');
  const body = tone('#6e4426');
  const wing = tone('#93633a');
  // Seen from a little above: far legs and antennae, the flat body, then near legs.
  let out = line('M2,-12L8,-16.5L11,-17M-8,-13L-12,-18L-15,-18.5M-16,-12L-27,-16.5L-31,-16', dark, 1.2);
  out += line('M12,-8C21,-19 30,-19.5 35,-13M12,-6C24,-10.5 31,-7 34,-1.5', dark, 0.8);
  out += ell(-10, -7, 20.5, 6.6, dark);
  out += path('M0,-13.2C-12,-14.2 -26,-12 -31,-7C-26,-2.4 -12,-0.8 0,-1.4Z', wing);
  out += line('M0,-7.4L-30,-7M-2,-11C-12,-11.6 -22,-10 -28,-8M-2,-3.8C-12,-3 -22,-4 -28,-6', dark, 0.7, 'opacity=".75"');
  if (c.detail) out += line('M-6,-12.6L-10,-8M-14,-12.6L-18,-8M-21,-11.4L-24,-8M-6,-2L-10,-6.6M-14,-1.8L-18,-6.6M-21,-2.8L-24,-6.4', dark, 0.5, 'opacity=".6"');
  out += line('M-2,-12C-12,-12.8 -22,-11.4 -27,-9', tone('#c69a62'), 0.9, 'opacity=".6"');
  out += ell(4, -7.3, 7.2, 6.4, tone('#aa7d46')) + ell(4.6, -7.3, 4.4, 3.9, body);
  out += ell(11.6, -6.8, 2.6, 3, dark);
  out += line('M4,-2.5L9,0L13,-0.4M-4,-1.8L-7,0L-11,-0.3M-12,-2L-22,-0.6L-28,-0.2', dark, 1.3);
  return out;
}

// ---- the first four-legged animals and the amphibians ----------------------

function tiktaalik(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#6c6b45');
  const dark = tone('#42452b');
  const mid = tone('#585a38');
  const pale = tone('#cfc694');
  // The water line is y = 0. The hind half lies under water as a dim shape.
  let out = path('M50,0C34,10 -50,11 -97,3L-97,0Z', dark, 'opacity=".28"');
  out += path('M57,-9C63,-6 68,-2.5 70,0L59,0C57,-3 56,-6 57,-9Z', dark);
  // Head, neck and shoulders raised out of the shallows.
  out += path('M-26,0C-6,-12 18,-22.5 40,-24.5C46,-25 50,-23.5 54,-22.5C57,-26.5 63.5,-27 66.5,-23C75,-20.5 84,-15.5 90,-10.5C92,-8.6 91,-6 88,-5.5C77,-4.4 67,-4.4 59,-5.5C53,-4 49,-2 46,0Z', skin);
  out += path('M88,-5.5C77,-4.4 67,-4.4 59,-5.5C53,-4 49,-2 46,0L20,0C34,-4.5 46,-8.5 59,-9.5C69,-9.6 79,-9 90,-8.4Z', pale);
  out += line('M90.5,-9.2C81,-9 71,-9 61,-10.6', dark, 0.9);
  let scales = '';
  for (let x = -14; x < 44; x += 5.5) {
    const y = -24.5 * Math.sin(((x + 26) / 70) * 1.45);
    for (const dy of [4.5, 9, 13.5]) if (y + dy < -2.5) scales += `M${n(x)},${n(y + dy)}q2.4,-2.6 4.8,0`;
  }
  if (c.detail) out += line(scales, dark, 0.7, 'opacity=".55"');
  out += ell(8, -14.5, 7, 2.4, dark, 'opacity=".4"') + ell(30, -20.5, 6, 2, dark, 'opacity=".4"') + ell(74, -17, 5, 1.6, dark, 'opacity=".4"');
  // The sturdy front fin, propping up the chest.
  out += path('M35,-14.5C41,-16 48,-13 52,-7C54.5,-3.5 55.5,-1.5 55.5,0L41,0C40,-5 37,-10 35,-14.5Z', mid);
  out += line('M47,-8.5L51.5,0M43.5,-8.5L46.5,0', dark, 0.8, 'opacity=".7"');
  out += eye(c, 61.5, -24.2, 2.5);
  out += circ(87.5, -11.6, 0.8, dark);
  // The tail fin breaks the surface behind.
  out += path('M-58,0C-66,-7.5 -81,-9.5 -95,-2L-97,0Z', skin);
  out += line('M-66,-4.2L-69,0M-74,-6.4L-77,0M-82,-6L-85,0M-89,-3.8L-91,0', dark, 0.8, 'opacity=".6"');
  out += line('M-116,3h52M-44,4.5h72M50,3h58M-84,8.5h44M8,9.5h62', tone(RIPPLE), 1.2, 'opacity=".5"');
  return out;
}

function ichthyostega(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#5f6c52');
  const dark = tone('#3a4533');
  const mid = tone('#4d5a43');
  const belly = tone('#c8c697');
  // The fish-like tail fin, above and below the tail.
  let out = path('M-40,-30C-58,-35 -82,-28 -100,-10C-88,0 -66,-0.5 -50,-6Z', tone('#858b5f'));
  if (c.detail) out += line('M-52,-32L-49,-24M-62,-31L-58,-21M-72,-27.5L-68,-18M-82,-22L-78,-14M-91,-15.5L-88,-10M-62,-2.4L-61,-8M-74,-2.2L-73,-8M-86,-4.6L-85,-8.6', dark, 0.8, 'opacity=".55"');
  out += limb([[42, -15], [51, -9], [50, -3]], 7, dark, 10);
  out += path('M-24,-14C-30,-10 -40,-5 -47,-2L-46,0L-28,0C-23,-3 -20,-8 -24,-14Z', dark);
  out += path(
    'M-97,-9C-78,-13 -60,-20 -44,-28C-24,-38 4,-42 26,-40C38,-39 46,-36 52,-33C57,-36.5 63,-36.5 66,-32.5C76,-30 86,-25 91,-20C94,-17 94,-13 90,-11C78,-9 64,-8 52,-9C42,-5 20,-4 -4,-5C-24,-6 -40,-8 -52,-8C-68,-7 -82,-7 -97,-9Z',
    skin,
  );
  out += path('M90,-11C78,-9 64,-8 52,-9C42,-5 20,-4 -4,-5C-24,-6 -40,-8 -52,-8C-68,-7 -82,-7 -97,-9C-76,-10.5 -56,-13.5 -36,-14.5C-6,-15.5 30,-14.5 52,-14C66,-13.6 80,-13.6 90,-11Z', belly);
  out += line('M-40,-29.4C-24,-37 4,-41 26,-39C38,-38 46,-35 52,-32', tone('#8a9770'), 1.3, 'opacity=".7"');
  let spots = '';
  for (const [x, y] of [[-58, -17], [-44, -22], [-30, -28], [-14, -33], [2, -35], [18, -34], [34, -32], [-22, -22], [-4, -26], [12, -26], [28, -24], [44, -27], [74, -24]] as const)
    spots += ell(x, y, 3.4, 1.9, dark, 'opacity=".45"');
  out += spots;
  out += line('M93,-15.6C82,-13.6 68,-13.2 56,-15.6', dark, 1);
  out += circ(90, -19.6, 0.9, dark) + eye(c, 61.5, -33, 2.6);
  // Near legs: a propping front leg, and a paddle-like hind leg turned backward.
  out += limb([[30, -20], [21, -11], [29, -3]], 8.5, mid, 12, 0.2, dark);
  out += line('M-40,-19L-32,-11', mid, 9);
  out += path('M-28,-15C-35,-11 -52,-6.5 -61,-2.5L-59,0L-38,0C-31,-3.5 -26,-9 -28,-15Z', mid);
  if (c.detail) out += line('M-58,-1.6L-47,-6M-52,-0.6L-43,-4.6M-45,-0.4L-38,-4.2', dark, 0.8, 'opacity=".7"');
  return out;
}

function amphibian(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#716c3e');
  const dark = tone('#44452a');
  const mid = tone('#5b5933');
  const belly = tone('#ccc28d');
  // An Eryops-type temnospondyl: far legs, the heavy body, then the near legs.
  let out = limb([[44, -17], [56, -10], [54, -3.4]], 8.5, dark, 12) + limb([[-30, -17], [-19, -10], [-23, -3.6]], 9.5, dark, 13);
  out += path(
    'M-97,-11C-82,-16 -62,-25 -44,-31C-28,-38 0,-41 22,-39C36,-38 46,-35 54,-33C58,-37 64.5,-37.5 68,-33C80,-31 92,-27 99,-22C103,-19 103,-13 98,-11C84,-8 68,-7 54,-7C40,-4 10,-3 -20,-5C-40,-7 -52,-8 -62,-7C-76,-5 -88,-3.4 -95,-4.6C-99,-5.6 -100,-9.4 -97,-11Z',
    skin,
  );
  out += path('M98,-11C84,-8 68,-7 54,-7C40,-4 10,-3 -20,-5C-40,-7 -52,-8 -62,-7C-76,-5 -88,-3.4 -95,-4.6C-80,-9 -60,-13 -40,-14C-10,-15 30,-13.4 54,-13C70,-12.8 86,-13.6 98,-11Z', belly);
  out += line('M-44,-30.4C-28,-37.2 0,-40.2 22,-38.2C36,-37.2 46,-34.2 54,-32.2', tone('#989458'), 1.5, 'opacity=".7"');
  for (const [x, y, rx, ry] of [[-62, -19, 8, 2.8], [-80, -12, 6, 2], [-32, -27, 8, 3.4], [-8, -33, 9, 3.4], [18, -33, 8, 3.2], [-18, -22, 6, 2.4], [6, -23, 7, 2.6], [40, -29, 6, 2.6], [80, -25, 6, 1.8]] as const)
    out += ell(x, y, rx, ry, dark, 'opacity=".45"');
  out += line('M101.5,-16C88,-13.6 72,-13 57,-15.6', dark, 1.1);
  if (c.detail) out += line('M97,-15.2v1.7M92,-14.4v1.7M87,-13.8v1.7M82,-13.4v1.7M77,-13.2v1.7M72,-13.2v1.7M67,-13.6v1.7', tone('#efe8cc'), 0.8);
  out += circ(97.6, -21.6, 1, dark) + eye(c, 63, -34.2, 3);
  out += limb([[30, -21], [18, -11.5], [29, -3.8]], 9.5, mid, 13, 0.2, dark);
  out += limb([[-44, -21], [-30, -11.5], [-41, -4]], 10.5, mid, 14, 0.2, dark);
  return out;
}

function diplocaulus(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#7b7547');
  const dark = tone('#4c492b');
  const mid = tone('#666238');
  const light = tone('#b7af76');
  // Lying at the surface, seen from a little above: the far horn of the head is the upper one.
  let out = line('M38,-21L43,-26L48,-27M-10,-19L-15,-24L-10,-26.5', dark, 3);
  out += path('M52,-21.5C30,-23.5 6,-22 -14,-19C-40,-16 -60,-14.5 -79,-13C-60,-11 -40,-9 -14,-9C6,-9 30,-10 52,-11Z', skin);
  out += path('M-20,-18C-40,-19 -62,-16.5 -79,-13C-60,-13.6 -40,-14 -20,-14.4Z', mid);
  out += line('M46,-16.5C20,-17 -20,-14.6 -76,-13', dark, 1.5, 'opacity=".5"');
  out += line('M36,-10.5L41,-5L47,-3.5M-12,-9.5L-17,-4.5L-11,-2.5', mid, 3.2);
  out += path('M76,-16C72,-23.5 56,-29.5 32,-34.5C40,-28 46,-23 49,-20L49,-12.5C46,-8 40,-4 27,-0.5C54,-3 72,-9 76,-16Z', skin);
  out += path('M76,-16C72,-9 54,-3 27,-0.5C50,-5.5 65,-10.5 70,-16Z', light, 'opacity=".75"');
  out += path('M70,-17C62,-24 48,-28.5 32,-34.5C46,-27 56,-22.5 62,-17Z', dark, 'opacity=".35"');
  if (c.detail) out += line('M34,-20h6M22,-19.6h7M8,-19h7M-8,-17.4h7M30,-12.4h7M14,-12h7M-2,-11.6h7', dark, 1.6, 'opacity=".4"');
  out += eye(c, 65, -19.4, 1.8) + eye(c, 64, -13.2, 2);
  out += line('M-100,2h48M-30,3.5h64M52,2.5h46M-70,-30h34M-96,-21h22M56,-37h30', tone(RIPPLE), 1.2, 'opacity=".5"');
  out += line('M-62,-12.6h-20M-40,-9h-24', tone(RIPPLE), 1, 'opacity=".45"');
  return out;
}

// ---- reptiles ---------------------------------------------------------------

function hylonomus(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#7c6641');
  const dark = tone('#4d3e26');
  const pale = tone('#d8ca98');
  let out = limb([[26, -7], [30.5, -4], [31, -1.4]], 2.8, dark, 5) + limb([[-5, -7], [1.5, -4], [-0.5, -1.5]], 3.1, dark, 6);
  out += path(
    'M-50,-2C-38,-3.5 -24,-8 -13,-12C-2,-15 12,-16 22,-15C27,-16 31,-18 35,-18.4C40,-18.8 44,-16 45.5,-12.6C45.6,-10.8 42,-9.6 36,-9.6C30,-8 24,-6 18,-5.5C8,-4 -4,-4 -12,-5.5C-24,-4 -38,-1.2 -50,-2Z',
    skin,
  );
  out += path('M45.4,-11.6C44,-10 41,-9.6 36,-9.6C30,-8 24,-6 18,-5.5C8,-4 -4,-4 -12,-5.5C-24,-4 -38,-1.2 -50,-2C-36,-3.6 -24,-6.4 -12,-8C0,-9 14,-9 24,-10C32,-11 39,-12 45.4,-11.6Z', pale);
  out += line('M-36,-4.6C-22,-9.6 -6,-13.6 10,-14.2C20,-14.2 28,-15.4 35,-16.6', pale, 0.9, 'opacity=".7"');
  if (c.detail) out += line('M-28,-7.6l-2,-1.2M-18,-10.8l-2,-1.4M-8,-13.4l-2,-1.4M2,-14.8l-2,-1.4M12,-15.4l-2,-1.2M22,-15l-2,-1.4', dark, 1.5, 'opacity=".5"');
  out += line('M45.4,-11.8C42.6,-11.2 39.6,-11.4 37,-12.2', dark, 0.6);
  out += eye(c, 39.2, -15, 1.4, '#c9b25a');
  out += limb([[20, -9], [14.5, -4.2], [21, -1.5]], 3.2, tone('#655233'), 6) + limb([[-12, -9.5], [-4.5, -4.6], [-11, -1.6]], 3.6, tone('#655233'), 7);
  return out;
}

function pareiasaur(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#86725b');
  const dark = tone('#54473a');
  const mid = tone('#6c5c4a');
  const light = tone('#ad9a7e');
  let out = limb([[60, -40], [64, -24], [66, -8.5]], 19, dark, 20, 0.1) + limb([[-36, -42], [-28, -26], [-32, -8.5]], 20, dark, 20, 0.1);
  // Knobs along the spine break the outline of the back.
  const yBack = (x: number) => -95.5 + 0.0042 * (x - 8) ** 2;
  let ridge = '';
  let knobs = '';
  const knob = (x: number, y: number, r: number) => `M${n(x - r)},${n(y)}a${r},${r} 0 1,0 ${2 * r},0a${r},${r} 0 1,0 ${-2 * r},0`;
  for (let x = -66; x <= 54; x += 10) {
    ridge += knob(x, yBack(x) + 1.5, 3);
    knobs += knob(x + 5, yBack(x + 5) + 9, 2.3) + knob(x, yBack(x) + 19, 2.1);
    if (x > -50 && x < 40) knobs += knob(x + 5, yBack(x + 5) + 30, 1.9);
  }
  out += path(ridge, hide);
  out += path(
    'M-98,-40C-92,-56 -80,-68 -64,-78C-40,-90 0,-96 30,-94C44,-94 54,-90 62,-84C70,-85 80,-83 88,-77C94,-72 100,-66 100,-58C100,-53 96,-50 90,-50C84,-48 76,-46 70,-48C66,-44 62,-40 56,-36C30,-26 -20,-26 -48,-34C-60,-38 -70,-42 -78,-46C-86,-46 -93,-44 -98,-40Z',
    hide,
  );
  out += path('M56,-36C30,-26 -20,-26 -48,-34C-60,-38 -70,-42 -78,-46C-56,-46 -28,-42 0,-41C24,-40 44,-43 58,-48Z', light, 'opacity=".55"');
  out += path(knobs, light, 'opacity=".8"');
  // Head: cheek flange with a spiky edge, knobs on the snout and chin.
  out += path('M63,-76C58,-66 57,-54 61,-41L67,-49L71,-41L76,-51C75,-61 70,-70 63,-76Z', mid);
  out += path('M86,-50l-2,6.5l-4,-5.5ZM78,-48l-1,5l-4,-4.6Z', mid);
  out += circ(94, -73, 2.6, light) + circ(86, -79, 2.2, light) + circ(76, -83.4, 2, light) + circ(98.6, -64, 1.8, light);
  out += line('M100,-56C94,-55 87,-55.6 81,-58', dark, 1.2);
  out += circ(97.4, -67.4, 1, dark) + eye(c, 79, -71, 2.4, '#c9a85a');
  out += limb([[46, -50], [40, -29], [45, -9.5]], 22, mid, 23, 0.1, dark) + limb([[-54, -54], [-45, -31], [-52, -9.5]], 23, mid, 23, 0.1, dark);
  return out;
}

// ---- synapsids (the mammal line) -------------------------------------------

function dimetrodon(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8a6a48');
  const dark = tone('#55402b');
  const mid = tone('#705539');
  const belly = tone('#d2bb8c');
  let out = limb([[60, -30], [69, -18], [72, -5]], 9, dark, 12) + limb([[-16, -32], [-4, -20], [-10, -5]], 10, dark, 13);
  const s = sail(56, -36, -48, 80, 26, 18, 0.7);
  out += path(s.web, tone('#b9794c'));
  out += path(sail(56, -36, -48, 46, 15, 18, 0.7).web, tone('#8f5536'), 'opacity=".7"');
  out += line(s.spines, tone('#5c3826'), 1.1, 'opacity=".8"');
  out += path(
    'M-110,-14C-85,-20 -60,-34 -36,-46C-15,-52 20,-54 48,-52C56,-54 62,-60 70,-62C84,-64.5 98,-60 106,-52C110,-48 110.5,-42 107,-39C108,-34 104,-30 98,-29C88,-27 78,-27 70,-30C60,-26 50,-22 40,-20C20,-16 -10,-16 -28,-20C-40,-22 -50,-22 -60,-20C-80,-16 -96,-13 -110,-14Z',
    hide,
  );
  out += path('M98,-29C88,-27 78,-27 70,-30C60,-26 50,-22 40,-20C20,-16 -10,-16 -28,-20C-40,-22 -50,-22 -60,-20C-80,-16 -96,-13 -110,-14C-90,-18 -64,-26 -40,-28C-10,-29 30,-28 50,-31C60,-33 68,-34 74,-34.6C84,-33.6 92,-32.4 100,-33Z', belly);
  if (c.detail) out += line('M-70,-28l4,7M-56,-35l4,7M-42,-42l4,8M-26,-47l3,9M-8,-50l2,9M10,-51.6l1,9M28,-52l0,9M44,-51l-1,8', dark, 2.2, 'opacity=".35"');
  // The deep skull, with long teeth at the front of the jaw.
  out += line('M108,-40.6C98,-37.6 86,-37 74,-39.6', dark, 1.1);
  out += path('M103.5,-39.6l-1.4,6.4l-2.2,-5.8ZM98,-38.6l-1.5,7.4l-2.4,-6.8ZM92,-37.8l-1,3.8l-1.7,-3.5ZM87,-37.4l-1,3.2l-1.5,-3ZM82,-37.6l-1,3l-1.4,-2.8Z', tone('#efe6c8'));
  out += circ(105.4, -48.6, 1.1, dark) + eye(c, 84, -54, 2.7);
  out += line('M77,-59C82,-60.4 88,-59.4 91,-56', dark, 1, 'opacity=".5"');
  // Near legs, sprawled out to the side.
  out += limb([[46, -36], [35, -20], [48, -5.5]], 11, mid, 14, 0.2, dark) + limb([[-30, -38], [-15, -22], [-28, -5.5]], 12, mid, 15, 0.2, dark);
  return out;
}

function edaphosaurus(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#6f7354');
  const dark = tone('#454a36');
  const mid = tone('#5a5f45');
  const belly = tone('#c9c79a');
  let out = limb([[62, -24], [71, -14], [73, -4.5]], 8.5, dark, 11) + limb([[-12, -20], [-2, -12], [-6, -4.5]], 9, dark, 11);
  const s = sail(60, -38, -45, 72, 14, 15, 0.55);
  out += path(s.web, tone('#c2b684'));
  out += path(sail(60, -38, -45, 40, 8, 15, 0.55).web, tone('#8f9a66'), 'opacity=".6"');
  out += line(s.spines, tone('#4b4a30'), 1.7);
  // Short crossbars on every spine: the mark of Edaphosaurus.
  let bars = '';
  s.tips.forEach((tip, i) => {
    const base = s.bases[i]!;
    for (const f of [0.3, 0.45, 0.6, 0.75, 0.9]) {
      const w = 3.4 - f * 1.4;
      bars += `M${n(base[0] + (tip[0] - base[0]) * f - w)},${n(base[1] + (tip[1] - base[1]) * f)}h${n(w * 2)}`;
    }
  });
  out += line(bars, tone('#4b4a30'), 1.3);
  out += path(
    'M-105,-10C-84,-14 -62,-28 -40,-42C-20,-50 20,-54 46,-50C56,-50 64,-50 72,-48C80,-50.5 90,-47.5 95,-42C98,-39 97,-35.4 93,-34.4C86,-32.6 78,-32.6 72,-34.6C64,-25 56,-16 44,-12C20,-7.5 -14,-7.5 -34,-12C-46,-14 -56,-14.6 -64,-13C-80,-10 -94,-8 -105,-10Z',
    hide,
  );
  out += path('M72,-34.6C64,-25 56,-16 44,-12C20,-7.5 -14,-7.5 -34,-12C-46,-14 -56,-14.6 -64,-13C-80,-10 -94,-8 -105,-10C-84,-13 -62,-20 -40,-22C-10,-23 28,-23 46,-27C56,-30 64,-33 72,-34.6Z', belly);
  let spots = '';
  for (const [x, y] of [[-62, -22], [-44, -32], [-26, -38], [-8, -42], [10, -44], [28, -44], [46, -42], [-34, -28], [-16, -32], [2, -34], [20, -35], [38, -34], [56, -40]] as const)
    spots += ell(x, y, 3.6, 2.2, dark, 'opacity=".4"');
  out += spots;
  out += line('M96,-38.4C90,-37 84,-37 78,-38.6', dark, 0.9);
  out += circ(94, -41.4, 0.8, dark) + eye(c, 85.6, -43.4, 2.1);
  out += limb([[44, -28], [33, -15], [44, -4.8]], 10, mid, 13, 0.2, dark) + limb([[-32, -30], [-18, -16], [-30, -5]], 11, mid, 14, 0.2, dark);
  return out;
}

function moschops(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8c7b63');
  const dark = tone('#584c3d');
  const mid = tone('#73644f');
  const light = tone('#c6b796');
  let out = limb([[64, -46], [67, -28], [69, -8]], 18, dark, 20, 0.1) + limb([[-40, -42], [-31, -26], [-36, -8]], 18, dark, 20, 0.1);
  // High shoulders, a back that slopes down to the hips, a short tail.
  out += path(
    'M-93,-41C-95,-53 -86,-64 -68,-70C-42,-79 -10,-92 20,-103C32,-107 44,-107 52,-102C56,-101 60,-102 64,-104C72,-109.5 84,-109 92,-102C98,-96 100,-86 99,-78C98,-71 95,-66 90,-64C84,-62 76,-62 70,-64C66,-54 62,-44 56,-38C32,-28 -20,-28 -46,-34C-58,-37 -66,-39 -72,-40C-78,-35 -89,-34 -93,-41Z',
    hide,
  );
  out += path('M56,-38C32,-28 -20,-28 -46,-34C-58,-37 -66,-39 -72,-40C-58,-46 -30,-44 0,-43C24,-42 46,-46 64,-54Z', light, 'opacity=".6"');
  out += path('M-66,-70C-42,-79 -10,-92 20,-102.4C32,-106.4 44,-106.4 52,-101.4C40,-101.6 28,-98.6 14,-93.6C-12,-84 -40,-74 -66,-70Z', dark, 'opacity=".3"');
  // The thick, domed skull roof and the short, deep muzzle.
  out += path('M64,-104C72,-109.5 84,-109 92,-102C84,-105.4 74,-105 66,-100.6Z', light, 'opacity=".65"');
  out += path('M99,-76C94,-73 87,-72.6 80,-75C76,-70 72,-66 70,-64C76,-62 84,-62 90,-64C95,-66 98,-71 99,-76Z', light, 'opacity=".5"');
  out += line('M99,-76C94,-73 87,-72.6 80,-75', dark, 1.3);
  out += circ(96.6, -87, 1.3, dark) + eye(c, 83, -92.4, 2.6, '#c9a85a');
  out += line('M76,-97.4C80,-99 86,-98 89,-94.6', dark, 1.1, 'opacity=".5"');
  if (c.detail) out += line('M58,-99C54,-88 53,-76 56,-64M-50,-68C-57,-60 -61,-52 -61,-44', dark, 1.2, 'opacity=".35"');
  out += limb([[48, -62], [41, -36], [47, -9.5]], 21, mid, 24, 0.1, dark) + limb([[-58, -52], [-47, -30], [-55, -9.5]], 21, mid, 24, 0.1, dark);
  return out;
}

function gorgonopsian(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#a2865c');
  const dark = tone('#65503a');
  const mid = tone('#85694a');
  const belly = tone('#decba2');
  let out = limb([[58, -48], [63, -28], [67, -5.5]], 12, dark, 16, 0.12) + limb([[-30, -50], [-18, -32], [-26, -5.5]], 13, dark, 17, 0.12);
  out += path(
    'M-102,-36C-86,-44 -70,-58 -54,-68C-30,-76 10,-80 36,-80C46,-82 54,-86 62,-88C74,-92.5 90,-88 98,-80C102,-76 103,-70 100,-66C99,-61 96,-57 92,-56C82,-56 72,-58 64,-62C60,-56 56,-50 50,-46C30,-40 -10,-40 -34,-46C-44,-48 -54,-50 -62,-50C-78,-44 -92,-37 -102,-36Z',
    hide,
  );
  out += path('M92,-56C82,-56 72,-58 64,-62C60,-56 56,-50 50,-46C30,-40 -10,-40 -34,-46C-44,-48 -54,-50 -62,-50C-78,-44 -92,-37 -102,-36C-84,-42 -66,-52 -48,-54C-20,-56 24,-54 46,-58C54,-60 60,-63 66,-65C76,-63.6 86,-63.4 97,-62Z', belly);
  if (c.detail) out += line('M-66,-58l5,7M-52,-66l4,8M-36,-71.6l3,9M-18,-75l2,9M0,-77.6l1,9M18,-79l0,9M36,-79.4l-1,9M52,-84l-2,8', dark, 2.4, 'opacity=".3"');
  // Long, deep snout with a sabre tooth.
  out += line('M100.6,-67.4C90,-65.6 78,-65.6 67,-68.4', dark, 1.1);
  out += path('M92,-66.4L90.2,-52.6L87.4,-66Z', tone('#f0e8cc'));
  if (c.detail) out += line('M98,-66.6v2.4M95.4,-66.2v2.4M83,-65.4v1.8M79,-65.6v1.8M75,-66v1.8', tone('#f0e8cc'), 0.9);
  out += circ(99.4, -76.4, 1.1, dark) + eye(c, 75.6, -80, 2.4, '#c9a85a');
  out += line('M69,-85C73,-86.4 79,-85.6 82,-82.6', dark, 1, 'opacity=".5"');
  // Long legs, the hind pair held partly under the body.
  out += limb([[46, -56], [38, -32], [45, -6.5]], 14.5, mid, 19, 0.12, dark) + limb([[-46, -58], [-32, -35], [-43, -7]], 16, mid, 20, 0.12, dark);
  return out;
}

function dicynodont(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#97816a');
  const dark = tone('#5f4f3e');
  const mid = tone('#7b6855');
  const belly = tone('#cfbd9e');
  let out = limb([[46, -22], [51, -13], [52, -6]], 12, dark, 15, 0.1) + limb([[-30, -24], [-23, -14], [-27, -6]], 13, dark, 15, 0.1);
  out += path(
    'M-75,-28C-73,-42 -64,-54 -52,-59C-30,-66 5,-68 26,-64C34,-66 42,-67 50,-65C60,-63 68,-56 72,-47C75,-40 76,-33 72,-29C67,-28 63,-30 59,-32C56,-27 51,-24 45,-24C41,-20 36,-17 30,-15C10,-10 -24,-10 -44,-15C-54,-18 -62,-23 -68,-26C-70,-26 -73,-27 -75,-28Z',
    hide,
  );
  out += path('M45,-24C41,-20 36,-17 30,-15C10,-10 -24,-10 -44,-15C-54,-18 -62,-23 -68,-26C-50,-29 -26,-25 -4,-24C16,-23.4 32,-26 46,-32Z', belly, 'opacity=".8"');
  // Horny beak, and one of the two tusks (the other shows behind it).
  out += path('M71,-48C74,-41 75.8,-34 72,-29C68,-28.2 64,-29.6 61,-31.4C66,-34 70,-40 71,-48Z', tone('#6a5843'));
  out += path('M52.6,-37L56.4,-25.4L57.6,-36.4Z', tone('#c9bf9f'));
  out += path('M58,-38.4L62.8,-22L64.2,-37.2Z', tone('#f0e8cc'));
  out += line('M72,-29.8C66,-30.6 60,-33.6 55,-38', dark, 1);
  out += circ(70, -45.6, 1.1, tone('#2e2419')) + eye(c, 57, -51.6, 2.4, '#c9a85a');
  out += line('M50,-56.6C54,-58 59,-57 62,-54', dark, 1, 'opacity=".5"');
  if (c.detail) out += line('M30,-61C26,-51 26,-41 29,-33M-46,-55C-52,-47 -54,-39 -54,-31', dark, 1.1, 'opacity=".35"');
  out += limb([[34, -30], [27, -16], [33, -7]], 14.5, mid, 17, 0.1, dark) + limb([[-46, -32], [-37, -18], [-44, -7.2]], 15.5, mid, 17, 0.1, dark);
  return out;
}

function cynodont(c: PartCtx): string {
  const { tone } = c;
  const fur = tone('#8d7558');
  const dark = tone('#564634');
  const mid = tone('#75604a');
  const belly = tone('#dacaa9');
  let out = limb([[31, -14], [35.5, -8], [35.5, -2.4]], 5, dark, 6) + limb([[-11, -14], [-4, -9], [-8, -2.5]], 5.5, dark, 7);
  out += path(
    'M-50,-7C-40,-10 -30,-19 -20,-24C-8,-29 10,-30 22,-28C27,-29 30,-32 34,-33C40,-35 46,-32 49,-27C51,-24 51,-21 49,-19.5C45,-18 40,-18 34,-19C31,-15 27,-13 22,-12C10,-9 -8,-9 -18,-12C-26,-13 -32,-11 -38,-9C-42,-7 -46,-6 -50,-7Z',
    fur,
  );
  out += path('M49,-19.5C45,-18 40,-18 34,-19C31,-15 27,-13 22,-12C10,-9 -8,-9 -18,-12C-26,-13 -32,-11 -38,-9C-42,-7 -46,-6 -50,-7C-40,-9 -30,-14 -18,-15.6C-4,-16.4 14,-15.6 24,-17.6C30,-19 34,-21 38,-22C42,-21.4 46,-21.4 50,-22Z', belly);
  // A light hint of fur along the back, and whiskers.
  if (c.detail) {
    out += line('M-22,-19l-2.4,1.4M-14,-22.6l-2.4,1.4M-6,-25l-2.4,1.3M2,-26.2l-2.4,1.2M10,-26.6l-2.4,1.2M18,-26l-2.4,1.2M26,-25.4l-2.4,1.2M-10,-18.6l-2.4,1.3M0,-20.4l-2.4,1.2M10,-20.8l-2.4,1.2M20,-20.6l-2.4,1.2M33,-29l-2.2,1.2M40,-31.6l-2,1', dark, 0.6, 'opacity=".4"');
    out += line('M47,-23.4L56,-26.4M47.4,-22.4L57.4,-22.2M47,-21.6L55.6,-18.2', dark, 0.4, 'opacity=".7"');
  }
  out += line('M50.4,-21.6C46.6,-20.6 42.6,-20.8 39,-22.2', dark, 0.7);
  out += circ(50, -24.4, 1.1, tone('#2e2419')) + eye(c, 40.4, -28.4, 1.6, '#b8934a');
  out += limb([[24, -17], [19.5, -9], [25, -2.6]], 5.8, mid, 7, 0.2, dark) + limb([[-20, -18], [-12, -10], [-19, -2.8]], 6.4, mid, 8, 0.2, dark);
  return out;
}

const sampleTrack = (c: PartCtx) =>
  trackway(
    5,
    [
      [-70, 0],
      [70, -4],
    ],
    1.4,
    1.4,
    c.tone('#9a6b3a'),
  );

export const PARTS: Record<string, PartDef> = {
  meganeura: { role: 'flyer', w: 110, h: 130, anchor: 'center', draw: meganeura },
  palaeodictyopteran: { role: 'flyer', w: 108, h: 94, anchor: 'center', draw: palaeodictyopteran },
  arthropleura: { role: 'crawler', w: 175, h: 30, anchor: 'base', draw: arthropleura },
  scorpion: { role: 'crawler', w: 76, h: 40, anchor: 'base', draw: scorpion },
  trigonotarbid: { role: 'crawler', w: 60, h: 22, anchor: 'base', draw: trigonotarbid },
  roachoid: { role: 'crawler', w: 68, h: 20, anchor: 'base', draw: roachoid },
  tiktaalik: { role: 'shore', w: 190, h: 28, anchor: 'base', afloat: true, draw: tiktaalik },
  ichthyostega: { role: 'shore', w: 194, h: 44, anchor: 'base', draw: ichthyostega },
  amphibian: { role: 'shore', w: 204, h: 42, anchor: 'base', draw: amphibian },
  diplocaulus: { role: 'shore', w: 156, h: 36, anchor: 'base', afloat: true, draw: diplocaulus },
  hylonomus: { role: 'critter', w: 96, h: 20, anchor: 'base', draw: hylonomus },
  pareiasaur: { role: 'walker', w: 200, h: 100, anchor: 'base', draw: pareiasaur },
  dimetrodon: { role: 'walker', w: 220, h: 130, anchor: 'base', draw: dimetrodon },
  edaphosaurus: { role: 'walker', w: 204, h: 118, anchor: 'base', draw: edaphosaurus },
  moschops: { role: 'walker', w: 196, h: 112, anchor: 'base', draw: moschops },
  gorgonopsian: { role: 'walker', w: 206, h: 92, anchor: 'base', draw: gorgonopsian },
  dicynodont: { role: 'walker', w: 152, h: 70, anchor: 'base', draw: dicynodont },
  cynodont: { role: 'critter', w: 104, h: 36, anchor: 'base', draw: cynodont },
  track5: { role: 'trace', w: 160, h: 40, anchor: 'center', draw: sampleTrack },
};
