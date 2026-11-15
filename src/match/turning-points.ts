// Turning points on the timeline: great events that were not extinctions. Each has a painted
// picture (tools/extinctions/), a text, caveats and published sources, and is shown as a small card
// under the chapter it fell in.

import type { TimelineEvent } from './extinctions';
import { PHANEROZOIC_TURNING_POINTS } from './turning-points-phanerozoic';
import { PRECAMBRIAN_TURNING_POINTS } from './turning-points-precambrian';
import { EARLY_TURNING_POINTS } from './turning-points-early';
import { HUMAN_TURNING_POINTS } from './turning-points-human';

/** Youngest first. */
export const TURNING_POINTS: TimelineEvent[] = [...HUMAN_TURNING_POINTS, ...PHANEROZOIC_TURNING_POINTS, ...PRECAMBRIAN_TURNING_POINTS, ...EARLY_TURNING_POINTS].sort((a, b) => a.age - b.age);
