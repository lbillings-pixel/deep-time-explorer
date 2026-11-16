// Renders parts or scenes to a plain HTML page for tools/preview/preview.mjs,
// which then takes a picture of it. Runs only when asked for (PREVIEW set),
// never as part of `npm test`. It runs under vitest because Node cannot run
// this project's TypeScript directly.
import fs from 'node:fs';
import { it } from 'vitest';
import type { PartDef } from '../../src/scenes/part';
import type { Permit } from '../../src/scenes/permit';
import type { SceneParams } from '../../src/scenes/stage';

interface Spec {
  mode: 'parts' | 'part' | 'scene' | 'chapters' | 'seeds';
  group?: string;
  id?: string;
  params?: Partial<SceneParams>;
  out: string;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const WATER = ['swimmer', 'drifter', 'stalked', 'mound', 'floor'];

function rngFor(makeRng: (seed: number) => PartDef extends never ? never : ReturnType<typeof import('../../src/scenes/draw').makeRng>, seed: number) {
  return makeRng(seed);
}

it.skipIf(!process.env.PREVIEW)('render a preview page', async () => {
  const spec = JSON.parse(process.env.PREVIEW!) as Spec;
  const { makeRng } = await import('../../src/scenes/draw');
  let body = '';
  let width = 1200;
  let height = 800;

  const tile = (id: string, def: PartDef, name: string, box: number, detail = true, seed = 11) => {
    const pad = 16;
    const top = def.anchor === 'base' ? -def.h - pad : -def.h / 2 - pad;
    const vb = `${-def.w / 2 - pad} ${top} ${def.w + pad * 2} ${def.h + pad * 2}`;
    const drawing = def.draw({ rng: rngFor(makeRng, seed), tone: (c) => c, detail, sun: 1 });
    // The dashed box is the declared size; the line is the ground (base) or the centre line (center).
    const guide =
      `<rect x="${-def.w / 2}" y="${def.anchor === 'base' ? -def.h : -def.h / 2}" width="${def.w}" height="${def.h}" fill="none" stroke="#c0392b" stroke-width="0.6" stroke-dasharray="4 3" opacity=".6"/>` +
      `<line x1="${-def.w / 2 - pad}" x2="${def.w / 2 + pad}" y1="0" y2="0" stroke="#555" stroke-width="0.6" opacity=".6"/>`;
    return (
      `<figure style="width:${box}px"><div class="pic ${WATER.includes(def.role) ? 'sea' : ''}" style="height:${Math.round(box * 0.75)}px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${guide}${drawing}</svg></div>` +
      `<figcaption><b>${esc(id)}</b> · ${def.role} · ${def.w}×${def.h}<br>${esc(name)}</figcaption></figure>`
    );
  };

  if (spec.mode === 'parts' || spec.mode === 'part') {
    // A group file may hold scene parts, parts for the painted pictures only, or both.
    const partsFile = (await import(`../../src/scenes/parts/${spec.group}.ts`)) as { PARTS?: Record<string, PartDef>; PAINTING_PARTS?: Record<string, PartDef> };
    const permitsFile = (await import(`../../src/scenes/whitelist/${spec.group}.ts`)) as { PERMITS?: Permit[]; PAINTING_PERMITS?: Permit[] };
    const PARTS = { ...partsFile.PARTS, ...partsFile.PAINTING_PARTS };
    const PERMITS = [...(permitsFile.PERMITS ?? []), ...(permitsFile.PAINTING_PERMITS ?? [])];
    const nameOf = (id: string) => PERMITS.find((p) => p.id === id)?.name ?? 'NO WHITELIST ENTRY';
    if (spec.mode === 'part') {
      const def = PARTS[spec.id!];
      if (!def) throw new Error(`No part "${spec.id}" in group ${spec.group}`);
      // Large, then three other seeds, then the simplified distant version at a scene-like size.
      body += tile(spec.id!, def, nameOf(spec.id!), 760);
      body += [3, 29, 71].map((s) => tile(spec.id!, def, `seed ${s}`, 240, true, s)).join('');
      const far = def.draw({ rng: makeRng(11), tone: (c) => c, detail: false, sun: -1 });
      body += `<figure style="width:240px"><div class="pic" style="height:180px"><svg xmlns="http://www.w3.org/2000/svg" viewBox="-120 -150 240 180"><g transform="scale(.35)">${far}</g></svg></div><figcaption>distant: detail off, 0.35 scale, sun from the left</figcaption></figure>`;
      width = 1040;
      height = 880;
    } else {
      const ids = Object.keys(PARTS);
      const cols = 5;
      const box = 300;
      body += ids.map((id) => tile(id, PARTS[id]!, nameOf(id), box - 12)).join('');
      width = cols * box + 20;
      height = Math.ceil(ids.length / cols) * (Math.round((box - 12) * 0.75) + 62) + 30;
    }
  } else {
    const { composeScene } = await import('../../src/scenes/scene');
    const { CHAPTER_NAMES } = await import('../../src/match/chapters');
    const base: SceneParams = { environment: 'swamp', chapter: 'Jurassic', paleolatitude: 25, climate: 'neutral', seed: 7, ...spec.params };
    const frame = (p: SceneParams, label: string, w: number) => {
      const r = composeScene(p);
      const cast = [...r.shown.keys()].join(', ') || 'no cast';
      return `<figure style="width:${w}px"><div class="scene">${r.svg}</div><figcaption><b>${esc(label)}</b> · ${esc(cast)}</figcaption></figure>`;
    };
    if (spec.mode === 'scene') {
      body += frame(base, `${base.environment} · ${base.chapter} · lat ${base.paleolatitude} · ${base.climate} · seed ${base.seed}${base.region ? ' · ' + base.region : ''}`, 1180);
      width = 1200;
      height = 830;
    } else if (spec.mode === 'chapters') {
      body += CHAPTER_NAMES.map((chapter) => frame({ ...base, chapter }, chapter, 380)).join('');
      width = 1200;
      height = 5 * 312 + 20;
    } else {
      body += [1, 2, 3, 4, 5, 6].map((k) => frame({ ...base, seed: base.seed * 31 + k * 977 }, `seed variant ${k}`, 380)).join('');
      width = 1200;
      height = 2 * 312 + 20;
    }
  }

  const html = `<!doctype html><meta charset="utf-8"><style>
body{margin:0;padding:8px;background:#fff;font:12px/1.3 system-ui,sans-serif;color:#222;width:${width - 16}px;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start}
figure{margin:0}
.pic{background:#ece6d6;border:1px solid #bbb}.pic.sea{background:#cfe5e6}
.pic svg{width:100%;height:100%;display:block}
.scene svg{width:100%;height:auto;display:block}
figcaption{padding:2px 0;height:44px;overflow:hidden}
</style>${body}`;
  fs.writeFileSync(spec.out, html);
  fs.writeFileSync(spec.out + '.size', `${width},${height}`);
});
