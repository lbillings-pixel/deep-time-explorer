// Six more turning points older than the Cambrian. The facts and the dates come from
// docs/research/great-events-precambrian.md.

import type { TimelineEvent } from './extinctions';

/** Youngest first. */
export const EARLY_TURNING_POINTS: TimelineEvent[] = [
  {
    kind: 'turning-point',
    id: 'shuram',
    rank: 2,
    name: 'The Shuram excursion',
    when: 'About 574 to 567 million years ago',
    age: 570,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'lomagundi',
    rank: 2,
    name: 'The Lomagundi-Jatuli excursion',
    when: 'Between about 2.3 and 2.1 billion years ago',
    age: 2200,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'huronian',
    rank: 2,
    name: 'The Huronian glaciations',
    when: 'About 2.45 to 2.22 billion years ago',
    age: 2350,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'oxygenation',
    rank: 2,
    name: 'The Great Oxidation Event',
    when: 'About 2.4 to 2.2 billion years ago',
    age: 2400,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'bombardment',
    rank: 2,
    name: 'The Late Heavy Bombardment',
    when: 'About 4.1 to 3.8 billion years ago',
    age: 3900,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'moon-impact',
    rank: 2,
    name: 'The Moon-forming impact',
    when: 'About 4.5 billion years ago',
    age: 4500,
    chapter: 'precambrian',
  },
];
