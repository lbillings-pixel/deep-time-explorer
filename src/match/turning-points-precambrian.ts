// Turning points older than the Cambrian. The facts come from docs/research/great-events-precambrian.md.

import type { TimelineEvent } from './extinctions';

export const PRECAMBRIAN_TURNING_POINTS: TimelineEvent[] = [
  {
    kind: 'turning-point',
    id: 'ediacaran-life',
    rank: 2,
    name: 'Ediacaran life',
    when: 'About 575 to 539 million years ago',
    age: 560,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'snowball-earth',
    rank: 2,
    name: 'Snowball Earth',
    when: 'About 717 to 635 million years ago',
    age: 680,
    chapter: 'precambrian',
  },
  {
    kind: 'turning-point',
    id: 'earliest-life',
    rank: 2,
    name: 'The earliest signs of life',
    when: 'By about 3.5 billion years ago',
    age: 3480,
    chapter: 'precambrian',
  },
];
