// Loads the text of an event. The texts are most of what the page's script would otherwise carry,
// so each list's texts are in a file of their own (<list>-text.ts), fetched when a visitor first opens
// one of that list's events.

import { EXTINCTIONS, type EventText, type TimelineEvent } from './extinctions';
import { MOUNTAIN_BUILDING } from './tectonic-events-mountains';
import { RIFTS_AND_OCEANS } from './tectonic-events-rifts';
import type { TectonicEvent, TectonicText } from './tectonics';
import { EARLY_TURNING_POINTS } from './turning-points-early';
import { HUMAN_TURNING_POINTS } from './turning-points-human';
import { PHANEROZOIC_TURNING_POINTS } from './turning-points-phanerozoic';
import { PRECAMBRIAN_TURNING_POINTS } from './turning-points-precambrian';

/** A list of events, and how to fetch its texts. */
type Group<E, T> = [events: E[], texts: () => Promise<{ TEXT: Record<string, T> }>];

const TIMELINE: Group<TimelineEvent, EventText>[] = [
  [EXTINCTIONS, () => import('./extinctions-text')],
  [HUMAN_TURNING_POINTS, () => import('./turning-points-human-text')],
  [PHANEROZOIC_TURNING_POINTS, () => import('./turning-points-phanerozoic-text')],
  [PRECAMBRIAN_TURNING_POINTS, () => import('./turning-points-precambrian-text')],
  [EARLY_TURNING_POINTS, () => import('./turning-points-early-text')],
];

const TECTONIC: Group<TectonicEvent, TectonicText>[] = [
  [MOUNTAIN_BUILDING, () => import('./tectonic-events-mountains-text')],
  [RIFTS_AND_OCEANS, () => import('./tectonic-events-rifts-text')],
];

async function textOf<E extends { id: string }, T>(groups: Group<E, T>[], e: E): Promise<T> {
  const [, texts] = groups.find(([events]) => events.includes(e))!;
  return (await texts()).TEXT[e.id]!;
}

/** The text of an extinction or a turning point. */
export const loadEventText = (e: TimelineEvent): Promise<EventText> => textOf(TIMELINE, e);

/** The text of a tectonic event. */
export const loadTectonicText = (e: TectonicEvent): Promise<TectonicText> => textOf(TECTONIC, e);
