// Every event with its text, for the tests and the review sheet.
// The site itself never imports this: it fetches a text when its event is opened (see event-text.ts).

import { EXTINCTIONS as EXTINCTION_ENTRIES } from './extinctions';
import { TEXT as EXTINCTION_TEXT } from './extinctions-text';
import { MOUNTAIN_BUILDING as MOUNTAIN_ENTRIES } from './tectonic-events-mountains';
import { TEXT as MOUNTAIN_TEXT } from './tectonic-events-mountains-text';
import { RIFTS_AND_OCEANS as RIFT_ENTRIES } from './tectonic-events-rifts';
import { TEXT as RIFT_TEXT } from './tectonic-events-rifts-text';
import { EARLY_TURNING_POINTS } from './turning-points-early';
import { TEXT as EARLY_TEXT } from './turning-points-early-text';
import { HUMAN_TURNING_POINTS } from './turning-points-human';
import { TEXT as HUMAN_TEXT } from './turning-points-human-text';
import { PHANEROZOIC_TURNING_POINTS } from './turning-points-phanerozoic';
import { TEXT as PHANEROZOIC_TEXT } from './turning-points-phanerozoic-text';
import { PRECAMBRIAN_TURNING_POINTS } from './turning-points-precambrian';
import { TEXT as PRECAMBRIAN_TEXT } from './turning-points-precambrian-text';

/** Each entry with its text. Every entry must have a text, and every text an entry. */
function join<E extends { id: string }, T>(entries: E[], texts: Record<string, T>): (E & T)[] {
  const stray = Object.keys(texts).filter((id) => !entries.some((e) => e.id === id));
  if (stray.length) throw new Error(`A text with no event: ${stray.join(', ')}`);
  return entries.map((e) => {
    const text = texts[e.id];
    if (!text) throw new Error(`An event with no text: ${e.id}`);
    return { ...e, ...text };
  });
}

export const EXTINCTIONS = join(EXTINCTION_ENTRIES, EXTINCTION_TEXT);

/** Youngest first. */
export const TURNING_POINTS = [
  ...join(HUMAN_TURNING_POINTS, HUMAN_TEXT),
  ...join(PHANEROZOIC_TURNING_POINTS, PHANEROZOIC_TEXT),
  ...join(PRECAMBRIAN_TURNING_POINTS, PRECAMBRIAN_TEXT),
  ...join(EARLY_TURNING_POINTS, EARLY_TEXT),
].sort((a, b) => a.age - b.age);

export const EVENTS = [...EXTINCTIONS, ...TURNING_POINTS];

export const MOUNTAIN_BUILDING = join(MOUNTAIN_ENTRIES, MOUNTAIN_TEXT);
export const RIFTS_AND_OCEANS = join(RIFT_ENTRIES, RIFT_TEXT);
