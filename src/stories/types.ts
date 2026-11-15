// The shape of the story text. One file per chapter holds a short account of
// the wider world at that time, and one passage for each environment type that
// can occur in it.
//
// Each chapter's caveats can be read beside its evidence.
//
// A passage is general: it describes that kind of place at that time, anywhere.
// It never states a fact about one location. Local facts (rock unit names, the
// ancient latitude, nearby fossil finds) are added by the app from data.

import type { EnvType } from '../match/taxonomy';

export interface Passage {
  /** The default text, in plain language. */
  plain: string;
  /** Shown on request: more detail, the names, and how geologists know. */
  more: string;
  vetted: boolean;
}

export interface Caveat {
  /** The passages it concerns: 'world' for the chapter overview, or environment types. */
  about: ('world' | EnvType)[];
  /** Written for visitors: plain, third person, American spelling. */
  text: string;
}

export interface ChapterStory {
  /** The wider world in this chapter: where the continents were, the climate, the life, how the chapter ended. */
  world: Passage;
  /** One passage per environment type that occurs in this chapter. */
  scenes: Partial<Record<EnvType, Passage>>;
  /** What a reader should know before trusting the text: estimates, simplifications, points specialists dispute. Shown to visitors on request. */
  caveats: Caveat[];
}
