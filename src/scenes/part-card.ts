// One part drawn alone, for the workbench, the review sheet and the tests. It covers every part,
// those made only for the painted pictures included, so it is kept out of the scene script.

import { makeRng } from './draw';
import { ALL_PARTS, ALL_PERMITS } from './all-parts';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** One part drawn alone on a plain ground, for checking. Returns SVG markup, or '' for an unknown id. */
export function partSvg(id: string): string {
  const def = ALL_PARTS[id];
  const permit = ALL_PERMITS.find((x) => x.id === id);
  if (!def || !permit) return '';
  const pad = 14;
  const top = def.anchor === 'base' ? -def.h - pad : -def.h / 2 - pad;
  const body = def.draw({ rng: makeRng(11), tone: (c) => c, detail: true, sun: 1 });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-def.w / 2 - pad} ${top} ${def.w + pad * 2} ${def.h + pad * 2}" role="img" aria-label="${esc(permit.name)}">${body}</svg>`;
}
