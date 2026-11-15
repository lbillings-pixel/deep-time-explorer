// Every chapter's story text at once, for the tests and the review sheet.
// The site itself never imports this: it loads one chapter at a time (see index.ts).

import type { EnvType } from '../match/taxonomy';
import type { ChapterStory, Passage } from './types';

const files = import.meta.glob<{ STORY?: ChapterStory }>('./*.ts', { eager: true });

/** Story text by chapter id ('late-cretaceous'). */
export const STORIES: Record<string, ChapterStory> = {};
for (const [file, module] of Object.entries(files)) {
  if (module.STORY) STORIES[file.slice(2, -3)] = module.STORY;
}

/**
 * The environment types that have a passage in each chapter. Some pairings
 * cannot occur (a coal swamp before land plants) or have no good record (ice in
 * the Jurassic). A chapter matched to one of those shows local facts only.
 */
export function passageFor(chapterId: string, env: EnvType): Passage | undefined {
  return STORIES[chapterId]?.scenes[env];
}
