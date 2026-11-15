// Six turning points of the last 540 million years, youngest first. The facts come from
// docs/research/great-events-phanerozoic.md and from nowhere else; where that dossier marks
// a figure as unchecked, the figure is left out or a caveat says so.

import type { TimelineEvent } from './extinctions';

export const PHANEROZOIC_TURNING_POINTS: TimelineEvent[] = [
  {
    kind: 'turning-point',
    id: 'interchange',
    rank: 2,
    name: 'The Great American Biotic Interchange',
    when: 'From about 2.7 million years ago',
    age: 2.5,
    chapter: 'quaternary',
  },
  {
    kind: 'turning-point',
    id: 'messinian',
    rank: 2,
    name: 'The Messinian salinity crisis',
    when: 'About 5.97 to 5.33 million years ago',
    age: 5.6,
    chapter: 'neogene',
  },
  {
    kind: 'turning-point',
    id: 'antarctica-freezes',
    rank: 2,
    name: 'Antarctica freezes over',
    when: 'About 34 million years ago',
    age: 34,
    chapter: 'paleogene',
  },
  {
    kind: 'turning-point',
    id: 'petm',
    rank: 2,
    name: 'The Paleocene-Eocene Thermal Maximum',
    when: 'About 56 million years ago',
    age: 56,
    chapter: 'paleogene',
  },
  {
    kind: 'turning-point',
    id: 'first-forests',
    rank: 2,
    name: 'The first forests',
    when: 'About 390 to 383 million years ago',
    age: 385,
    chapter: 'devonian',
  },
  {
    kind: 'turning-point',
    id: 'cambrian-explosion',
    rank: 2,
    name: 'The Cambrian explosion',
    when: 'About 539 to 518 million years ago',
    age: 520,
    chapter: 'cambrian',
  },
];
