// Drawings: fishes of the Paleozoic.
// One function per part. The drawing conventions are at the top of ../part.ts;
// the matching whitelist entries are in ../whitelist/fish-paleozoic.ts.

import { circ, ell, group, line, n, path, poly } from '../draw';
import { type PartCtx, type PartDef } from '../part';

type Pt = [number, number];

/** An eye: a pale ring with a dark pupil set slightly forward. */
const eye = (c: PartCtx, x: number, y: number, r: number, ring = '#e6dcae') =>
  circ(x, y, r, c.tone(ring)) + circ(x + r * 0.12, y, r * 0.58, c.tone('#15181a'));

/** A row of short strokes across a body, for scale rows: from (x, top) slanting back to (x - lean, bot). */
function rows(x0: number, x1: number, step: number, lean: number, top: (x: number) => number, bot: (x: number) => number): string {
  let d = '';
  for (let x = x0; x >= x1; x -= step) d += `M${n(x)},${n(top(x))}L${n(x - lean)},${n(bot(x - lean))}`;
  return d;
}

// ---- conodont animals ------------------------------------------------------

function conodont(c: PartCtx): string {
  const { rng, tone } = c;
  let fins = '';
  let bodies = '';
  let bellies = '';
  let chev = '';
  let eyes = '';
  const tails: Pt[] = [
    [-70, -17],
    [-22, 3],
    [-62, 21],
  ];
  for (const [tx, ty] of tails) {
    const x0 = tx + rng.range(-5, 5);
    const y0 = ty + rng.range(-3, 3);
    const L = rng.range(82, 94);
    const ph = rng.range(0, 6.3);
    const N = 16;
    const top: Pt[] = [];
    const bot: Pt[] = [];
    const mid: Pt[] = [];
    let hx = 0;
    let hy = 0;
    for (let k = 0; k <= N; k++) {
      const t = k / N;
      const x = x0 + L * t;
      const y = y0 + 5.5 * (1 - t * 0.75) * Math.sin(ph + t * 6.5);
      const hw = 4.1 * Math.min(1, Math.pow(t * 2.6 + 0.04, 0.7)) * (t > 0.86 ? 1 - (t - 0.86) * 1.6 : 1);
      top.push([x, y - hw]);
      bot.unshift([x, y + hw]);
      mid.push([x, y + hw * 0.25]);
      if (k >= 3 && k <= N - 2) chev += `M${n(x - 2.6)},${n(y - hw * 0.85)}L${n(x + 1.4)},${n(y)}L${n(x - 2.6)},${n(y + hw * 0.85)}`;
      hx = x;
      hy = y;
    }
    bodies += poly([...top, ...bot]);
    bellies += poly([...mid, ...bot]);
    // the small ray-supported fin round the tail tip
    const [ax, ay] = top[0]!;
    const [bx, by] = top[4]!;
    fins += `M${n(bx)},${n(by - 1)}L${n(ax - 3)},${n(ay - 6.5)}L${n(ax - 8)},${n(ay + 1)}L${n(ax - 1)},${n(ay + 5.5)}L${n(bx - 6)},${n(by + 6)}Z`;
    eyes += circ(hx - 1.5, hy - 0.6, 3.6, tone('#f1e9cf')) + circ(hx - 0.9, hy - 0.6, 2.1, tone('#1b1a18'));
  }
  let out = path(fins, tone('#d9c7a6'), 'opacity=".8"');
  out += path(bodies, tone('#a88a72')) + path(bellies, tone('#e0cdb0'), 'opacity=".7"');
  if (c.detail) out += line(chev, tone('#6e5446'), 0.7, 'opacity=".6"');
  return out + eyes;
}

// ---- armoured jawless fish -------------------------------------------------

function jawlessOne(c: PartCtx): string {
  const { tone } = c;
  const shield = tone('#8b7650');
  const dark = tone('#54482f');
  const trunk = tone('#7b7c5c');
  // tail: the lower lobe is the longer one in these fishes
  let out = path('M-26,-2.6L-39,-9C-37,-5 -37,-2 -38,1L-45,9.5L-26,2.8Z', tone('#9a9a74'));
  out += path('M-25,-2.8L-45,9.5L-40,9L-25,3Z', trunk);
  // scaly trunk
  out += path('M4,-9.6C-8,-8 -18,-5 -27,-2.8L-27,2.8C-18,5 -8,7.5 4,8.6Z', trunk);
  out += path('M4,8.6C-8,7.5 -18,5 -27,2.8L-27,0.6C-16,1.6 -6,2.4 4,2.6Z', tone('#c2bd92'));
  if (c.detail) {
    out += line(
      rows(
        0,
        -24,
        4.6,
        2.4,
        (x) => -9 + (4 - x) * 0.21,
        (x) => 8.2 - (4 - x) * 0.18,
      ),
      dark,
      0.7,
      'opacity=".55"',
    );
  }
  // dorsal spine at the back of the shield
  out += path('M10,-10.4L-3,-18L2,-9.4Z', dark);
  // head shield: an upper and a lower plate, with a pointed snout over the mouth
  out += path('M2,-9.8C14,-12 29,-9 43,-0.8L36.5,3.2C28,8 14,9.8 2,8.8Z', shield);
  out += path('M3,1.4C15,2.6 28,2.6 38,2.2L36.5,3.2C28,8 14,9.8 2,8.8Z', tone('#cdbf90'));
  out += path('M7,-8.8C16,-10 26,-7.6 35,-3.2C26,-6 16,-7.6 7,-7.2Z', tone('#b9a471'), 'opacity=".8"');
  out += line('M3,1.2C15,2.4 28,2.4 39,1.6', dark, 0.8, 'opacity=".7"');
  if (c.detail) out += line('M5,-5.5C14,-6.6 23,-5 31,-1.6M8,-2.2C14,-2.6 20,-2 26,-0.6M6,-1.5L3,0.8', dark, 0.6, 'opacity=".45"');
  out += circ(33.5, -1.2, 1.7, tone('#e6dcae')) + circ(33.7, -1.2, 1, tone('#15181a'));
  return out;
}

function jawlessfish(c: PartCtx): string {
  const { rng } = c;
  const one = jawlessOne(c);
  const spots: [number, number, number][] = [
    [-30, -21, 0.92],
    [32, -3, 1.04],
    [-26, 20, 0.86],
  ];
  let out = '';
  for (const [x, y, s] of spots) out += group(one, x + rng.range(-5, 5), y + rng.range(-3, 3), s, false, rng.range(-5, 5));
  return out;
}

// ---- thelodonts ------------------------------------------------------------

/**
 * One thelodont, about 80 long, after Phlebolepis elegans of the Silurian of Estonia (Wilson and Märss 2012): a jawless
 * fish with no armor, clothed in tiny scales. Tadpole-shaped: the head and gill region is half its length, then a short
 * trunk and a narrow tail stalk. The tail is longest and stoutest in its lower lobe.
 */
function thelodontOne(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#857f62');
  const web = tone('#b1ab88');
  const dark = tone('#4b4836');
  // the tail: a slightly forked web, with the body running down into the lower lobe
  let out = path('M-21,-2.4L-37,-10.5C-34.5,-6 -33.5,-2 -34,1.5C-34.5,5 -36.5,8.5 -40,11.5L-21,2Z', web);
  out += path('M-20,-2.4L-40,11.5L-34.5,4.6L-21,2Z', back);
  // one small low fin on the back, far to the rear, and one beneath, a little behind it
  out += path('M-8,-5.2L-14.5,-9.6L-17,-3.4ZM-12,4L-17.5,7.8L-19.5,2.6Z', web, 'opacity=".9"');
  out += path('M41,0.8C39,-3.6 33,-7 24,-8.2C12,-9.4 0,-7.4 -10,-4.6C-15,-3.4 -19,-2.6 -22,-2.2L-22,1.8C-18,2.4 -12,3.6 -6,5C4,7.4 14,8.4 22,8C31,7.4 38,4.8 41,0.8Z', back);
  out += path('M41,0.8C38,4.8 31,7.4 22,8C14,8.4 4,7.4 -6,5C-12,3.6 -18,2.4 -22,1.8C-12,2 4,2.8 20,2.8C29,2.6 36,2 41,0.8Z', tone('#d8d2ae'));
  // the thin flap along each side, from just behind the eye to the end of the gill region
  out += path('M33,3.4L5,5.4L-1,10.5C9,10.2 22,7.6 33,3.4Z', web);
  // the skin of small scales, as a faint grain along the body
  if (c.detail) out += line('M31,-4.4C17,-6.6 2,-5.2 -18,-1.4M33,-1C17,-2.6 2,-1.6 -18,0.4', dark, 0.5, 'opacity=".3"');
  // small eyes at the front corners of the head
  out += ell(37, -1.3, 1.7, 1.2, tone('#e6dcae')) + ell(37.2, -1.3, 1, 0.75, tone('#15181a'));
  return out;
}

/** A small shoal of three, each in its own group so that each can move on its own. Laid out as the armored jawless fish are. */
function thelodont(c: PartCtx): string {
  const { rng } = c;
  const one = thelodontOne(c);
  const spots: [number, number, number][] = [
    [-30, -21, 0.92],
    [32, -3, 1.04],
    [-26, 20, 0.86],
  ];
  let out = '';
  for (const [x, y, s] of spots) out += group(one, x + rng.range(-5, 5), y + rng.range(-3, 3), s, false, rng.range(-5, 5));
  return out;
}

// ---- spiny sharks ----------------------------------------------------------

function acanthodianOne(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#5e7068');
  const web = tone('#8fa39a');
  const spine = tone('#efe6c8');
  // fin webs, each hung from the spine in front of it
  let out = path(
    'M8,-6.5L3.5,-16L-2,-6.4ZM-9,-5.6L-13.5,-14L-18,-3.6ZM17,4.6L10,13L8.5,5.6ZM-2,5.8L-7.5,12.5L-9.5,5ZM-12,4.2L-17.5,11L-19.5,2.6Z',
    web,
    'opacity=".85"',
  );
  // uneven tail: the body runs up into the long upper lobe
  out += path('M-21,-2.2L-35,-13.5C-32,-8 -30,-4 -29,-1C-29,2 -30,4.5 -31,7L-21,2.2Z', web);
  out += path('M-20,-2.4L-35,-13.5L-31.5,-8.6L-21,1.6Z', back);
  out += path('M28,0.5C25,-4.6 13,-7.2 0,-6.6C-10,-6 -17,-3.6 -22,-2.2L-22,2.2C-14,4 -4,6 6,6C16,6 24,4.4 28,0.5Z', back);
  out += path('M28,0.5C24,4.4 16,6 6,6C-4,6 -14,4 -22,2.2C-12,2.2 4,2 16,1.6C22,1.4 26,1 28,0.5Z', tone('#d6dcc6'));
  // the spines
  out += line('M8.4,-6.6L3.5,-16M-8.6,-5.7L-13.5,-14M17.4,4.6L10,13M-1.6,5.8L-7.5,12.5M-11.6,4.3L-17.5,11M10,6L8,9.6M5,6.1L3,9.6', spine, 1.5);
  if (c.detail) out += line('M17.5,-4.6C16,-1.5 16,2 17.5,4.6M15,-5.2C13.6,-2 13.6,2 15,5', tone('#39473f'), 0.6, 'opacity=".6"');
  out += circ(22.6, -1.6, 2.5, tone('#e6dcae')) + circ(22.9, -1.6, 1.5, tone('#15181a'));
  return out;
}

function acanthodian(c: PartCtx): string {
  const { rng } = c;
  const one = acanthodianOne(c);
  const spots: [number, number, number][] = [
    [-42, -24, 1.0],
    [20, -27, 1.12],
    [-8, 1, 1.22],
    [46, 9, 0.98],
    [-44, 24, 1.08],
  ];
  let out = '';
  for (const [x, y, s] of spots) out += group(one, x + rng.range(-5, 5), y + rng.range(-3, 3), s, false, rng.range(-6, 6));
  return out;
}

// ---- Dunkleosteus ----------------------------------------------------------

function dunkleosteus(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#56696b');
  const finDark = tone('#44565a');
  const belly = tone('#d3d6c2');
  const plate = tone('#767762');
  const plateLo = tone('#b9b89a');
  const seam = tone('#34382f');
  const bone = tone('#e9e1c2');
  // tail and fins of the unarmoured rear
  let out = path('M-96,-9L-140,-48C-128,-28 -121,-12 -118,3C-120,14 -125,28 -133,42L-96,9Z', back);
  out += path('M-46,26L-64,43L-68,21ZM-78,15L-91,27L-94,11Z', finDark);
  out += path('M36,-34C5,-36 -50,-22 -100,-5L-100,9C-55,28 -5,45 36,43Z', back);
  out += path('M36,43C-5,45 -55,28 -100,9C-60,13 -10,22 36,20Z', belly);
  out += path('M-4,-31C-16,-48 -30,-56 -44,-57C-41,-45 -43,-33 -52,-22Z', back);
  // mouth cavity, then the trunk shield
  out += path('M94,16L137,4L134,30L100,32Z', tone('#2a211f'));
  out += path('M86,-32C70,-36 52,-37 37,-35C32,-22 29,-6 29,6C28,20 26,33 22,43C48,49 76,46 99,35L92,22L82,2Z', plate);
  out += path('M29,14C50,20 76,22 92,22L99,35C76,46 48,49 22,43C25,33 27,24 29,14Z', plateLo);
  // near-side pectoral fin, from the opening low in the trunk shield
  out += path('M52,31C46,46 32,58 14,62C19,50 24,40 30,32Z', finDark);
  // skull
  out += path('M139,-1C135,-18 113,-29 86,-32L80,2L90,23C108,16 120,12 130,9L139,7Z', plate);
  out += path('M132,-9C124,-19 108,-26 90,-28C106,-22 120,-16 130,-5Z', tone('#9a9a80'), 'opacity=".7"');
  // jaw blades: bone, not teeth
  out += path('M138,6L135.5,20L130,9ZM129,9.5L124.5,18L106,19L99,21L110,15Z', bone);
  out += path('M91,23L98,37C112,42 125,38 135,29L132,13L127.5,24L112,26L100,25Z', plate);
  out += path('M132,13L127.5,24L112,26L100,25L112,23.6L126,21.6L130.4,13.6Z', bone);
  out += path('M98,37C112,42 125,38 135,29L133.6,24C124,32 112,35 96,32.6Z', plateLo);
  if (c.detail) {
    out += line('M84,-14C66,-17 48,-15 31,-10M62,-36C59,-26 60,-18 62,-16M56,-14C54,4 54,14 52,19M86,-32L82,2L92,22', seam, 1, 'opacity=".6"');
    out += line('M108,-26C104,-18 104,-10 110,-4M110,-4C100,0 92,2 83,1M124,0C116,6 106,10 97,20', seam, 0.9, 'opacity=".55"');
    out += line('M-20,3C-45,8 -70,6 -96,1', tone('#3e4f52'), 0.9, 'opacity=".5"');
  }
  // eye with its ring of bony plates
  out += circ(119, -8, 7.2, bone) + circ(119, -8, 4.9, tone('#2c3a3c')) + circ(119.6, -8, 2.6, tone('#0f1213'));
  return out;
}

// ---- Bothriolepis ----------------------------------------------------------

function bothriolepis(c: PartCtx): string {
  const { tone } = c;
  const soft = tone('#6f7c5e');
  const box = tone('#8d744c');
  const boxLo = tone('#c9b386');
  const dark = tone('#4a3b25');
  // far-side arm
  let out = path('M46,3L49,9L31,25L27,21ZM28,21.5L31,25L17,35Z', tone('#5d4b30'));
  // soft tail with its fin and uneven tail
  out += path('M-10,-14L-21,-29C-23,-21 -27,-14 -32,-9Z', tone('#8f9c7c'));
  out += path('M-44,-5L-67,-17C-61,-8 -57,0 -51,8C-45,5 -38,5 -30,6Z', tone('#8f9c7c'));
  out += path('M8,-17C-12,-15 -30,-9 -44,-6L-67,-17L-62,-11L-42,2C-28,7 -8,10 8,10Z', soft);
  out += path('M8,10C-8,10 -28,7 -42,2C-28,2 -8,3 8,3Z', tone('#c5c8a2'));
  // the armour box: trunk shield and, in front, the head shield
  out += path('M4,11L4,-15C10,-22 18,-26 26,-25C36,-24 44,-19 50,-15C57,-12 62,-7 64,0C64,6 60,10 54,11Z', box);
  out += path('M4,2C20,3 34,3.4 47,3L62,4C61,8 58,10.6 54,11L4,11Z', boxLo);
  out += path('M9,-17C15,-22 21,-23.6 27,-23C35,-22 42,-18 47,-15C39,-18 30,-20 22,-19.6C16,-19 12,-18 9,-17Z', tone('#b39a68'), 'opacity=".8"');
  out += line('M47,-16.5C45,-8 45.5,3 47.5,11', dark, 1.1, 'opacity=".75"');
  if (c.detail) {
    out += line('M4,-4C18,-2.6 32,-1.6 46,-2M25,-25C24,-17 24.6,-9 26,-2.6M26,-2.6C25,3 25,7 26,11M47,-4C53,-5 58,-4 63,-2', dark, 0.8, 'opacity=".55"');
    let pits = '';
    for (const [x, y] of [
      [10, -11],
      [15, -15],
      [18, -8],
      [33, -15],
      [38, -9],
      [31, -8],
      [12, -5.5],
      [40, -16],
      [53, -8],
      [57, -3],
    ] as const)
      pits += circ(x, y, 0.8, dark, 'opacity=".4"');
    out += pits;
  }
  // eyes sit close together on top of the head
  out += circ(55, -12.4, 2.9, tone('#e6dcae')) + circ(55.4, -12.6, 1.7, tone('#15181a'));
  out += line('M59,8.4L63.6,5', dark, 0.9);
  // near-side arm: two armoured segments with a joint, like a crab's leg
  out += path('M45,0.5L49,7.5L20,23L16,17Z', box) + path('M17,17.6L20,23L-7,30Z', box);
  out += path('M45,0.5L46.6,3.2L17.6,19.4L16,17Z', tone('#b39a68'));
  out += circ(18.4, 20.2, 2.6, dark) + circ(46.6, 4.2, 2.6, dark);
  return out;
}

// ---- lobe-finned predator --------------------------------------------------

function lobefin(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#66663a');
  const flank = tone('#8d8650');
  const belly = tone('#d6cf9f');
  const web = tone('#a99455');
  const dark = tone('#3d3c22');
  // three-pronged tail
  let out = path('M-100,-6C-108,-16 -119,-23 -131,-26C-128,-17 -127,-9 -128,-5L-139,0.5L-128,6C-127,11 -128,19 -131,28C-119,25 -108,17 -100,8Z', web);
  out += path('M-98,-6L-139,0.5L-98,8Z', flank);
  // fin webs: two dorsals set far back, anal, pelvic, pectoral
  out += path(
    'M-22,-17C-30,-31 -39,-36 -46,-36C-43,-27 -43,-21 -45,-15ZM-62,-13C-70,-28 -80,-33 -88,-33C-84,-24 -84,-15 -86,-9ZM-60,14C-68,27 -78,32 -88,32C-84,24 -83,16 -84,10ZM-16,18C-22,30 -33,37 -45,38C-42,30 -37,23 -31,18ZM86,13C82,27 69,38 54,40C57,31 63,22 71,15Z',
    web,
  );
  // body
  out += path(
    'M136,2C129,-6 113,-13 93,-16C50,-21 0,-20 -50,-15C-75,-12 -92,-8 -104,-5L-104,7C-90,10 -70,14 -45,17C0,22 50,21 91,17C111,14 127,9 136,2Z',
    flank,
  );
  out += path('M136,2C129,-6 113,-13 93,-16C50,-21 0,-20 -50,-15C-75,-12 -92,-8 -104,-5C-60,-8 0,-9 50,-8C90,-7 118,-4 136,2Z', back);
  out += path('M136,2C127,9 111,14 91,17C50,21 0,22 -45,17C-70,14 -90,10 -104,7C-60,9 0,11 50,10C90,9 120,6 136,2Z', belly);
  // the fleshy lobes that carry the fins
  out += path(
    'M-24,-17C-30,-25 -35,-28 -39,-28C-38,-23 -38,-19 -40,-15ZM-64,-13C-70,-22 -76,-25 -80,-25C-78,-20 -78,-15 -80,-10ZM-62,14C-68,22 -74,25 -80,25C-78,20 -78,15 -79,11ZM-18,18C-23,25 -30,29 -37,30C-35,25 -32,21 -29,18ZM84,14C80,23 72,29 63,31C65,25 69,19 74,15Z',
    flank,
  );
  if (c.detail) {
    let sc = '';
    for (let x = 78; x >= -92; x -= 8.5) {
      const h = 15.5 * Math.min(1, (x + 128) / 80);
      sc += `M${n(x)},${n(-h)}Q${n(x - 5)},0 ${n(x)},${n(h)}`;
    }
    out += line(sc, dark, 0.7, 'opacity=".3"');
    out += line('M-131,-26L-104,-5M-131,28L-104,7M-121,-19L-106,-3M-121,21L-106,6', dark, 0.6, 'opacity=".35"');
  }
  out += path('M60,-18.5l-6,9l-7,-9.6ZM28,-20l-6,9l-7,-9ZM-6,-19.4l-6,8l-7,-7.4ZM-44,-15.6l-5,6l-6,-4.6Z', dark, 'opacity=".3"');
  // head: long flat skull, long jaw, small eye far forward
  out += line('M135,3C124,7.5 110,9 95,8', dark, 1.1);
  out += line('M92,-16C86,-6 86,6 91,16', dark, 1, 'opacity=".6"');
  if (c.detail) out += line('M130,-4C120,-11 108,-14 96,-15M104,-3C100,2 99,5 100,8', dark, 0.7, 'opacity=".4"');
  out += eye(c, 119, -5, 3.1);
  return out;
}

// ---- coelacanth ------------------------------------------------------------

function coelacanth(c: PartCtx): string {
  const { tone } = c;
  const body = tone('#516471');
  const belly = tone('#9aa9a6');
  const web = tone('#3c4b59');
  const dark = tone('#26313a');
  // tail: an upper and a lower lobe, and the little tuft on the end of the body between them
  let out = path('M-40,-9C-47,-21 -57,-25 -66,-23C-66,-14 -66,-8 -64,-4L-64,5C-66,9 -66,15 -66,24C-57,26 -47,22 -40,10Z', web);
  out += path('M-66,-3.6C-71,-6.5 -76,-4.6 -78,0.5C-76,5.6 -71,7.5 -66,4.6Z', web);
  // first dorsal fin is a plain sail on spines; the other fins sit on fleshy stalks
  out += path('M30,-21C27,-35 19,-42 11,-43C13,-34 11,-27 7,-22Z', web);
  out += path(
    'M-12,-18C-18,-31 -28,-36 -37,-35C-34,-27 -33,-19 -35,-11ZM49,9C47,23 37,36 22,40C24,31 30,21 37,12ZM12,21C8,33 0,40 -11,42C-9,33 -5,27 0,21ZM-18,17C-24,29 -33,34 -42,34C-39,27 -37,19 -38,12Z',
    web,
  );
  out += path('M76,2C71,-8 59,-17 40,-21C20,-24 -5,-22 -25,-15C-35,-11 -42,-8 -46,-7L-67,-3.6L-67,4.6L-46,8C-38,10 -28,14 -15,18C5,24 30,23 50,17C63,13 72,8 76,2Z', body);
  out += path('M76,2C72,8 63,13 50,17C30,23 5,24 -15,18C-28,14 -38,10 -46,8C-20,9 20,9 50,6C62,5 70,4 76,2Z', belly);
  out += path(
    'M-14,-17C-19,-25 -24,-28 -29,-28C-28,-23 -28,-18 -29,-13ZM48,10C45,19 39,26 31,29C32,23 36,17 40,12ZM10,21C7,28 2,32 -4,33C-3,28 -1,24 1,21ZM-20,17C-25,24 -30,27 -35,27C-33,22 -33,17 -33,13Z',
    body,
  );
  if (c.detail) {
    out += line('M27,-22L14,-40M22,-22L19,-35M17,-22L12,-33M-64,-4L-48,-10M-66,-14L-45,-11M-64,5L-48,11M-66,15L-45,12M-60,-21L-43,-12M-60,22L-43,13', dark, 0.7, 'opacity=".5"');
    let sc = '';
    for (let x = 44; x >= -40; x -= 7) {
      const h = 18 * Math.min(1, (x + 70) / 50);
      sc += `M${n(x)},${n(-h)}Q${n(x - 4)},0 ${n(x)},${n(h)}`;
    }
    out += line(sc, dark, 0.6, 'opacity=".28"');
  }
  // pale flecks
  let fl = '';
  for (const [x, y, r] of [
    [30, -10, 2.4],
    [14, -14, 1.8],
    [2, -5, 2.6],
    [-14, -9, 2],
    [-28, -3, 1.8],
    [20, 2, 1.7],
    [-6, 5, 1.6],
    [40, -2, 1.6],
    [-40, 1, 1.5],
    [-54, -1, 1.3],
  ] as const)
    fl += ell(x, y, r * 1.3, r * 0.8, tone('#dfe5da'), 'opacity=".55"');
  out += fl;
  out += line('M75,3C69,7.5 63,8.6 57,7.6', dark, 1);
  out += line('M52,-18C46,-8 46,4 51,15', dark, 0.9, 'opacity=".6"');
  out += eye(c, 62, -5.5, 4.2, '#d9d6b4');
  return out;
}

// ---- lungfish --------------------------------------------------------------

function lungfish(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#6a6843');
  const belly = tone('#cbbd8c');
  const fin = tone('#8f8a56');
  const dark = tone('#3a381f');
  // one continuous fin from the back, round the pointed tail, to the belly
  let out = path('M6,-12C-18,-22 -50,-15.5 -77,0C-50,15.5 -22,20 0,12Z', fin);
  if (c.detail) {
    let rays = '';
    for (let i = 0; i < 12; i++) {
      const x = -4 - i * 5.6;
      const h = 18 - Math.abs(i - 3.5) * 1.1 - i * 0.5;
      rays += `M${n(x)},${n(-h * 0.5)}L${n(x - 5)},${n(-h)}M${n(x - 2)},${n(h * 0.5)}L${n(x - 7)},${n(h * 0.96)}`;
    }
    out += line(rays, dark, 0.6, 'opacity=".35"');
  }
  // leaf-shaped paired fins on thin stalks
  out += path('M50,9C46,18 37,25 26,28C29,20 36,13 43,9ZM-16,10C-21,18 -29,23 -38,24C-34,18 -29,13 -23,10Z', fin);
  out += path('M76,1C71,-7 60,-11.5 45,-12.5C20,-14 -10,-11 -35,-6C-52,-2.6 -66,-0.6 -75,0C-66,1 -52,4.4 -35,8C-10,13 20,14.4 45,12.6C60,11.6 71,8 76,1Z', back);
  out += path('M76,1C71,8 60,11.6 45,12.6C20,14.4 -10,13 -35,8C-52,4.4 -66,1 -75,0C-50,2 -10,5 30,4.6C52,4.2 66,3 76,1Z', belly);
  out += line('M49,9.5L28,27M-17,10.5L-36,23.5', dark, 1, 'opacity=".5"');
  if (c.detail) {
    let sc = '';
    for (let x = 40; x >= -48; x -= 7.5) {
      const h = 11.5 * Math.min(1, (x + 80) / 62);
      sc += `M${n(x)},${n(-h)}Q${n(x - 4.5)},0 ${n(x)},${n(h)}`;
    }
    out += line(sc, dark, 0.6, 'opacity=".3"');
  }
  out += path('M34,-13.4l-5,5l-6,-4.6ZM10,-13l-5,5l-6,-4.4ZM-16,-10.4l-5,4.6l-6,-3ZM-40,-5.4l-4,3.4l-5,-1.6Z', dark, 'opacity=".3"');
  out += line('M75.4,2C70,5.6 66,6.4 61,6', dark, 0.9);
  out += line('M54,-11.6C50,-4 50,4 53,11.6', dark, 0.8, 'opacity=".55"');
  out += eye(c, 65.5, -3.6, 2.2);
  return out;
}

// ---- Cladoselache ----------------------------------------------------------

function cladoselache(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#5f6b62');
  const fin = tone('#4b564f');
  const belly = tone('#d9dccb');
  const bone = tone('#e9e1c2');
  // nearly symmetrical, crescent tail
  let out = path('M-95,-5L-126,-44C-116,-24 -110,-11 -108,0C-110,11 -115,24 -124,41L-95,5Z', back);
  out += path('M-28,15L-45,31L-53,13Z', fin);
  out += path('M39,-22C31,-36 23,-42 14,-43C17,-34 16,-27 11,-20ZM-38,-14C-46,-27 -55,-32 -63,-32C-60,-24 -61,-16 -65,-9Z', back);
  out += path('M126,1C119,-9 101,-18 76,-21C40,-24 0,-21 -40,-14C-65,-10 -82,-6 -97,-5L-97,5C-80,7 -60,11 -35,15C5,21 50,20 86,15C106,12 120,7 126,1Z', back);
  out += path('M126,1C120,7 106,12 86,15C50,20 5,21 -35,15C-60,11 -80,7 -97,5C-60,6 -10,7 40,5C80,4 110,3 126,1Z', belly);
  out += ell(-99, 0, 9, 2, fin);
  // broad triangular pectoral fin
  out += path('M72,13L38,48C37,36 35,25 30,17Z', fin);
  // a short stout spine in front of each dorsal fin
  out += path('M42,-22L32,-35L36,-21.6ZM-35,-14.6L-45,-26L-41,-13.6Z', bone);
  out += line('M96,-12C94,-5 94,2 96,8M91,-13.5C89,-6 89,2 91,9M86,-14.6C84,-7 84,2 86,10M81,-15.4C79,-8 79,2 81,10.6M76,-16C74,-8 74,2 76,11', tone('#39423c'), 0.9, 'opacity=".7"');
  // mouth at the very front of the head
  out += line('M125.6,1.6C118,5.6 111,7 104,7', tone('#2c332e'), 1.1);
  out += eye(c, 113, -5, 4.4);
  return out;
}

// ---- Stethacanthus ---------------------------------------------------------

function stethacanthus(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#756a58');
  const fin = tone('#5b5245');
  const belly = tone('#ddd6bf');
  const dark = tone('#352f27');
  // uneven tail, upper lobe longer
  let out = path('M-90,-6L-121,-44C-112,-26 -106,-13 -103,-1C-104,8 -108,18 -114,30L-90,6Z', back);
  out += path('M-22,17L-37,32L-46,15ZM-56,-12C-62,-22 -69,-26 -76,-26C-73,-19 -74,-13 -77,-8Z', fin);
  // the brush: a stalk widening to a flat top set with small teeth
  out += path('M28,-22C27,-32 18,-41 8,-47L10,-52L62,-52L64,-47C54,-41 46,-32 46,-22Z', tone('#9c8f74'));
  out += path('M28,-22C27,-32 18,-41 8,-47L10,-52L22,-52C26,-42 30,-32 34,-22Z', tone('#b6aa8c'), 'opacity=".7"');
  let teeth = 'M9,-51.6';
  for (let x = 9; x < 62; x += 4.4) teeth += `l2.2,-5l2.2,5`;
  out += path(teeth + 'Z', dark);
  // body: short blunt snout, mouth underneath
  out += path('M120,2C116,-9 102,-18 80,-21C45,-25 5,-22 -35,-15C-60,-11 -78,-7 -92,-6L-92,6C-76,8 -56,12 -30,17C5,23 48,22 82,17C100,14 112,10 118,6Z', back);
  out += path('M118,6C112,10 100,14 82,17C48,22 5,23 -30,17C-56,12 -76,8 -92,6C-55,7 -10,8 40,6C78,5 104,5 118,6Z', belly);
  // a patch of the same small teeth on top of the head
  let cap = 'M78,-20.6';
  for (let x = 78; x < 104; x += 3.8) cap += `L${n(x + 1.9)},${n(-24.6 + (x - 78) * 0.22)}L${n(x + 3.8)},${n(-20.4 + (x + 3.8 - 78) * 0.25)}`;
  out += path(cap + 'Z', dark);
  // pectoral fin with a long trailing whip
  out += line('M38,17C14,30 -18,34 -50,29', fin, 1.6);
  out += path('M64,15L38,44C37,33 35,24 30,18Z', fin);
  out += line('M88,-12C86,-5 86,3 88,9M83,-13.6C81,-6 81,3 83,10M78,-14.6C76,-7 76,3 78,11M73,-15.4C71,-8 71,3 73,11.6', dark, 0.9, 'opacity=".6"');
  out += line('M116,7C110,10.6 104,11 98,9.6', dark, 1.1);
  out += eye(c, 106, -5, 3.8);
  return out;
}

// ---- Helicoprion -----------------------------------------------------------

function helicoprion(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#515f69');
  const fin = tone('#414e57');
  const belly = tone('#d2d6cc');
  const dark = tone('#273038');
  // tall crescent tail, single dorsal fin, big pectoral fin
  let out = path('M-104,-6L-136,-47C-126,-27 -120,-12 -118,0C-120,12 -125,27 -134,44L-104,6Z', back);
  out += path('M22,-27C12,-44 2,-52 -9,-54C-6,-44 -7,-34 -13,-25Z', back);
  // body and head: a long snout over an arched, toothless roof of the mouth
  out += path('M138,-7C126,-17 104,-24 78,-27C40,-31 -5,-27 -50,-17C-75,-11 -92,-7 -106,-6L-106,6C-88,8 -66,13 -40,18C0,26 44,26 74,21L79,9C87,3 95,-6 107,-7C117,-7.6 127,-4 133,0Z', back);
  out += path('M74,21C44,26 0,26 -40,18C-66,13 -88,8 -106,6C-60,8 -10,10 40,8C54,7.6 66,7.6 79,9Z', belly);
  out += ell(-108, 0, 9, 2, fin);
  // the open mouth, in shadow
  out += path('M79,9C87,3 95,-6 107,-7C117,-7.6 127,-4 133,0L127,19L92,16Z', tone('#2b2424'));
  // The tooth whorl: a spiral saw set upright in the midline of the lower jaw.
  // Only its upper half stands clear of the jaw. The newest and largest teeth
  // are at the back; older ones have moved forward and down into the coil.
  const cx = 107;
  const cy = 15;
  const R = 11;
  const at = (a: number, rr: number) => `${n(cx + Math.cos(a) * rr)},${n(cy - Math.sin(a) * rr)}`;
  let teeth = '';
  const N = 15;
  const step = (Math.PI * 1.52) / N;
  for (let i = 0; i < N; i++) {
    const a0 = Math.PI * 1.02 - i * step;
    const a1 = a0 - step;
    const h = 7.4 - i * 0.3;
    // each crown leans a little backward, like the teeth of a saw
    teeth += `M${at(a0 + 0.02, R - 0.6)}L${at((a0 + a1) / 2 + 0.11, R + h)}L${at(a1 - 0.02, R - 0.6)}Z`;
  }
  out += path(teeth, tone('#f1ead0'));
  out += circ(cx, cy, R, tone('#bfb18c'));
  // the inner turns of the spiral, with their small early teeth
  let coil = '';
  let ticks = '';
  for (let k = 0; k <= 30; k++) {
    const a = Math.PI * 0.9 - k * 0.3;
    const rr = 8.2 - k * 0.24;
    coil += (k ? 'L' : 'M') + at(a, rr);
    if (k % 2 === 0 && k < 26) ticks += `M${at(a, rr)}L${at(a + 0.1, rr + 2)}`;
  }
  out += line(coil, tone('#7d7257'), 1.5);
  if (c.detail) out += line(ticks, tone('#efe8cc'), 1);
  // the lower jaw: narrow and firm, closing over the lower half of the whorl
  out += path('M79,9L96,14.2L127,18.6C128.6,26 119,33 104,33C88,33 71,28 56,19L74,21Z', back);
  out += path('M56,19C71,28 88,33 104,33C113,33 120,30.4 124.4,26C110,31 84,28 64,20Z', belly);
  out += line('M96,14.2L127,18.6', dark, 1, 'opacity=".5"');
  if (c.detail) {
    // the buried half of the whorl shows as a faint swelling under the skin
    out += line(`M${at(Math.PI * 1.12, R + 1.5)}A${R + 1.5},${R + 1.5} 0 0 0 ${at(Math.PI * 1.9, R + 1.5)}`, dark, 1, 'opacity=".22"');
  }
  out += path('M58,19L30,54C29,42 27,31 22,23Z', fin);
  out += line('M72,-17C70,-9 70,2 72,10M67,-18.6C65,-10 65,2 67,11M62,-19.6C60,-11 60,2 62,12M57,-20.4C55,-12 55,3 57,12.6', dark, 0.9, 'opacity=".6"');
  out += eye(c, 113, -14.5, 3.6);
  return out;
}

// ---- xenacanth -------------------------------------------------------------

function xenacanth(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#6a6748');
  const fin = tone('#8a875c');
  const finDark = tone('#55533a');
  const belly = tone('#d2cb9e');
  const dark = tone('#33321f');
  // ribbon fin down the whole back, and a lower fringe meeting it at the pointed tail
  let out = path('M80,-13C60,-29 20,-29 -20,-25C-60,-21 -100,-13 -136,0L-50,-8C0,-12 50,-13 80,-13Z', fin);
  out += path('M-64,10C-88,19 -112,12 -136,0L-64,8Z', fin);
  if (c.detail) {
    let rays = '';
    for (let x = 66; x >= -116; x -= 9) {
      const top = -27.5 + Math.max(0, -x - 10) * 0.19 + Math.max(0, x - 50) * 0.3;
      rays += `M${n(x)},${n(-12 + Math.max(0, -x - 40) * 0.11)}L${n(x - 5)},${n(top)}`;
    }
    out += line(rays, dark, 0.6, 'opacity=".35"');
  }
  // two anal fins, pelvic fin, leaf-shaped pectoral fin
  out += path('M-28,13L-41,27L-45,11ZM-50,11L-62,24L-66,9ZM14,15L-1,30L-8,15Z', finDark);
  out += path('M136,2C129,-6 115,-11 97,-13C50,-15 0,-13 -50,-9C-90,-5 -120,-2 -137,0C-120,3 -90,7 -50,11C0,15 50,16 97,14C115,13 129,9 136,2Z', back);
  out += path('M136,2C129,9 115,13 97,14C50,16 0,15 -50,11C-90,7 -120,3 -137,0C-90,3 -30,6 30,6C80,6 115,4 136,2Z', belly);
  out += path('M52,-14.4l-6,8l-8,-7.8ZM22,-14.6l-6,8l-8,-7.6ZM-10,-13l-6,7l-8,-6ZM-42,-10l-5,6l-7,-4.6ZM-74,-6.6l-4,4.6l-6,-3ZM-102,-3.6l-3,3l-5,-2Z', dark, 'opacity=".32"');
  out += path('M74,13C68,26 57,34 44,36C48,28 55,19 62,14Z', finDark);
  out += line('M72,14L47,34', dark, 0.9, 'opacity=".5"');
  // the long spine on the back of the head
  out += path('M100,-13L56,-39L90,-13.6Z', tone('#e2d7ae')) + line('M99,-13.4L56,-39', tone('#5a4f33'), 1.1);
  out += line('M104,-9C102,-3 102,4 104,9M99,-11C97,-4 97,4 99,10.6M94,-12C92,-4 92,5 94,11.6M89,-12.6C87,-5 87,5 89,12', dark, 0.9, 'opacity=".6"');
  out += line('M135.4,2.6C128,6.6 121,7.6 113,7', dark, 1.1);
  out += eye(c, 121, -3.4, 3.2);
  return out;
}

// ---- early ray-finned fishes -----------------------------------------------

function palaeoniscoidOne(c: PartCtx): string {
  const { tone } = c;
  const back = tone('#786538');
  const flank = tone('#b69a55');
  const web = tone('#93835a');
  const dark = tone('#3f3418');
  // single dorsal fin set well back, and the lower fins
  let out = path('M1,-8L-8,-18L-11,-7ZM-6,7.6L-14,15.5L-16,5ZM7,8L1,14L-1,8ZM17,6L10,12L9,6.6Z', web);
  // uneven tail: the scaly body runs up the long upper lobe, the fin hangs below it
  out += path('M-19,-2.6L-35,-15C-32,-9 -30,-4 -29,0C-29,3 -30,7 -32,11L-19,2.6Z', web);
  out += path('M-18,-2.8L-35,-15L-32,-10.4L-19,1.6Z', flank);
  out += path('M27,0.4C25,-5 16,-8.4 6,-8.4C-6,-8.4 -14,-5.2 -20,-2.6L-20,2.6C-13,5.2 -4,8.2 6,8.2C16,8.2 24,5.2 27,0.4Z', flank);
  out += path('M27,0.4C25,-5 16,-8.4 6,-8.4C-6,-8.4 -14,-5.2 -20,-2.6C-10,-4.4 4,-4.8 14,-4C20,-3.4 24,-2 27,0.4Z', back);
  out += path('M27,0.4C24,5.2 16,8.2 6,8.2C-4,8.2 -13,5.2 -20,2.6C-10,3.6 4,4 14,3.4C20,3 24,2 27,0.4Z', tone('#e6dbac'));
  // shine along the thick enamelled scales
  out += path('M15,-2.6C6,-3.6 -6,-3 -17,-1C-6,-1.6 6,-1.6 15,-1.2Z', tone('#f4ecc8'), 'opacity=".75"');
  if (c.detail) {
    // diamond scales in slanting rows
    out += line('M13,-7.8L10,7.6M8.5,-8.3L5.5,8.1M4,-8.4L1,8.1M-0.5,-8.2L-3.5,7.6M-5,-7.6L-8,6.8M-9.5,-6.6L-12.5,5.6M-14,-5.2L-16.4,4', dark, 0.45, 'opacity=".3"');
    out += line('M14,7L11,-7.6M9.5,7.9L6.5,-8.3M5,8.1L2,-8.4M0.5,7.9L-2.5,-8M-4,7.2L-7,-7.2M-8.5,6.2L-11.5,-6', dark, 0.45, 'opacity=".16"');
  }
  out += line('M16.6,-6.2C15,-2 15,3 16.6,6.4', dark, 0.7, 'opacity=".6"');
  out += line('M26.6,1.2C23.6,3.4 21,3.8 18.6,3.4', dark, 0.7);
  out += circ(21.6, -1.8, 3, tone('#efe6b8')) + circ(21.9, -1.8, 1.8, tone('#15181a'));
  return out;
}

function palaeoniscoid(c: PartCtx): string {
  const { rng } = c;
  const one = palaeoniscoidOne(c);
  const spots: [number, number, number][] = [
    [-44, -25, 1.0],
    [12, -27, 1.14],
    [50, -4, 0.94],
    [-14, 0, 1.24],
    [-50, 22, 1.08],
    [24, 24, 1.0],
  ];
  let out = '';
  for (const [x, y, s] of spots) out += group(one, x + rng.range(-5, 5), y + rng.range(-3, 3), s, false, rng.range(-5, 5));
  return out;
}

export const PARTS: Record<string, PartDef> = {
  conodont: { role: 'drifter', w: 150, h: 60, anchor: 'center', draw: conodont },
  jawlessfish: { role: 'drifter', w: 160, h: 76, anchor: 'center', draw: jawlessfish },
  thelodont: { role: 'drifter', w: 160, h: 76, anchor: 'center', draw: thelodont },
  acanthodian: { role: 'drifter', w: 160, h: 86, anchor: 'center', draw: acanthodian },
  dunkleosteus: { role: 'swimmer', w: 280, h: 120, anchor: 'center', draw: dunkleosteus },
  bothriolepis: { role: 'drifter', w: 134, h: 64, anchor: 'center', draw: bothriolepis },
  lobefin: { role: 'swimmer', w: 276, h: 78, anchor: 'center', draw: lobefin },
  coelacanth: { role: 'drifter', w: 156, h: 86, anchor: 'center', draw: coelacanth },
  lungfish: { role: 'drifter', w: 154, h: 52, anchor: 'center', draw: lungfish },
  lungfishsouth: { role: 'drifter', w: 154, h: 52, anchor: 'center', draw: lungfish },
  cladoselache: { role: 'swimmer', w: 252, h: 94, anchor: 'center', draw: cladoselache },
  stethacanthus: { role: 'swimmer', w: 242, h: 102, anchor: 'center', draw: stethacanthus },
  helicoprion: { role: 'swimmer', w: 272, h: 110, anchor: 'center', draw: helicoprion },
  xenacanth: { role: 'swimmer', w: 274, h: 74, anchor: 'center', draw: xenacanth },
  palaeoniscoid: { role: 'drifter', w: 160, h: 80, anchor: 'center', draw: palaeoniscoid },
};
