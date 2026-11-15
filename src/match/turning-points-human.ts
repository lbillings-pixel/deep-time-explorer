// Two turning points of human history, youngest first, each a painting of several scenes.
// The facts come from docs/research/great-events-civilization.md, great-events-civilization-additions.md
// and great-events-civilization-lapita.md, and from nowhere
// else; where a dossier marks a claim as unchecked, the claim is left out or a caveat says so.

import type { TimelineEvent } from './extinctions';

export const HUMAN_TURNING_POINTS: TimelineEvent[] = [
  {
    kind: 'turning-point',
    id: 'cities-and-monuments',
    rank: 2,
    name: 'Cities and monuments',
    when: 'About 4,600 to 2,400 years ago (2600 to 400 BC)',
    age: 0.003,
    chapter: 'quaternary',
  },
  {
    kind: 'turning-point',
    id: 'painters-farmers-voyagers',
    rank: 2,
    name: 'Painters, farmers and voyagers',
    when: 'From more than 51,000 years ago to about 2,900 years ago',
    age: 0.02,
    chapter: 'quaternary',
  },
];
