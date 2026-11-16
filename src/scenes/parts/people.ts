// Drawings: people, drawn only in the painted pictures (tools/extinctions), never in a chapter scene.
// The hunters of the mammoth steppe, and fourteen small groups of people for the two painted pictures of
// human history. They are built with the upright figure of ./primates.ts. The matching whitelist entries are
// in ../whitelist/people.ts. Kept in a file of their own so that the scene script leaves them out.

import { circ, darken, ell, group, lighten, line, n, path } from '../draw';
import { rad, type PartCtx, type PartDef } from '../part';
import { CHILD, cobble, curve, figure, fire, firewood, FLINT, type Frame, type Look, type Pose, type Props, type Pt, SAPIENS, spear, type Species, STAND, type V, WALK_A, WALK_B, WOOD } from './primates';

/**
 * Three hunters of the mammoth steppe, in sewn and hooded fur clothing, closing on something to the right:
 * one braced with a spear at the ready, one running with a spear leveled, one with the arm drawn back to throw.
 * Drawn for the painting of the Late Pleistocene extinctions; the whitelist keeps it out of the chapter scenes.
 */
function hunter(c: PartCtx): string {
  const trim = '#cbb894';
  const dress = (hide: string) => ({ hide, skirt: 0.74, top: 'tunic' as const, boots: true, trim, sewn: true });
  // braced, a spear held across the body with its point forward and up
  let out = figure(
    c,
    { ...SAPIENS, H: 127 },
    { skin: '#6b4833', hood: '#6a523a', wear: dress('#77603f') },
    { x: -82, lean: 6, legs: [[16, 8], [-18, 12, 10]], arms: [[42, 62], [8, 46]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      return { mid: spear(c, [hx - 34, hy + 38], [hx + 20, hy - 30], true) };
    },
  );
  // running, a spear leveled at the hip in both hands
  out += figure(
    c,
    { ...SAPIENS, H: 124, wide: 0.97 },
    { skin: '#74503a', hood: '#7a6044', wear: dress('#8a6f4c') },
    { x: -8, lean: 15, nod: -6, legs: [[34, 16, 0], [-28, 62, 40]], arms: [[26, 58], [52, 28]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      const [gx, gy] = f.hands[1];
      const ux = gx - hx;
      const uy = gy - hy;
      const l = Math.hypot(ux, uy) || 1;
      return { mid: spear(c, [hx - (ux / l) * 34, hy - (uy / l) * 34], [gx + (ux / l) * 30, gy + (uy / l) * 30], true) };
    },
  );
  // in a long stride, the arm drawn back to throw
  out += figure(
    c,
    SAPIENS,
    { skin: '#684531', hood: '#62492f', wear: dress('#6f5638') },
    { x: 70, lean: 2, nod: -4, legs: [[38, 26], [-34, 10, 22]], arms: [[-100, -72], [72, 12]] },
    (f) => {
      const [hx, hy] = f.hands[0];
      return { mid: spear(c, [hx - 40, hy + 9], [hx + 46, hy - 10], true) };
    },
  );
  return out;
}

// ---- people for the two painted pictures of human history ---------------------------------
// Fourteen small groups, one for each scene of those pictures; the whitelist keeps every one of them out of the
// chapter scenes. Each person is drawn round their own feet and then moved to a place of their own, so a painter can
// crop or mirror a group. Their sources are the three dossiers docs/research/great-events-civilization*.md.

const WOMAN: Species = { ...SAPIENS, H: 123, wide: 0.95 };
const YOUTH: Species = { ...SAPIENS, H: 104, head: 0.15, wide: 0.94 };
const DARK = '#17120f';
const OCHRE = '#a8402a';
const CANE = '#b89a62';
type Wear = NonNullable<Look['wear']>;
/** The plain short wrap worn where nothing is known of dress: a painter's convention, the same in all five scenes. */
const WRAP: Wear = { hide: '#a8946c', skirt: 0.56 };

/** One person of a group, moved to stand at x; `flip` turns them to face left. */
function person(c: PartCtx, sp: Species, lk: Look, ps: Omit<Pose, 'x'>, x: number, props?: (f: Frame) => Props, flip = false): string {
  return group(figure(c, sp, lk, { x: 0, ...ps }, props), x, 0, 1, flip);
}

/** A small stone lamp with its flame, resting on the hand at p. */
function lamp(c: PartCtx, p: V): string {
  const [x, y] = p;
  return (
    path(`M${n(x - 2.6)},${n(y - 1)}C${n(x - 4)},${n(y - 6)} ${n(x)},${n(y - 7)} ${n(x + 0.4)},${n(y - 12)}C${n(x + 4)},${n(y - 7)} ${n(x + 3.4)},${n(y - 4)} ${n(x + 2.6)},${n(y - 1)}Z`, c.tone('#f2c552')) +
    path(`M${n(x - 6.5)},${n(y - 1.6)}L${n(x + 6.5)},${n(y - 1.6)}C${n(x + 5)},${n(y + 3.4)} ${n(x - 5)},${n(y + 3.4)} ${n(x - 6.5)},${n(y - 1.6)}Z`, c.tone('#a79882'))
  );
}

/** A flat grinding stone on the ground at x, its top `h` high; `smear` is the colour of what is ground on it. */
function grindstone(c: PartCtx, x: number, h: number, smear?: string): string {
  return path(`M${n(x - 17)},0C${n(x - 16)},${n(-h * 1.25)} ${n(x + 14)},${n(-h * 1.35)} ${n(x + 17)},0Z`, c.tone('#a39178')) + (smear ? ell(x, -h * 0.86, 9, 1.7, c.tone(smear)) : '');
}

/** A hatchet: a wooden handle from a to b, with a ground-edge stone head bound across it just short of b. */
function hatchet(c: PartCtx, a: V, b: V): string {
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
  const ux = (b[0] - a[0]) / l;
  const uy = (b[1] - a[1]) / l;
  const h: V = [b[0] - ux * 3.5, b[1] - uy * 3.5];
  // the head lies across the handle: `k` along the handle, `s` out to the cutting edge
  const p = (k: number, s: number) => `${n(h[0] + ux * k + uy * s)},${n(h[1] + uy * k - ux * s)}`;
  return (
    line(`M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`, c.tone(WOOD), 2.2) +
    path(`M${p(-2, -3.5)}L${p(-4, 10)}Q${p(0, 12)} ${p(4, 10)}L${p(2, -3.5)}Z`, c.tone('#5c625f')) +
    line(`M${p(-3, 1.6)}L${p(3, -1.6)}M${p(-3, -1.6)}L${p(3, 1.6)}`, c.tone('#3d2e20'), 1.1)
  );
}

/**
 * A basket with the middle of its rim at p and its rim 2r across, heaped with a `load` of this colour.
 * `mesh` makes it an open net bag, through which the load shows.
 */
function basket(c: PartCtx, p: V, r: number, load?: string, mesh = false): string {
  const [x, y] = p;
  const body = `M${n(x - r)},${n(y)}L${n(x + r)},${n(y)}C${n(x + r * 0.96)},${n(y + r * 1.1)} ${n(x + r * 0.6)},${n(y + r * 1.55)} ${n(x)},${n(y + r * 1.55)}C${n(x - r * 0.6)},${n(y + r * 1.55)} ${n(x - r * 0.96)},${n(y + r * 1.1)} ${n(x - r)},${n(y)}Z`;
  let out = load ? ell(x, y, r * 0.88, r * 0.52, c.tone(load)) : '';
  out += path(body, c.tone(mesh && load ? load : CANE));
  if (mesh) out += line(`M${n(x - r)},${n(y)}L${n(x + r * 0.3)},${n(y + r * 1.5)}M${n(x - r * 0.2)},${n(y)}L${n(x + r * 0.8)},${n(y + r * 1.1)}M${n(x + r)},${n(y)}L${n(x - r * 0.3)},${n(y + r * 1.5)}M${n(x + r * 0.2)},${n(y)}L${n(x - r * 0.8)},${n(y + r * 1.1)}M${n(x - r)},${n(y)}L${n(x + r)},${n(y)}`, c.tone(CANE), 1);
  else if (c.detail) out += line(`M${n(x - r * 0.93)},${n(y + r * 0.5)}Q${n(x)},${n(y + r * 0.72)} ${n(x + r * 0.93)},${n(y + r * 0.5)}M${n(x - r * 0.72)},${n(y + r * 1.05)}Q${n(x)},${n(y + r * 1.25)} ${n(x + r * 0.72)},${n(y + r * 1.05)}`, c.tone(darken(CANE, 0.3)), 0.9);
  return out;
}

/** A round-bodied pot or jar with a short neck, the middle of its belly at p; `band` is a pale band round its shoulder. */
function pot(c: PartCtx, p: V, r: number, col: string, band?: string): string {
  const [x, y] = p;
  let out = path(`M${n(x - r * 0.42)},${n(y - r * 0.6)}L${n(x - r * 0.62)},${n(y - r * 1.3)}L${n(x + r * 0.62)},${n(y - r * 1.3)}L${n(x + r * 0.42)},${n(y - r * 0.6)}Z`, c.tone(darken(col, 0.12)));
  out += ell(x, y, r, r * 0.92, c.tone(col));
  if (band) out += line(`M${n(x - r * 0.84)},${n(y - r * 0.4)}Q${n(x)},${n(y - r * 0.12)} ${n(x + r * 0.84)},${n(y - r * 0.4)}`, c.tone(band), r * 0.24);
  if (c.detail) out += ell(x - r * 0.3, y + r * 0.2, r * 0.3, r * 0.42, c.tone(lighten(col, 0.3)), 'opacity=".35"');
  return out;
}

/** A hauling rope through these points. */
const rope = (c: PartCtx, pts: Pt[]) => line(curve(pts), c.tone('#c8b081'), 1.8);

/** A belt or sash round the waist, drawn with the figure (not part of its clothing options). */
const belt = (c: PartCtx, f: Frame, col: string, w = 2.6) => {
  const a = f.at(-0.052, 0.3);
  const b = f.at(0.064, 0.33);
  return line(`M${n(a[0])},${n(a[1])}L${n(b[0])},${n(b[1])}`, c.tone(col), w);
};

/** A plain pole or digging stick through the hand at `hand`, from its point `down` units below to `up` units above, at `deg` from upright. */
function stick(c: PartCtx, hand: V, deg: number, down: number, up: number): string {
  const ux = Math.sin(rad(deg));
  const uy = -Math.cos(rad(deg));
  return line(`M${n(hand[0] + ux * up)},${n(hand[1] + uy * up)}L${n(hand[0] - ux * down)},${n(hand[1] - uy * down)}`, c.tone(WOOD), 2);
}
/** The same, reaching down from the hand to the ground. */
const dig = (c: PartCtx, hand: V, deg: number, up: number) => stick(c, hand, deg, -hand[1] / Math.cos(rad(deg)), up);

/** A1. Two people under a low cave ceiling: one reaches up to the rock with a hand red with ochre, one holds a lump of ochre. */
function peopleKarampuang(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#5f3f2d', hair: { col: DARK, vol: 6, len: 30 }, beard: true, wear: WRAP }, { nod: -14, ...STAND, arms: [[16, 96], [-6, 10]] }, -32, (f) => ({
    mid: cobble(c, [f.hands[0][0] + 2, f.hands[0][1] - 2], 3.6, OCHRE),
  }));
  out += person(c, WOMAN, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: WRAP }, { nod: -20, legs: [[7, 3], [-9, 5]], arms: [[160, 12], [-8, 12]] }, 26, (f) => ({
    front: circ(f.hands[0][0], f.hands[0][1], 3.4, c.tone(OCHRE)),
  }));
  return out;
}

/** A2. One kneels to grind red ochre on a flat stone; one stands fitting a ground-edge hatchet head to its handle. */
function peopleSahul(c: PartCtx): string {
  let out = person(c, WOMAN, { skin: '#5a3b2a', hair: { col: DARK, vol: 7, len: 32 }, wear: WRAP }, { lean: 46, nod: -6, legs: [[88, 98], [-6, 103, 82]], arms: [[18, 26], [30, 20]] }, -48, (f) => ({
    back: grindstone(c, f.hands[0][0] + 5, Math.max(5, Math.min(9, -f.hands[0][1] - 5)), OCHRE),
    mid: cobble(c, [f.hands[0][0] + 3, f.hands[0][1] + 1], 3.6, OCHRE),
  }));
  out += person(c, SAPIENS, { skin: '#523626', hair: { col: DARK, vol: 7, len: 32 }, beard: true, wear: WRAP }, { nod: 12, ...STAND, arms: [[14, 84], [30, 66]] }, 42, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: hatchet(c, [hx - 9, hy + 9], [hx + 17, hy - 20]) };
  });
  return out;
}

/** A3. One paints on a wall with an arm raised; one holds up a small stone lamp. Sewn hide clothing, no hoods. */
function peopleLascaux(c: PartCtx): string {
  const dress = (hide: string): Wear => ({ hide, skirt: 0.74, top: 'tunic', boots: true, sewn: true });
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 34 }, beard: true, wear: dress('#77603f') }, { nod: -6, ...STAND, arms: [[58, 66], [-6, 10]] }, -32, (f) => ({
    front: lamp(c, [f.hands[0][0] + 1, f.hands[0][1] - 4]),
  }));
  out += person(c, WOMAN, { skin: '#74503a', hair: { col: DARK, vol: 6, len: 32, bun: true }, wear: dress('#8a6f4c') }, { nod: -10, legs: [[8, 3], [-10, 5]], arms: [[122, 14], [-4, 14]] }, 30, (f) => ({
    front: cobble(c, [f.hands[0][0] + 3, f.hands[0][1] - 3], 2.6, OCHRE),
  }));
  return out;
}

/** A4. One climbs (a ladder, which the painter supplies), one carries a basket on the back, a child stands by. */
function peopleCatalhoyuk(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 32 }, beard: true, wear: { hide: '#8f7250', skirt: 0.8, top: 'tunic' } }, { lean: 10, nod: -8, legs: [[66, 84], [-6, 5]], arms: [[124, 16], [96, 34]] }, -54);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: { hide: '#b9a67e', skirt: 1, top: 'tunic' } }, { ...WALK_A, lean: 6, arms: [[-6, 148], [24, 22]] }, 6, (f) => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 11), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  });
  out += person(c, CHILD, { skin: '#7a553d', hair: { col: DARK, vol: 6, len: 30 }, wear: { hide: '#b9a67e', skirt: 0.9, top: 'tunic' } }, { ...STAND, nod: -8 }, 52);
  return out;
}

/** A5. Two people working garden mounds with plain wooden digging sticks. */
function peopleKuk(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#523626', hair: { col: DARK, vol: 7, len: 30 }, beard: true, wear: WRAP }, { lean: 20, nod: 12, legs: [[24, 12], [-22, 14, 12]], arms: [[62, 38], [30, 30]] }, -46, (f) => ({
    mid: dig(c, f.hands[0], 16, 30),
  }));
  out += person(c, WOMAN, { skin: '#5f3f2d', hair: { col: DARK, vol: 7, len: 30 }, wear: WRAP }, { lean: 48, nod: -12, legs: [[34, 30], [-14, 22, 12]], arms: [[26, 26], [44, 10]] }, 26, (f) => ({
    mid: dig(c, f.hands[0], -26, 26),
  }));
  return out;
}

/** A6. One carries a red pot with a pale band, one a basket of shellfish on the back, and a child walks ahead. */
function peopleNukuleka(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 30 }, wear: WRAP }, { ...WALK_B, lean: 5, arms: [[-6, 148], [-22, 14]] }, -50, (f) => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 11, '#e6dcc6'), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  });
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: WRAP }, { ...WALK_A, arms: [[22, 74], [34, 62]] }, 8, (f) => ({
    mid: pot(c, [f.hands[0][0] + 3, f.hands[0][1] - 6], 9.5, '#a9482e', '#efe6d2'),
  }));
  out += person(c, CHILD, { skin: '#7a553d', hair: { col: DARK, vol: 6, len: 30 }, wear: WRAP }, WALK_B, 54);
  return out;
}

/** B1. Two men lean into hauling ropes; a woman in a long white dress carries a jar on her hip. */
function peopleGiza(c: PartCtx): string {
  const kilt: Wear = { hide: '#ebe5d4', skirt: 0.72 };
  const haul = (f: Frame): Props => ({
    mid: rope(c, [[f.hands[0][0] + 3, f.hands[0][1] + 1], [f.sho[0] + 3, f.sho[1] - 6], [f.sho[0] - 5, f.sho[1] - 5, 1], [f.sho[0] - 62, f.sho[1] + 34]]),
  });
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 2.5, len: 26 }, wear: kilt }, { lean: 34, nod: -16, legs: [[44, 34], [-30, 6, 22]], arms: [[44, 96], [56, 84]] }, -46, haul);
  out += person(c, { ...SAPIENS, H: 126, wide: 1.03 }, { skin: '#5f3f2d', hair: { col: DARK, vol: 2.5, len: 26 }, wear: kilt }, { lean: 40, nod: -20, legs: [[-26, 8, 24], [48, 40]], arms: [[50, 92], [60, 80]] }, 24, haul);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 5, len: 40 }, wear: { hide: '#ebe5d4', top: 'tunic', long: 0.86 } }, { legs: [[7, 3], [-6, 5]], arms: [[-6, 80], [-8, 12]] }, 106, (f) => ({
    mid: pot(c, f.at(0.11, 0.3), 8.5, '#b5754a'),
  }));
  return out;
}

/** B2. Two carry open-mesh bags of stones on their backs; a third holds a net of dried fish. */
function peopleCaral(c: PartCtx): string {
  const carry = (f: Frame): Props => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 11, FLINT, true), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  };
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 34 }, wear: { hide: '#cdbb98', skirt: 1, top: 'tunic' } }, { ...WALK_B, lean: 12, arms: [[-6, 148], [-22, 14]] }, -58, carry);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 44 }, wear: { hide: '#b79c78', skirt: 1, top: 'tunic' } }, { ...WALK_A, lean: 12, arms: [[-6, 148], [24, 22]] }, 2, carry);
  out += person(c, { ...SAPIENS, H: 126 }, { skin: '#684531', hair: { col: DARK, vol: 6, len: 34 }, wear: { hide: '#cdbb98', skirt: 1, top: 'tunic' } }, { ...STAND, arms: [[30, 56], [-6, 10]] }, 58, (f) => {
    const [hx, hy] = f.hands[0];
    return { mid: line(`M${n(hx + 1)},${n(hy)}L${n(hx + 1)},${n(hy + 6)}`, c.tone(CANE), 1) + basket(c, [hx + 1, hy + 6], 6.5, '#aeb4b4', true) };
  });
  return out;
}

/** B3. A woman carries a water jar on her hip; a man walks with a hand out, as if beside a cart. */
function peopleMohenjodaro(c: PartCtx): string {
  let out = person(c, WOMAN, { skin: '#6b4833', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: { hide: '#c9b792', skirt: 1 } }, { ...WALK_A, arms: [[-4, 78], [24, 22]] }, -34, (f) => ({
    mid: pot(c, f.at(0.118, 0.3), 9.5, '#a85a3a'),
  }));
  out += person(c, SAPIENS, { skin: '#5f3f2d', hair: { col: DARK, vol: 4, len: 30 }, beard: true, wear: { hide: '#d8ccb0', skirt: 1, top: 'tunic' } }, { ...WALK_B, arms: [[58, 30], [-22, 14]] }, 34);
  return out;
}

/** B4. A shaved-headed man and a woman in long robes walk together; a laborer in a short kilt works the ground with a stick. */
function peopleUr(c: PartCtx): string {
  const trim = '#f1ead8';
  let out = person(c, SAPIENS, { skin: '#6b4833', wear: { hide: '#d6cbb0', top: 'tunic', long: 0.88, trim } }, { legs: [[14, 4], [-12, 8, 12]], arms: [[-10, 12], [16, 18]] }, -58);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 5, len: 30, bun: true }, wear: { hide: '#bfa67a', top: 'tunic', long: 0.92, trim } }, { legs: [[-10, 8, 12], [12, 4]], arms: [[14, 20], [-10, 12]] }, -4);
  out += person(c, { ...SAPIENS, H: 127 }, { skin: '#5f3f2d', hair: { col: DARK, vol: 3, len: 27 }, wear: { hide: '#cfc3a6', skirt: 0.7 } }, { lean: 24, nod: 10, legs: [[-20, 14, 12], [26, 12]], arms: [[56, 40], [34, 30]] }, 50, (f) => ({
    mid: dig(c, f.hands[0], 14, 30),
  }));
  return out;
}

/** B5. Three people carry baskets of earth: one on the back, one on the shoulder, one in the arms. */
function peoplePovertypoint(c: PartCtx): string {
  const earth = '#6e4b32';
  let out = person(c, SAPIENS, { skin: '#684531', hair: { col: DARK, vol: 6, len: 40 }, wear: WRAP }, { ...WALK_B, lean: 14, arms: [[-6, 148], [-22, 14]] }, -58, (f) => {
    const p = f.at(-0.125, 0.98);
    return { back: basket(c, p, 12, earth), mid: line(curve([[p[0] + 6, p[1] + 4], [f.sho[0] - 2, f.sho[1] - 3], f.hands[0]]), c.tone('#5a4532'), 1.3) };
  });
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 44 }, wear: WRAP }, { ...WALK_A, lean: 10, arms: [[156, 104], [24, 22]] }, 0, (f) => ({
    back: basket(c, [f.sho[0] - 12, f.sho[1] - 23], 11, earth),
  }));
  out += person(c, { ...SAPIENS, H: 126 }, { skin: '#5f3f2d', hair: { col: DARK, vol: 6, len: 34 }, wear: WRAP }, { ...WALK_B, lean: 8, arms: [[24, 78], [36, 66]] }, 56, (f) => ({
    mid: basket(c, [f.hands[0][0] + 2, f.hands[0][1] - 12], 11, earth),
  }));
  return out;
}

/** B6. Bronze workers in belted robes, hair in a knot: one kneels to tend a fire, one brings firewood. */
function peopleAnyang(c: PartCtx): string {
  const sash = '#4f3527';
  const knot = { col: DARK, vol: 4, len: 28, bun: true };
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: knot, wear: { hide: '#8f8a66', top: 'tunic', long: 0.74 } }, { lean: 16, nod: 6, legs: [[88, 98], [-6, 103, 82]], arms: [[48, 30], [36, 40]] }, -52, (f) => {
    const [hx, hy] = f.hands[0];
    return { back: fire(c, hx + 28), mid: belt(c, f, sash) + line(`M${n(hx - 4)},${n(hy - 2)}L${n(hx + 20)},${n(hy + 12)}`, c.tone(WOOD), 1.8) };
  });
  out += person(
    c,
    WOMAN,
    { skin: '#73503a', hair: knot, wear: { hide: '#9a7c57', top: 'tunic', long: 0.74 } },
    { legs: [[14, 4], [-12, 8, 12]], lean: 4, arms: [[28, 70], [38, 60]] },
    70,
    (f) => ({ mid: belt(c, f, sash), front: firewood(c, [f.hands[0][0] + 1, f.hands[0][1] - 5], 40, 78) }),
    true,
  );
  return out;
}

/** B7. Loincloth and belt: a man in a short cape walking with a pole, a woman kneeling at a grinding slab with a handstone. */
function peopleLaventa(c: PartCtx): string {
  const band = '#7b3f2c';
  let out = person(c, SAPIENS, { skin: '#684531', hair: { col: DARK, vol: 5, len: 30 }, wear: { hide: '#d3c6a4', skirt: 0.36, top: 'cape', capeLen: 0.52 } }, { ...WALK_B, arms: [[30, 44], [-22, 14]] }, -40, (f) => ({
    mid: belt(c, f, band) + dig(c, f.hands[0], -8, 46),
  }));
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 6, len: 30, bun: true }, wear: { hide: '#d3c6a4', skirt: 0.5 } }, { lean: 46, nod: -6, legs: [[88, 98], [-6, 103, 82]], arms: [[18, 26], [30, 20]] }, 22, (f) => ({
    back: grindstone(c, f.hands[0][0] + 5, Math.max(5, Math.min(9, -f.hands[0][1] - 5))),
    mid: belt(c, f, band) + cobble(c, [f.hands[0][0] + 3, f.hands[0][1] + 1], 3.6),
  }));
  return out;
}

/** B8. A bearded man in a tunic, a woman in a long dress with a water jar on her head, and a child. */
function peopleAthens(c: PartCtx): string {
  let out = person(c, SAPIENS, { skin: '#6b4833', hair: { col: DARK, vol: 5, len: 30 }, beard: true, wear: { hide: '#a4623f', skirt: 0.92, top: 'tunic' } }, WALK_B, -52);
  out += person(c, WOMAN, { skin: '#73503a', hair: { col: DARK, vol: 5, len: 30, bun: true }, wear: { hide: '#c9a651', top: 'tunic', long: 0.93 } }, { legs: [[12, 4], [-10, 8, 10]], arms: [[146, 70], [-8, 12]] }, 4, (f) => ({
    back: pot(c, [f.head[0] - 1, f.head[1] - f.H * 0.066 - 10], 10, '#b5653a'),
  }));
  out += person(c, YOUTH, { skin: '#7a553d', hair: { col: DARK, vol: 5, len: 30 }, wear: { hide: '#d9ceb2', skirt: 0.8, top: 'tunic' } }, WALK_A, 52);
  return out;
}

export const PAINTING_PARTS: Record<string, PartDef> = {
  hunter: { role: 'walker', w: 236, h: 150, anchor: 'base', draw: hunter },
  'people-karampuang': { role: 'walker', w: 120, h: 162, anchor: 'base', draw: peopleKarampuang },
  'people-sahul': { role: 'walker', w: 160, h: 134, anchor: 'base', draw: peopleSahul },
  'people-lascaux': { role: 'walker', w: 130, h: 150, anchor: 'base', draw: peopleLascaux },
  'people-catalhoyuk': { role: 'walker', w: 170, h: 150, anchor: 'base', draw: peopleCatalhoyuk },
  'people-kuk': { role: 'walker', w: 190, h: 134, anchor: 'base', draw: peopleKuk },
  'people-nukuleka': { role: 'walker', w: 170, h: 134, anchor: 'base', draw: peopleNukuleka },
  'people-giza': { role: 'walker', w: 270, h: 134, anchor: 'base', draw: peopleGiza },
  'people-caral': { role: 'walker', w: 180, h: 134, anchor: 'base', draw: peopleCaral },
  'people-mohenjodaro': { role: 'walker', w: 130, h: 134, anchor: 'base', draw: peopleMohenjodaro },
  'people-ur': { role: 'walker', w: 200, h: 140, anchor: 'base', draw: peopleUr },
  'people-povertypoint': { role: 'walker', w: 180, h: 140, anchor: 'base', draw: peoplePovertypoint },
  'people-anyang': { role: 'walker', w: 200, h: 134, anchor: 'base', draw: peopleAnyang },
  'people-laventa': { role: 'walker', w: 164, h: 140, anchor: 'base', draw: peopleLaventa },
  'people-athens': { role: 'walker', w: 160, h: 150, anchor: 'base', draw: peopleAthens },
};
