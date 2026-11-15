// Events on the timeline that are not chapters: extinctions, and turning points of other kinds
// (an ice age, a first forest, a land bridge). Each has a painted picture (see tools/extinctions/),
// a short text, and a sentence from the data about where the visitor's place lay
// at the time.
//
// Rank 1: the five great mass extinctions, each belonging with the chapter it closed.
// Rank 2: lesser extinctions, each belonging with the chapter it fell in.
// A turning point (kind: 'turning-point', in turning-points.ts) is rank 2.
//
// Each is a small note beside its chapter, which opens a panel. An entry here holds only what
// the note needs; what the panel shows is an EventText, in extinctions-text.ts.

import { TURNING_POINTS } from './turning-points';

export interface TimelineEvent {
  /** Absent for an extinction. */
  kind?: 'turning-point';
  /** Also the name of the picture files in public/extinctions/. */
  id: string;
  rank: 1 | 2;
  name: string;
  /** Plain wording of the date. */
  when: string;
  /** The age, in millions of years, at which the place's ancient position is looked up. */
  age: number;
  /**
   * Chapter id. Rank 1: the chapter the event closed; the panel is shown just above that chapter's card,
   * because the timeline runs youngest first. Rank 2: the chapter the event fell in; the card is shown just below it.
   */
  chapter: string;
}

/**
 * What is read when an event is opened. It is kept apart from the entry (in the file of the same name ending
 * in -text.ts, by id) so that the page downloads it only then: see event-text.ts.
 */
export interface EventText {
  /** The default text, in plain language. */
  plain: string;
  /** Shown on request: the evidence and the debates. */
  more: string;
  /** What a reader should know before trusting the text. */
  caveats: string[];
  /** The published work the text rests on, shown with the caveats. Every lesser extinction lists its own. */
  sources?: string[];
  /** What the picture shows, for visitors who cannot see it. */
  picture: string;
  /** What in this picture is the painter's device and not evidence. Shown after PICTURE_CAVEAT, which applies to every picture. */
  pictureCaveats?: string[];
  vetted: boolean;
}

/** Where the asteroid struck at the end of the Cretaceous: the center of the Chicxulub crater, present-day coordinates. */
export const CHICXULUB = { lat: 21.4, lng: -89.5 };

/** Shown with every extinction picture. */
export const PICTURE_CAVEAT =
  "The painting is an impression made by this site's code. It is not a reconstruction of a known place or moment. The plants and animals in it are drawn from the same lists as the chapter scenes, so each is known from the time shown, but the grouping is imagined.";

export const EXTINCTIONS: TimelineEvent[] = [
  {
    id: 'end-cretaceous',
    name: 'The end-Cretaceous mass extinction',
    when: 'About 66 million years ago',
    age: 66,
    rank: 1,
    chapter: 'late-cretaceous',
  },
  {
    id: 'end-triassic',
    name: 'The end-Triassic mass extinction',
    when: 'About 201 million years ago',
    age: 201.4,
    rank: 1,
    chapter: 'triassic',
  },
  {
    id: 'end-permian',
    name: 'The end-Permian mass extinction',
    when: 'About 252 million years ago',
    age: 252,
    rank: 1,
    chapter: 'permian',
  },
  {
    id: 'late-devonian',
    name: 'The Late Devonian mass extinction',
    when: 'About 372 to 359 million years ago',
    age: 372,
    rank: 1,
    chapter: 'devonian',
  },
  {
    id: 'end-ordovician',
    name: 'The end-Ordovician mass extinction',
    when: 'About 445 to 443 million years ago',
    age: 445,
    rank: 1,
    chapter: 'ordovician',
  },

  // ---- Rank 2: lesser extinctions, youngest first. Each was written from sources checked on 14 November 2026;
  // ---- where a figure could not be traced to its origin, a caveat says so.
  {
    id: 'late-pleistocene',
    rank: 2,
    name: 'The Late Pleistocene extinctions',
    when: 'About 50,000 to 10,000 years ago',
    age: 0.03,
    chapter: 'quaternary',
  },
  {
    id: 'cenomanian-turonian',
    rank: 2,
    name: 'The Cenomanian-Turonian event',
    when: 'About 94 million years ago',
    age: 94,
    chapter: 'late-cretaceous',
  },
  {
    id: 'toarcian',
    rank: 2,
    name: 'The Toarcian extinction',
    when: 'About 183 million years ago',
    age: 183,
    chapter: 'jurassic',
  },
  {
    id: 'carnian',
    rank: 2,
    name: 'The Carnian Pluvial Episode',
    when: 'About 234 to 232 million years ago',
    age: 233,
    chapter: 'triassic',
  },
  {
    id: 'capitanian',
    rank: 2,
    name: 'The Capitanian extinction',
    when: 'About 262 to 260 million years ago',
    age: 260,
    chapter: 'permian',
  },
  {
    id: 'rainforest-collapse',
    rank: 2,
    name: 'The Carboniferous rainforest collapse',
    when: 'About 307 to 305 million years ago',
    age: 306,
    chapter: 'late-carboniferous',
  },
  {
    id: 'lau',
    rank: 2,
    name: 'The Lau event',
    when: 'About 424 million years ago',
    age: 424,
    chapter: 'silurian',
  },
  {
    id: 'sinsk',
    rank: 2,
    name: 'The Sinsk event',
    when: 'About 513 million years ago',
    age: 513,
    chapter: 'cambrian',
  },
];

/** Everything on the timeline that is not a chapter. */
export const EVENTS: TimelineEvent[] = [...EXTINCTIONS, ...TURNING_POINTS];
