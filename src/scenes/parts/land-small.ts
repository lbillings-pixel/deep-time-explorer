// Drawings: small land animals that span many chapters.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/land-small.ts.

import { circ, ell, group, line, n, path } from '../draw';
import { type PartCtx, type PartDef } from '../part';

/** Path data for one ellipse, so that many can share a single path element. */
const oval = (x: number, y: number, rx: number, ry: number) =>
  `M${n(x - rx)},${n(y)}a${n(rx)},${n(ry)} 0 1,0 ${n(rx * 2)},0a${n(rx)},${n(ry)} 0 1,0 ${n(-rx * 2)},0Z`;

function millipede(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#33241d');
  const mid = tone('#5f3d2a');
  const light = tone('#a56d42');
  const N = 27;
  let legs = '';
  let rings = '';
  let bands = '';
  let shine = '';
  for (let i = 0; i < N; i++) {
    const t = i / (N - 1);
    const x = -34 + t * 60;
    // A low wave along the body, and the front end lifted a little.
    const y = -6.1 - 0.8 * Math.sin(t * 7.5 + 0.6) - (t > 0.78 ? (t - 0.78) * 16 : 0);
    const r = 4.5 * Math.min(1, 0.45 + t * 4.5, 0.75 + (1 - t) * 2);
    legs += `M${n(x - 0.7)},${n(y + r * 0.5)}L${n(x - 2.4)},0M${n(x + 0.9)},${n(y + r * 0.5)}L${n(x + 1.5)},0`;
    rings += oval(x, y, 1.9, r);
    bands += oval(x - 0.2, y - r * 0.3, 1.25, r * 0.6);
    shine += oval(x - 0.2, y - r * 0.68, 1, r * 0.2);
  }
  let out = line(legs, tone('#7a4a2c'), 0.8);
  out += path(rings, dark) + path(bands, mid) + path(shine, light);
  // Head, bent down a little, with short elbowed antennae.
  out += ell(28.6, -9.6, 3.6, 4.1, dark) + ell(28.2, -11.4, 2.4, 1.5, mid);
  out += line('M30.5,-10.5L34.5,-9L36,-5.5M29.5,-8.5L32.5,-6L33,-3', dark, 0.9);
  out += circ(30, -10.4, 0.8, tone('#c9a36a'));
  return out;
}

function landsnail(c: PartCtx): string {
  const { tone } = c;
  const flesh = tone('#b9a580');
  const fleshDark = tone('#8a7858');
  const shellC = tone('#c4954f');
  const shellDark = tone('#7a5230');
  const shellLight = tone('#ecd29a');
  // Eye stalks behind the body, then the foot.
  let out = line('M24,-12L30.5,-23M20.5,-12.5L23,-22', flesh, 1.7);
  out += circ(30.7, -23.4, 1.5, tone('#3a2f24')) + circ(23.1, -22.4, 1.4, tone('#3a2f24'));
  out += path(
    'M-31,0C-25,-2.5 -18,-5.5 -8,-7L10,-8.5C15,-10 18,-14 23,-14.5C28,-15 31.5,-11 30.5,-6.5C29.5,-2.5 25,0 18,0Z',
    flesh,
  );
  out += path('M-31,0C-20,-2.2 -6,-3 6,-3C14,-3 22,-2.5 29,-4C27,-1.2 23,0 18,0Z', fleshDark, 'opacity=".55"');
  out += line('M29.5,-8l3.6,1.2', flesh, 1.3);
  // Shell: a low cone of whorls, spire towards the tail, opening towards the head.
  out += path('M11,-9C13,-20 6,-33 -6,-34.5C-16,-35.5 -24,-28 -24,-19C-24,-11 -18,-6 -8,-6C-1,-6 6,-7 11,-9Z', shellC);
  out += path('M11,-9C12.5,-17 9,-26 2,-31C6,-24 7,-15 3,-9.5C6,-9 9,-8.8 11,-9Z', shellDark, 'opacity=".5"');
  let spiral = '';
  for (let i = 0; i <= 30; i++) {
    const a = i * 0.42;
    const r = 13.6 * Math.exp(-0.165 * a);
    spiral += `${i ? 'L' : 'M'}${n(-7.5 + Math.cos(a + 0.5) * r * 1.02)},${n(-20 + Math.sin(a + 0.5) * r * 0.98)}`;
  }
  out += line(spiral, shellDark, 1.5);
  out += path('M-21,-24C-17,-32 -8,-34 -1,-30C-8,-31.5 -15,-29.5 -21,-24Z', shellLight, 'opacity=".75"');
  if (c.detail) {
    out += line('M-22,-15C-20,-9.5 -14,-7.5 -8,-7.5M-18,-17.5C-17,-12.5 -12,-10.5 -7,-10.5', shellDark, 0.7, 'opacity=".6"');
    out += line('M6,-12l1.5,3M2,-11.5l1,2.6M-3,-10.5l0.6,2.6', shellDark, 0.7, 'opacity=".6"');
  }
  return out;
}

function beetle(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#1f211c');
  const wing = tone('#33402d');
  const sheen = tone('#7c9560');
  const leg = tone('#3a2c1e');
  // Far-side legs.
  let out = line('M15,-9L21,-12L24,-3L28,0M5,-8L4,-13L1,-3L-2,0M-5,-8L-12,-13L-17,-3L-21,0', dark, 1.6);
  // Underside, wing cases, shield and head.
  out += path('M-30,-11C-27,-6 -10,-5 12,-6.5L19,-9L19,-13L-30,-13Z', dark);
  out += path('M-31,-12C-31,-22 -17,-27.5 -4,-26.5C2,-26 6.5,-23.5 7.5,-19L7.5,-10C-5,-8.5 -20,-8.5 -31,-12Z', wing);
  out += path('M-27,-18C-21,-24.5 -8,-25.5 3,-22C-8,-23.5 -18,-22.5 -27,-18Z', sheen);
  out += path('M8,-20.5C12,-23.5 17.5,-21.5 18.5,-16.5L18.5,-9.5L8,-9.5Z', tone('#2b3327'));
  out += path('M9.5,-20C12,-22 15.5,-21 17,-18.5C14.5,-19.8 12,-20 9.5,-20Z', sheen, 'opacity=".8"');
  out += ell(21.5, -12.8, 4.6, 4, dark);
  out += path('M25,-12.5L30.5,-10.5L25.5,-9.2Z', leg);
  out += circ(22.8, -14.2, 1.3, tone('#8a6a3a'));
  out += line('M23,-16C26,-22.5 30,-22 34,-17', leg, 0.9);
  if (c.detail) out += line('M-28,-15C-18,-20.5 -6,-21 5,-18M-27,-12.5C-17,-16.5 -6,-16.5 6,-14.5', dark, 0.6, 'opacity=".7"');
  // Near-side legs: thigh, shin, foot.
  out += line('M11,-8.5L16.5,-12L19,-2.5L23,0M2,-7.5L-1.5,-13L-6.5,-2.5L-10.5,0M-8,-8L-16,-13L-23.5,-2.5L-28.5,0', leg, 1.9);
  return out;
}

function spider(c: PartCtx): string {
  const { tone } = c;
  const dark = tone('#33251a');
  const brown = tone('#6b4f36');
  const light = tone('#a98b5e');
  // Far-side legs, their feet a little higher up the ground.
  let out = line(
    'M10,-10L20,-24L27,-13L29.5,-3.5M8,-10L15,-25.5L21.5,-12L22.5,-3M4,-10L1,-25.5L-5,-12L-6.5,-3M2,-10L-8,-26L-19,-13L-23.5,-3.5',
    dark,
    1.5,
  );
  // Abdomen and front body.
  out += ell(-10, -11.5, 10.5, 8.2, brown);
  out += path('M-20,-9.5C-17,-4.5 -5,-3.5 0,-8C-6,-6.5 -14,-7 -20,-9.5Z', dark, 'opacity=".6"');
  out += path('M-16,-15l4,-2.6l4,2.6l-4,2.2ZM-9,-13.5l3.4,-2l3,2.2l-3.2,1.8Z', light, 'opacity=".85"');
  out += ell(6.5, -9.5, 7.2, 5.4, tone('#57402b'));
  out += ell(5.5, -11.5, 4.6, 2.2, brown);
  out += line('M12.5,-8.5L15.5,-5.5M11,-7L13,-3.5', dark, 1.6);
  out += circ(11.6, -11.6, 0.9, tone('#141110')) + circ(9.4, -12.6, 0.8, tone('#141110'));
  // Near-side legs.
  out += line(
    'M9,-8L19,-19.5L26,-7L30,0M7,-7L12,-20.5L17.5,-6L18.5,0M4,-7L-3,-19.5L-10.5,-5L-12.5,0M2,-8L-12,-22L-24.5,-7L-29.5,0',
    brown,
    2,
  );
  if (c.detail) out += line('M19,-19.5L22.5,-13.3M12,-20.5L14.8,-13.3M-3,-19.5L-6.8,-12.3M-12,-22L-18.3,-14.5', light, 0.9, 'opacity=".8"');
  return out;
}

function dragonfly(c: PartCtx): string {
  const { tone } = c;
  const wingFill = tone('#e6f0ee');
  const vein = tone('#4d5f62');
  const body = tone('#2f5d74');
  let out = '';
  for (const s of [-1, 1]) {
    out += path(
      `M7,${s * 2}Q15,${s * 19} 15.5,${s * 35}Q8,${s * 32} 5.5,${s * 15}Q5,${s * 6} 7,${s * 2}Z` +
        `M1.5,${s * 2}Q3,${s * 19} -6,${s * 33}Q-15.5,${s * 26} -12.5,${s * 12}Q-9,${s * 4} 1.5,${s * 2}Z`,
      wingFill,
      `opacity=".8" stroke="${vein}" stroke-width=".7"`,
    );
    if (c.detail) {
      out += line(
        `M7,${s * 2}Q12,${s * 18} 12.5,${s * 32}M7,${s * 2}Q7,${s * 13} 8.5,${s * 24}M1.5,${s * 2}Q-1,${s * 17} -8,${s * 29.5}M1.5,${s * 2}Q-6,${s * 11} -9.5,${s * 21}`,
        vein,
        0.5,
        'opacity=".7"',
      );
    }
    out += line(`M15,${s * 28}L15.4,${s * 31.5}M-2.4,${s * 27.5}L-4.4,${s * 30.6}`, tone('#3a3326'), 1.5);
  }
  // Long thin abdomen with pale rings, thorax, and a head that is mostly eyes.
  out += path('M0,-1.9L-34,-1.1L-36,0L-34,1.1L0,1.9Z', body);
  out += line('M-5,-1.7v3.4M-11,-1.6v3.2M-17,-1.4v2.8M-23,-1.3v2.6M-29,-1.2v2.4', tone('#8fc0cf'), 1.3);
  out += ell(5.5, 0, 6.6, 4, tone('#55733a'));
  out += line('M2,-2.3L8.5,-1.2M2,2.3L8.5,1.2', tone('#c9cf7c'), 0.9);
  out += circ(14, 0, 3, body);
  out += circ(14.6, -2.3, 2.6, tone('#3d7f78')) + circ(14.6, 2.3, 2.6, tone('#3d7f78'));
  return out;
}

/** One butterfly, wings open (seen from above) or raised (seen from the side), facing right. */
function oneButterfly(c: PartCtx, hex: string, raised: boolean): string {
  const { tone } = c;
  const fill = tone(hex);
  const edge = tone('#3b2d22');
  const body = tone('#2e2620');
  const rim = `stroke="${edge}" stroke-width="1.1" stroke-linejoin="round"`;
  let out = '';
  if (raised) {
    // Far wings a little behind and darker, then the near pair.
    out += path('M2.5,-1L15,-16C9,-17.5 2,-15 -1,-11.5ZM0.5,-1L-1,-11.5C-7,-12 -10.5,-7 -8.5,-2.5Z', edge);
    out += path('M1.5,-0.5L12,-18C6,-19 -1,-16 -3.5,-12ZM-0.5,-0.5L-3.5,-12C-10,-12.5 -13,-7 -11,-2Z', fill, rim);
    if (c.detail) out += circ(7.5, -14.5, 1.4, edge) + line('M1,-2L-7.5,-8M1,-2L6,-13', edge, 0.5, 'opacity=".6"');
    out += line('M-6.5,1L5.5,-0.8', body, 2) + line('M5.5,-0.8l4.5,-3.6M5.5,-0.8l5.4,-1.6', body, 0.6);
    return out;
  }
  for (const s of [-1, 1]) {
    out += path(
      `M3,0C6.5,${s * 6} 10,${s * 13} 6.5,${s * 16.5}C1,${s * 15.5} -2.5,${s * 8} -1,0Z` +
        `M-1,0C-2,${s * 7} -6.5,${s * 13} -10,${s * 11.5}C-12.5,${s * 6.5} -8.5,${s * 2} -5,0Z`,
      fill,
      rim,
    );
    if (c.detail) out += circ(5.6, s * 12.8, 1.4, edge) + circ(-7.6, s * 8.6, 1.1, edge);
  }
  out += line('M-7,0L5.5,0', body, 2.1) + line('M5.5,0l5,-3.4M5.5,0l5,3.4', body, 0.6);
  return out;
}

function butterfly(c: PartCtx): string {
  const { rng } = c;
  const hexes = ['#e9e3c6', '#dcae3c', '#c57a30', '#9a7448', '#8ea3c2'];
  const first = rng.int(0, hexes.length - 1);
  const slots: [number, number][] = [
    [-20, 8],
    [19, -11],
    [3, 16],
  ];
  const count = rng.int(2, 3);
  let out = '';
  for (let i = 0; i < count; i++) {
    const [x, y] = slots[i]!;
    // One kind of butterfly per group, sometimes with a second kind among them.
    const hex = hexes[(first + (i === 2 && rng.chance(0.5) ? 1 : 0)) % hexes.length]!;
    const raised = i === 1 ? true : rng.chance(0.35);
    const rot = raised ? rng.range(-22, 8) : rng.range(-50, 30);
    out += group(oneButterfly(c, hex, raised), x + rng.range(-4, 4), y + rng.range(-4, 4) + (raised ? 7 : 0), rng.range(0.82, 1), false, rot);
  }
  return out;
}

function earlymammal(c: PartCtx): string {
  const { tone } = c;
  const fur = tone('#7b634b');
  const furDark = tone('#534132');
  const pale = tone('#cdb893');
  const skin = tone('#a98670');
  // Tail, held just off the ground.
  let out = path('M-8,-16C-20,-16.5 -28,-10 -36,-8.2C-40,-7.5 -43,-8.6 -46,-11C-43.5,-6.6 -40,-5.2 -36,-5.4C-28,-6 -20,-11 -8,-10Z', skin);
  // Far-side legs.
  out += line('M21,-10L23.5,-4L26,-0.8M-1,-10L-5.5,-4.5L-1.5,-0.8', furDark, 3.2);
  out += line('M26,-0.8h3.5M-1.5,-0.8h3.5', furDark, 1.6);
  // Body and long-snouted head.
  out += path(
    'M-10,-12.5C-10,-21 0,-25.5 12,-24.5C20,-24 26,-22.5 31,-21C36.5,-20 41.5,-15.5 46,-11C46.6,-9.4 45.2,-8.2 43,-8C39,-7.4 35,-7 31,-6.8C26,-5.2 14,-4.8 4,-5.8C-3,-6.4 -10,-8 -10,-12.5Z',
    fur,
  );
  out += path('M43,-8C39,-7.4 35,-7 31,-6.8C26,-5.2 14,-4.8 4,-5.8C-2,-6.3 -7,-7.6 -9.5,-10.5C-1,-9.5 14,-9.6 26,-10.6C33,-11.2 39,-10 43,-8Z', pale);
  if (c.detail) {
    out += line('M-6,-19l-2.5,2M0,-22l-2.6,2.2M7,-23.2l-2.6,2.4M14,-23.2l-2.6,2.4M21,-22l-2.4,2.4M-3,-15l-2.6,2M4,-17l-2.6,2.2M11,-18l-2.6,2.2M18,-17.5l-2.5,2.2', furDark, 0.8, 'opacity=".7"');
    out += line('M42,-11.5L37,-6M42.5,-11L39.5,-4.5M43,-12L34,-9', pale, 0.4, 'opacity=".9"');
  }
  // Ear, eye, nose and mouth.
  out += ell(28.6, -21.6, 3, 3.6, furDark) + ell(28.9, -21.3, 1.7, 2.3, skin);
  out += circ(36.2, -15.8, 1.5, tone('#15110e')) + circ(36.6, -16.2, 0.45, tone('#f1ead8'));
  out += circ(45.8, -10.4, 1.2, tone('#5a3a34'));
  out += line('M44.6,-8.4C41,-8.4 38.5,-8.6 36.5,-9.6', furDark, 0.7);
  // Near-side legs.
  out += ell(-2.5, -11.5, 6.4, 6, fur);
  out += path('M-8.5,-11C-6.5,-6.5 -1,-6.5 3,-9C1,-5 -6,-4.5 -8.5,-11Z', furDark, 'opacity=".45"');
  out += line('M-4,-8.5L-9,-3.5L-5,-0.8M16.5,-9L15.5,-3.5L19,-0.8', fur, 3.4);
  out += line('M-5,-0.8h4M19,-0.8h4', skin, 1.7);
  return out;
}

function rodent(c: PartCtx): string {
  const { tone } = c;
  const fur = tone('#8a7152');
  const furDark = tone('#5e4b35');
  const pale = tone('#dccba6');
  // Bushy tail carried up behind the back.
  let out = path('M-14,-4C-30,-4 -37,-21 -31,-36C-27.5,-45 -20,-51.5 -12,-54C-16,-47 -20.5,-40 -20.5,-32C-20.5,-22 -16,-14 -10,-10Z', furDark);
  out += path('M-16,-7C-27,-9 -32,-22 -28,-35C-25.5,-42 -21,-47.5 -16,-50.5C-20,-44 -23.5,-38 -23.5,-31C-23.5,-21 -19,-13 -12,-9Z', fur);
  // Far-side forearm.
  out += line('M15,-29L19,-24L25.5,-28', furDark, 3);
  // Haunches, back, and head.
  out += path(
    'M-18,-7C-22,-19 -13,-30 -2,-34C1,-40 4,-45 9,-48.5C15,-52 23,-50 27.5,-45C30.5,-43 31.6,-39.5 30,-37.5C28,-34.5 24,-33 20.5,-32.6C19.5,-28 18.5,-24 16,-20C17,-12 13,-5 7,-2L-10,-2C-14,-2 -17,-4 -18,-7Z',
    fur,
  );
  out += path('M20.5,-32.6C19.5,-28 18.5,-24 16,-20C17,-12 13,-5 7,-2L2,-2C8,-8 9,-16 9,-22C10,-27 13,-31 16,-33.5C17.5,-33 19,-32.6 20.5,-32.6Z', pale);
  out += path('M30,-37.5C28,-34.5 24,-33 20.5,-32.6C18.5,-32.6 16.5,-33.4 15,-35C20,-34.8 26,-36 30.4,-39.2Z', pale);
  // Ear, eye, nose, whiskers.
  out += ell(10.5, -49.5, 3.2, 4.6, furDark, 'transform="rotate(-18 10.5 -49.5)"') + ell(11, -49, 1.7, 2.9, tone('#b8917a'), 'transform="rotate(-18 11 -49)"');
  out += circ(21, -43.8, 2.1, tone('#15110e')) + circ(21.6, -44.4, 0.6, tone('#f1ead8'));
  out += circ(30.6, -40.2, 1.3, tone('#4f342c'));
  if (c.detail) {
    out += line('M28,-38.5L35,-41M28,-37.8L35.5,-37M27.5,-37L33.5,-33.5', pale, 0.4);
    out += line('M-10,-27l-3,2.4M-13,-20l-3,2.4M-6,-22l-3,2.4M-2,-29l-3,2.4M3,-38l-3,2.6M-9,-14l-3,2.2', furDark, 0.8, 'opacity=".6"');
  }
  // Thigh, long hind foot, and the near forearm holding a seed.
  out += path('M-13,-6C-15,-17 -6,-23 3,-20C9,-17.5 10,-9 5,-4.5C1,-2 -8,-2 -13,-6Z', fur);
  out += path('M3,-20C9,-17.5 10,-9 5,-4.5C2.5,-3 -1,-2.5 -4,-2.6C2,-5 6,-11 3,-20Z', furDark, 'opacity=".4"');
  out += path('M-6,-4L15,-3.6C17.6,-3.4 17.8,0 15,0L-6,0Z', fur) + line('M11,-0.5h6M11.5,-2.2h5.4', furDark, 0.6);
  out += ell(26.5, -30, 2.6, 2.1, tone('#6b4a2a'));
  out += line('M12,-30L17,-23.5L24.5,-28.5', fur, 3.4);
  return out;
}

function turtle(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#6c7446');
  const skinDark = tone('#454c2c');
  const shellC = tone('#5b5f39');
  const shellDark = tone('#3d4127');
  const shellLight = tone('#8b8f58');
  const yellow = tone('#c9b565');
  // Far-side legs and the tail.
  let out = path('M10,-13L16,-2L14,0L28,0L26,-13ZM-30,-13L-36,-2L-39,0L-25,0L-22,-13Z', skinDark);
  out += path('M-56,-17C-64,-15 -70,-11 -75,-6C-68,-8 -60,-9 -54,-11Z', skin);
  // Neck and head, stretched forward.
  out += path('M30,-24C42,-28 52,-35.5 62,-37C70,-38 76.5,-33.5 76.5,-29C76.5,-26 72.5,-24 66.5,-23.6C58,-22.5 50,-16 36,-12Z', skin);
  out += path('M76.5,-29C76.5,-26 72.5,-24 66.5,-23.6C58,-22.5 50,-16 36,-12L34,-15C46,-18 56,-25.5 66,-26.6C70,-27 74,-27.6 76.5,-29Z', yellow, 'opacity=".55"');
  if (c.detail) out += line('M36,-22C46,-25 54,-31.5 62,-33.5M36,-18.5C47,-21 56,-28.5 63.5,-30', yellow, 0.9, 'opacity=".9"');
  out += line('M76.3,-29.5C72,-28 68,-27.4 63.5,-28', skinDark, 0.9);
  out += circ(66.3, -32.3, 2.3, tone('#d8c66a')) + circ(66.8, -32.3, 1.1, tone('#16170f'));
  out += circ(74.6, -32.4, 0.5, skinDark);
  // Underside of the shell, then the low domed upper shell.
  out += path('M-50,-13L32,-13C30,-7.5 22,-6 12,-6L-36,-6C-44,-6 -48,-9 -50,-13Z', yellow);
  out += path('M-61,-15C-59,-31 -39,-41.5 -11,-41.5C13,-41.5 32,-34 40.5,-18.5C41.6,-15.5 39.5,-13.2 36.5,-12.8L-57,-12C-60,-12 -61.5,-13.5 -61,-15Z', shellC);
  out += path('M-61,-15C-59.5,-17 -57,-18 -54,-18L34,-19C37.5,-19 40,-19 40.5,-18.5C41.6,-15.5 39.5,-13.2 36.5,-12.8L-57,-12C-60,-12 -61.5,-13.5 -61,-15Z', shellDark);
  out += path('M-46,-31C-34,-39 -14,-41 6,-38.5C-12,-39 -30,-36.5 -46,-31Z', shellLight);
  // Scutes: the row along the back, the side row, and the rim.
  out += line('M-52,-18C-47,-26.5 -40,-32 -31,-35.5M-33,-18.4C-33,-25.5 -28,-31 -20,-33L-16,-41M-20,-33C-13,-34.5 -4,-34.5 3,-33L6,-41M3,-33C10,-31 15,-25.5 16,-19M3,-33L10,-33.5C16,-33 23,-30.5 27,-27M27,-27L31,-19.2M-8,-33.5L-8,-18.6', shellDark, 1.1);
  if (c.detail) {
    out += line('M-52,-17.6v5M-42,-18v5.4M-32,-18.2v5.6M-22,-18.3v5.8M-12,-18.4v5.9M-2,-18.5v6M8,-18.6v6M18,-18.8v6M28,-19v6', shellC, 0.8);
    out += line('M-44,-21C-42,-25 -39,-28 -36,-30M-27,-21.5C-27,-25 -24,-28 -20,-29.5M-3,-22h7M-3,-26h6.5M-17,-22h5M-17,-26h5M21,-22.5l3,-3', shellLight, 0.7, 'opacity=".6"');
  }
  // Near-side legs with webbed, clawed feet.
  out += path('M21,-15C24,-9 27,-4.5 25.5,0L41.5,0C40,-5 37.5,-11 34,-16Z', skin);
  out += path('M-47,-15C-50,-9 -54,-4.5 -57,0L-41.5,0C-40,-5 -38,-10.5 -36,-15Z', skin);
  out += line('M30,-0.6l3.6,0.4M35,-0.8l3.8,0.6M39,-1.4l3.4,1M-55,-0.8l-3.8,0.5M-50,-0.6l-3.6,0.5M-45.5,-0.6l-3.4,0.4', yellow, 1.1);
  if (c.detail) out += line('M26,-11l7,0.5M26.5,-7l8.5,0.5M-45,-11l7,0.4M-48,-7l8.5,0.4', skinDark, 0.7, 'opacity=".6"');
  return out;
}

function tortoise(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#7c7354');
  const skinDark = tone('#4f4935');
  const shellC = tone('#8a7345');
  const shellDark = tone('#57462a');
  const shellLight = tone('#b8a066');
  // Far-side legs.
  let out = path('M17,-14L17,0L28.5,0L28,-14ZM-27,-12L-28,0L-17,0L-16,-12Z', skinDark);
  // Neck and head.
  out += path('M18,-17C25,-21 29.5,-27.5 35.5,-31.5C40.5,-34 46.5,-31 46.5,-26.5C46.5,-23.2 43.5,-21.4 39.5,-21.2C35.5,-17 30,-12 23,-9.5Z', skin);
  out += line('M46.2,-26C43,-25 40.5,-24.6 37.5,-25.4', skinDark, 0.8);
  out += circ(40.4, -28.4, 1.6, tone('#17150f')) + circ(40.8, -28.8, 0.45, tone('#efe8d2'));
  if (c.detail) out += line('M24,-15.5l3,2.4M28,-20l3.4,2.6M32,-24.5l3,2.4', skinDark, 0.7, 'opacity=".6"');
  // High domed shell, with a flared rim.
  out += path('M-41,-12.5C-43,-35 -27,-49 -8,-49C11,-49 25,-37 26,-14.5C26,-11.5 24,-10 22,-10L-38,-10C-40,-10 -41,-11 -41,-12.5Z', shellC);
  out += path('M-41,-12.5C-41.3,-14.5 -41.3,-16.5 -41,-18.5C-20,-16.5 6,-16.5 25.6,-19C25.9,-17.5 26,-16 26,-14.5C26,-11.5 24,-10 22,-10L-38,-10C-40,-10 -41,-11 -41,-12.5Z', shellDark);
  out += path('M-33,-33C-27,-43 -14,-48 -2,-46.5C-14,-45.5 -25,-41 -33,-33Z', shellLight);
  // Scutes, each with a paler centre and growth rings.
  out += line('M-33,-37.5C-19,-41.5 0,-41.5 16,-37.5M-22,-40L-25,-28L-22,-17.4M-6,-41.2L-7,-28L-6,-16.8M9,-39.6L10,-28L9,-17.2', shellDark, 1.2);
  out += path('M-17,-33l4,-2.5l3.5,2.5l-0.5,7l-3,2l-4,-2ZM-2,-33.5l4,-2.5l4,2.5l0,7l-4,2.2l-4,-2.2ZM13,-31l3.5,-2l3,3l0,6l-3,1.5l-3.5,-2ZM-33,-30l3.5,-3.5l3,2.5l-0.5,7l-3,1.6l-3.6,-1.8Z', shellLight, 'opacity=".55"');
  if (c.detail) {
    out += line('M-33,-17.6v6.6M-24,-17.2v6.6M-15,-16.9v6.5M-6,-16.8v6.4M3,-16.9v6.5M12,-17.3v6.6M20,-18v7', shellC, 0.8);
    out += line('M-19.5,-36.5l6.5,-3.5l6,3.5M-4.5,-37l6.5,-3l6.5,3.4M11.5,-35l5,-2.6l5,4.6', shellDark, 0.6, 'opacity=".5"');
  }
  // Near-side legs: stout columns with heavy scales and blunt claws.
  out += path('M8,-15C7.5,-9 7.5,-4 8,0L20.5,0C21,-5 21,-10 20,-15Z', skin);
  out += path('M-36,-13C-37,-8 -37,-4 -36.5,0L-25,0C-24.5,-4 -24.5,-9 -25,-13Z', skin);
  out += path('M11,-12l2.6,1.8l-2.6,1.8l-2.2,-1.8ZM16,-9.5l2.6,1.8l-2.6,1.8l-2.2,-1.8ZM11.5,-6l2.6,1.8l-2.6,1.8l-2.2,-1.8ZM-32,-10l2.6,1.8l-2.6,1.8l-2.2,-1.8ZM-28,-6.5l2.4,1.7l-2.4,1.7l-2,-1.7Z', skinDark, 'opacity=".55"');
  out += path('M12,0l1.4,-2.4l1.4,2.4ZM15.4,0l1.4,-2.4l1.4,2.4ZM18.6,0l1.3,-2.2l1.3,2.2ZM-33,0l1.3,-2.2l1.3,2.2ZM-29.8,0l1.3,-2.2l1.3,2.2ZM-26.8,0l1.2,-2l1.2,2Z', tone('#d6caa2'));
  return out;
}

function crocrelative(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#6a6046');
  const dark = tone('#463e2c');
  const light = tone('#a2946a');
  // Three humps above the water: a short broad head, the armoured back, the tail.
  let out = path('M79,0C79.5,-7 72,-10 59,-10.5C56,-16.5 46.5,-17 42.5,-11.5C36.5,-12 31,-9.5 27,-5L25,0Z', hide);
  out += path('M79,0C79.3,-3 78,-4.6 75.5,-5.2C66,-4.4 52,-4.6 40,-5.6C34,-5.6 29,-4 25,0Z', light, 'opacity=".5"');
  out += ell(74.5, -8.6, 3.8, 2.2, hide) + circ(76, -9.2, 0.7, dark);
  out += line('M78.6,-4C66,-3.4 52,-3.8 39,-5', dark, 0.9);
  if (c.detail) out += line('M75,-3.8v1.8M71,-3.6v1.8M67,-3.5v1.8M63,-3.5v1.8M59,-3.6v1.8M55,-3.7v1.8M51,-3.9v1.8M47,-4.2v1.8M43,-4.5v1.8', tone('#ece4c8'), 0.8);
  out += circ(49.6, -12.6, 2.4, tone('#d2b44a')) + ell(49.9, -12.6, 0.8, 2, tone('#1a1a10'));
  out += path('M44,-12.5C46,-17 53,-17.2 56,-13C52,-15.5 48,-15.4 44,-12.5Z', dark);
  out += path('M17,0C8,-12 -34,-13.5 -55,0Z', hide);
  // Two rows of rectangular armour plates along the back, the far row darker.
  let far = '';
  let near = '';
  for (let i = 0; i < 9; i++) {
    const x = 9 - i * 6.6;
    const y = -9.6 + Math.abs(x + 17) ** 2 * 0.0085;
    far += `M${n(x + 1.4)},${n(y + 1)}v-5.2h-5v5.2Z`;
    near += `M${n(x)},${n(y + 2.6)}v-5h-5.6v5Z`;
  }
  out += path(far, dark) + path(near, light) + line('M10,-5C-6,-8.5 -32,-9 -48,-3', dark, 0.9, 'opacity=".7"');
  out += path('M-60,0C-70,-6.5 -86,-5.5 -97,0Z', hide);
  let crest = '';
  for (let x = -65; x > -92; x -= 6.4) crest += `M${x},${n(-3.2 + Math.abs(x + 77) * 0.07)}l-2.2,-4.4l-3,4.6Z`;
  out += path(crest, dark);
  out += line('M-112,3h60M-26,4.5h54M44,3.5h60M-66,8h38M18,9h52', tone('#f4f7ee'), 1.2, 'opacity=".5"');
  return out;
}

function lizard(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8c794f');
  const dark = tone('#54462c');
  const pale = tone('#d8cba0');
  // Far-side legs, sprawled.
  let out = line('M26,-10L33.5,-8L32.5,-1.5M-3,-9L4.5,-7L0,-1.5', dark, 2.6);
  out += line('M32.5,-1.5l5,0.6M32.5,-1.5l4.4,-2M0,-1.5l5.4,0.6M0,-1.5l4.6,-2.2', dark, 1);
  // Tail, body, raised head.
  out += path(
    'M-53,-3.2C-40,-2.6 -26,-5 -11,-12.5C-1,-16 12,-16.5 22,-16C28,-18 34,-23 41,-24C46.5,-24.5 51.5,-21 51.5,-18.2C51.5,-16 48.5,-15 44.5,-14.8C39.5,-13.4 34,-8.5 26,-6.4C14,-3.4 0,-3.2 -10,-5C-24,-2 -40,-0.6 -53,-1.2Z',
    hide,
  );
  out += path('M51.5,-18.2C51.5,-16 48.5,-15 44.5,-14.8C39.5,-13.4 34,-8.5 26,-6.4C14,-3.4 0,-3.2 -10,-5C-24,-2 -40,-0.6 -53,-1.2C-38,-2.4 -24,-4 -10,-8C2,-7.4 14,-7.6 25,-10.4C33,-13 40,-17.4 51.5,-18.2Z', pale);
  out += line('M-44,-3.4C-30,-4 -18,-8.5 -8,-12.6C2,-15 12,-15.4 22,-14.6C29,-16.6 35,-21.4 41,-22.4', tone('#b9a56c'), 1, 'opacity=".8"');
  if (c.detail) {
    out += path('M-28,-6.6l3,-1.8l2.4,1ZM-19,-9.2l3,-2l2.6,1ZM-9,-11.6l3.2,-1.6l2.6,1.4ZM1,-12.8l3.2,-1.2l2.6,1.6ZM11,-13l3.2,-1l2.6,1.8ZM21,-12.6l3,-1.6l2.4,1.6Z', dark, 'opacity=".7"');
    out += line('M-38,-4.6v2.4M-33,-5.2v2.6', dark, 0.7, 'opacity=".5"');
  }
  out += line('M51.3,-18.6C47,-17.6 43.5,-17.2 40,-18', dark, 0.8);
  out += circ(43.2, -20.6, 1.6, tone('#17140d')) + circ(43.6, -21, 0.45, tone('#efe8d2'));
  // Near-side legs: upper limb out to the side, lower limb down, long toes.
  out += line('M22,-9L29,-5.5L27,-0.8M-7,-8L1,-4.5L-6,-0.8', hide, 3.2);
  out += line('M27,-0.8l6.4,0.4M27,-0.8l5.6,-2.6M27,-0.8l3,-4M-6,-0.8l7.6,0.4M-6,-0.8l6.6,-2.8M-6,-0.8l-4.6,0.3', hide, 1.1);
  return out;
}

function snake(c: PartCtx): string {
  const { tone } = c;
  const hide = tone('#8b7d4e');
  const dark = tone('#4a4127');
  const pale = tone('#d9cd9e');
  const blotch = 'stroke-dasharray="0.1 8.5"';
  // One length of body: a dark rim, the body colour, then a row of saddle blotches.
  const coil = (d: string, w: number) => line(d, dark, w + 1.6) + line(d, hide, w) + line(d, dark, w * 0.55, blotch);
  let out = line('M-33,-2.4C-37,-1.6 -41,-1.2 -45,-1.4', hide, 3);
  out += coil('M21,-9C21,-15.5 -27,-16.5 -27,-10.5', 6.6);
  out += coil('M-27,-10.5C-27,-5.5 -10,-9 2,-10', 6.8);
  out += coil('M-33,-2.4C-22,-4.4 -8,-4 4,-4C14,-4 21,-5 21,-9', 7);
  // Neck rising in a curve, belly side paler, to the raised head.
  const neck = 'M2,-10C12,-11 11,-21 16,-27C19.5,-31.5 24,-34.5 29,-35';
  out += coil(neck, 6.4);
  out += line('M9,-12C13,-15 13,-22 18,-27.5C21,-31 25,-33 29,-33.2', pale, 2, 'opacity=".85"');
  out += path('M25,-38.6C31,-41.5 39,-39.8 42.5,-36C39.5,-32.4 31,-31 25,-32.4Z', hide);
  out += path('M42.5,-36C39.5,-32.4 31,-31 25,-32.4C30,-33 36,-34 42.5,-36Z', pale);
  out += line('M42.3,-36C38.5,-35 35,-34.6 31.5,-34.8', dark, 0.7);
  out += circ(35.6, -37.2, 1.3, tone('#16130c')) + circ(35.9, -37.5, 0.4, tone('#efe8d2'));
  out += line('M42.5,-36l4,0.4l2.2,-1.4M46.5,-35.6l2.4,1.2', tone('#7d2f2a'), 0.7);
  if (c.detail) out += line('M-28,-4.2C-18,-5.2 -6,-5 6,-5.2', pale, 0.9, 'opacity=".5"');
  return out;
}

function frog(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#6b8a3b');
  const dark = tone('#44602a');
  const pale = tone('#dcd8a2');
  // Far-side front leg.
  let out = line('M20,-14L20.5,-6L24,-1.4', dark, 4) + line('M24,-1.4l5,0.6M24,-1.4l4.4,-2', dark, 1.2);
  // Body: sloping back, blunt head, pale throat and belly.
  out += path(
    'M-27,-5.5C-24,-14.5 -10,-24 6,-31C10,-33.5 14,-35 19,-34.5C24,-34 28.5,-31 30.5,-27C31.5,-24.5 31,-22.5 29.5,-21C27,-19 24.5,-18 22,-17C20,-10 12,-5 2,-3L-20,-2C-25,-2 -28,-3.5 -27,-5.5Z',
    skin,
  );
  out += path('M31,-25C31.2,-23.4 30.6,-22 29.5,-21C27,-19 24.5,-18 22,-17C20,-10 12,-5 2,-3C8,-9 13,-16 16.5,-22C21,-22.4 26,-23 31,-25Z', pale);
  out += line('M31,-25.4C26,-23.2 20,-22.6 13.5,-24.6', dark, 0.9);
  if (c.detail) {
    out += path('M-12,-17.5l3.4,-2l2.6,1.6l-2.8,2ZM-3,-23l3.2,-1.8l2.4,1.6l-2.8,1.8ZM-17,-11.5l3,-1.6l2.2,1.4l-2.6,1.6ZM5,-27l2.6,-1.4l2,1.4l-2.4,1.4Z', dark, 'opacity=".7"');
    out += line('M-22,-10.5C-14,-18.5 -2,-25.5 8,-30', tone('#a9bd62'), 0.9, 'opacity=".8"');
  }
  // Eye bulging from the top of the head, eardrum behind it.
  out += circ(17.5, -33.6, 4.4, skin) + circ(18.2, -33.8, 3.1, tone('#d7b548')) + ell(18.5, -33.8, 2, 1.2, tone('#15150d'));
  out += circ(10.8, -27, 2.3, dark, 'opacity=".7"') + circ(28.6, -28.4, 0.6, dark);
  // Folded hind leg: thigh, shin, long foot.
  out += path('M-25,-6C-23,-17 -6,-19.5 2.5,-11C4.5,-7 1,-3.4 -6,-3.2L-20,-2.4C-24,-2.6 -25.6,-4 -25,-6Z', skin);
  out += path('M-23,-9C-18,-16 -6,-17 1,-10.5C-6,-13.5 -16,-13.5 -23,-9Z', tone('#8aa84c'));
  out += line('M0.5,-7.5L-21,-3.2', dark, 4.6);
  out += line('M-22.5,-1.6L-3,-1.5', skin, 3) + line('M-3,-1.5l7,-0.4M-3,-1.5l6,-2.8M-3,-1.5l6.8,0.9', skin, 1.2);
  // Near-side front leg.
  out += line('M15,-15.5L13,-6.5L17,-1.4', skin, 4.6) + line('M17,-1.4l5.6,0.6M17,-1.4l5,-2.4M17,-1.4l2,1', skin, 1.2);
  return out;
}

function bat(c: PartCtx): string {
  const { tone } = c;
  const skin = tone('#5f4a3b');
  const bone = tone('#33261d');
  const fur = tone('#7a5c40');
  let out = '';
  for (const s of [-1, 1]) {
    // Wing skin stretched between the arm, the long fingers and the leg, with a scalloped rear edge.
    out += path(
      `M${s * 3},-6L${s * 15},-14L${s * 35},-5Q${s * 28.5},-1 ${s * 26.5},8Q${s * 20},5 ${s * 16},12.5Q${s * 9.5},8 ${s * 4.5},13L${s * 2},6Z`,
      skin,
    );
    out += line(`M${s * 3},-6L${s * 15},-14L${s * 35},-5M${s * 15},-14L${s * 26.5},8M${s * 15},-14L${s * 16},12.5M${s * 15},-14l${s * 0.6},-3.4`, bone, 1.1);
    if (c.detail) out += line(`M${s * 6},-4.5Q${s * 12},2 ${s * 10},9.5M${s * 21},-9Q${s * 23},-1 ${s * 21},7`, bone, 0.5, 'opacity=".5"');
  }
  out += path('M-4.5,13L0,18L4.5,13L2,6L-2,6Z', skin);
  // Furry body, head, big ears.
  out += path('M-3.6,-12L-5.6,-20L-0.6,-13.5ZM3.6,-12L5.6,-20L0.6,-13.5Z', bone);
  out += ell(0, 1.5, 4.6, 8.4, fur) + path('M-3,1C-1.5,5.5 1.5,5.5 3,1C1.5,8 -1.5,8 -3,1Z', tone('#9c7c58'));
  out += circ(0, -9, 4.3, fur);
  out += path('M-1.4,-6.6L0,-5.2L1.4,-6.6Z', bone);
  out += circ(-1.8, -9.6, 0.7, tone('#14100c')) + circ(1.8, -9.6, 0.7, tone('#14100c'));
  return out;
}

/** One small bird in flight, facing right. `pose`: 0 wings up, 1 wings down, 2 wings folded mid-bound. */
function oneSongbird(c: PartCtx, pose: number): string {
  const { tone } = c;
  const body = tone('#4c463e');
  const wing = tone('#2e2a26');
  const pale = tone('#a39a86');
  let out = path('M-5,-0.6L-12.5,-1.6L-10.6,0.4L-12.6,2.2L-5,1.8Z', wing);
  if (pose === 0) out += path('M2,-1.5C1,-7 -2,-11 -6.5,-13C-6,-8 -5,-3.5 -3.5,0Z', wing, 'opacity=".75"');
  out += path('M-6,0.4C-4,-3.4 2,-4.4 6,-3.6C8.6,-4.6 11.4,-3.4 11.6,-1.4L14.6,-0.6L11.4,0.2C10.6,1.8 8,2.6 6,2.4C2,4.2 -4,3.6 -6,0.4Z', body);
  out += path('M11.4,0.2C10.6,1.8 8,2.6 6,2.4C2,4.2 -4,3.6 -6,0.4C-2,1.6 4,1.4 11.4,0.2Z', pale);
  out += circ(9.6, -1.8, 0.7, tone('#0f0e0c'));
  if (pose === 0) out += path('M3,-1.5C3,-7 0.5,-12 -3.5,-14.5C-4,-9 -3.5,-4 -2,0Z', wing);
  else if (pose === 1) out += path('M3.5,-1C3.5,4.5 1,9.5 -3.5,12C-4,7 -3.5,2.5 -2,-1.5Z', wing);
  else out += path('M3.5,-1.6C0,-2.6 -5,-1.8 -9,0.6C-5,1.4 0,1 3.5,-0.2Z', wing);
  return out;
}

function songbirds(c: PartCtx): string {
  const { rng } = c;
  const slots: [number, number][] = [
    [-5, -5],
    [11, 13],
    [-18, 10],
    [22, -13],
    [-31, -12],
    [36, 3],
    [-45, 5],
    [47, -11],
  ];
  const count = rng.int(5, 8);
  let out = '';
  for (let i = 0; i < count; i++) {
    const [x, y] = slots[i]!;
    out += group(oneSongbird(c, rng.int(0, 2)), x + rng.range(-3.5, 3.5), y + rng.range(-4, 4), rng.range(0.85, 1.05), false, rng.range(-14, 8));
  }
  return out;
}

export const PARTS: Record<string, PartDef> = {
  millipede: { role: 'crawler', w: 72, h: 15, anchor: 'base', draw: millipede },
  landsnail: { role: 'crawler', w: 63, h: 35, anchor: 'base', draw: landsnail },
  beetle: { role: 'crawler', w: 64, h: 27, anchor: 'base', draw: beetle },
  spider: { role: 'crawler', w: 60, h: 26, anchor: 'base', draw: spider },
  dragonfly: { role: 'flyer', w: 56, h: 70, anchor: 'center', draw: dragonfly },
  butterfly: { role: 'flyer', w: 70, h: 54, anchor: 'center', draw: butterfly },
  earlymammal: { role: 'critter', w: 92, h: 26, anchor: 'base', draw: earlymammal },
  rodent: { role: 'critter', w: 68, h: 54, anchor: 'base', draw: rodent },
  turtle: { role: 'shore', w: 152, h: 42, anchor: 'base', draw: turtle },
  tortoise: { role: 'critter', w: 88, h: 49, anchor: 'base', draw: tortoise },
  crocrelative: { role: 'shore', w: 190, h: 26, anchor: 'base', afloat: true, draw: crocrelative },
  lizard: { role: 'critter', w: 105, h: 25, anchor: 'base', draw: lizard },
  snake: { role: 'critter', w: 92, h: 42, anchor: 'base', draw: snake },
  frog: { role: 'critter', w: 62, h: 38, anchor: 'base', draw: frog },
  bat: { role: 'flyer', w: 70, h: 38, anchor: 'center', draw: bat },
  songbirds: { role: 'flyer', w: 110, h: 50, anchor: 'center', draw: songbirds },
};
