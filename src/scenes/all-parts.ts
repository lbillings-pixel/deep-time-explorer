// Every part and every whitelist entry, those made only for the painted pictures included: for the painting
// tools, the workbench, the review sheet and the tests. The scenes take `PARTS` from ./parts and `GROUPS` and
// `PERMITS` from ./whitelist, which leave the painting-only groups out, so the scene script never carries them.
// Nothing that the scene script imports may import this file.

import type { PartDef } from './part';
import type { Permit } from './permit';
import { PARTS } from './parts';
import { PAINTING_PARTS as domesticateParts } from './parts/domesticates';
import { PAINTING_PARTS as southernParts } from './parts/land-southern';
import { PAINTING_PARTS as peopleParts } from './parts/people';
import { GROUPS, type WhitelistGroup } from './whitelist';
import * as domesticates from './whitelist/domesticates';
import { PAINTING_PERMITS as southernPermits } from './whitelist/land-southern';
import * as people from './whitelist/people';

/** The parts drawn only in the painted pictures. */
export const PAINTING_PARTS: Record<string, PartDef> = { ...southernParts, ...peopleParts, ...domesticateParts };

export const ALL_PARTS: Record<string, PartDef> = { ...PARTS, ...PAINTING_PARTS };

/** Every group with every entry: the scene groups, Titanis added to its own, then the two painting-only groups. */
export const ALL_GROUPS: WhitelistGroup[] = [
  ...GROUPS.map((g) => (g.id === 'land-southern' ? { ...g, permits: [...g.permits, ...southernPermits] } : g)),
  { id: 'people', title: 'People, drawn only in the painted pictures', permits: people.PAINTING_PERMITS, caveats: people.PAINTING_CAVEATS },
  { id: 'domesticates', title: 'Crops and domestic animals, drawn only in the painted pictures', permits: domesticates.PAINTING_PERMITS, caveats: domesticates.PAINTING_CAVEATS },
];

export const ALL_PERMITS: Permit[] = ALL_GROUPS.flatMap((g) => g.permits);
