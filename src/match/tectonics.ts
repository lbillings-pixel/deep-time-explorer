// Tectonic events: times when mountains were built, when a continent stretched and
// tore, and when an ocean opened. The list itself is in tectonic-events.ts.
//
// Unlike a chapter, an event is not read from the rock at the visitor's spot. It is a
// published event with a published extent, and a place gets its tile when the place
// lies inside that extent. That is "recorded in the region" evidence at best, and
// every tile says so.
//
// The extent is given two ways. `provinces` names provinces on the world map of
// Hasterok et al. (2022) by their record number (src/data/provinces.ts), which gives
// a mountain belt its real, curved outline. `boxes` are rough rectangles drawn by
// hand, for events the province map does not outline: it maps the age of the deep
// crust, so a young range built across old crust (the Rocky Mountains) has no
// province of its own.
//
// Every entry is shown with its caveats.
import type { LatLng } from '../geo/plates';
import { type Chapter, CHAPTERS, overlap } from './chapters';

export type TectonicKind = 'mountains' | 'rift' | 'ocean';

export interface TectonicEvent {
  id: string;
  name: string;
  kind: TectonicKind;
  /** Age range, Ma. `young: 0` means it is still going on. */
  old: number;
  young: number;
  /** Record numbers of provinces on the province map. */
  provinces: number[];
  /** Rough present-day rectangles, [south, west, north, east]. */
  boxes: [south: number, west: number, north: number, east: number][];
  /**
   * Mountains only: the age, in Ma, until which the range is shown wearing down after its building ended, where
   * published work dates what became of it. Equal to `young`: not at all (the range was buried or collapsed at once).
   * 0: to the present. Absent: the default span, WEARING_DOWN.
   */
  wornBy?: number;
  /** Shown with a chapter in which this range is wearing down: what published work says of it after the building ended. */
  wornCaveat?: string;
}

/**
 * How long, in millions of years, a range is shown wearing down after its building ended, unless the entry says otherwise.
 * A judgment made for this site, not a published figure: models of how mountains wear away give from a few million to
 * hundreds of millions of years, and in the two cases with dates the rugged relief was gone within 10 to 40 million.
 */
export const WEARING_DOWN = 30;

/** The age, in Ma, until which a mountain-building event's range is shown wearing down. */
export function wornBy(e: TectonicEvent): number {
  return e.wornBy ?? Math.max(0, e.young - WEARING_DOWN);
}

/**
 * What is read when an event is opened. It is kept apart from the entry (in the file of the same name ending
 * in -text.ts, by id) so that the page downloads it only then: see event-text.ts.
 */
export interface TectonicText {
  /** Two or three plain sentences, shown to the visitor. */
  plain: string;
  /** What a reader should know before trusting the text. */
  caveats: string[];
  sources: string[];
  vetted: boolean;
}

export const KIND_LABEL: Record<TectonicKind, string> = {
  mountains: 'Mountain building in this region',
  rift: 'A continent stretches in this region',
  ocean: 'An ocean opens beside this region',
};

/** Shown with every tectonic event, before its own caveats. */
export const REGION_CAVEAT =
  'This event is shown because this spot lies inside the region that published work gives for it. That is a statement about the region, not a date measured in the rock at this spot. The outline of the region is drawn at the scale of a world map, so near its edge the link can be wrong.';

/** The events whose extent covers this point. `province` is the point's province number, or null if it is not known. */
export function tectonicsAt(events: TectonicEvent[], p: LatLng, province: number | null): TectonicEvent[] {
  return events.filter(
    (e) => (province !== null && e.provinces.includes(province)) || e.boxes.some(([south, west, north, east]) => p.lat >= south && p.lat <= north && p.lng >= west && p.lng <= east),
  );
}

/** The chapter an event's tile is shown under: the one that holds most of the event. */
export function chapterOf(e: TectonicEvent): Chapter {
  return CHAPTERS.reduce((best, c) => (overlap(c, e.old, e.young) > overlap(best, e.old, e.young) ? c : best));
}
