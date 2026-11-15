// Loads the story text: one file per chapter, named by the chapter's id.
// The text is about half of everything the page would otherwise download at once,
// so each chapter's file is fetched only when a visitor opens that chapter.

import { CHAPTERS } from '../match/chapters';
import type { ChapterStory } from './types';

const ids = new Set(CHAPTERS.map((c) => c.id));
const files = import.meta.glob<{ STORY: ChapterStory }>(['./*.ts', '!./index.ts', '!./all.ts', '!./local.ts', '!./fossil-groups.ts', '!./types.ts']);
const loading = new Map<string, Promise<ChapterStory>>();

/** One chapter's story text, by chapter id ('late-cretaceous'). Asked for twice, it is fetched once. */
export function loadStory(chapterId: string): Promise<ChapterStory> {
  let story = loading.get(chapterId);
  if (!story) {
    if (!ids.has(chapterId)) throw new Error(`No story for ${chapterId}`);
    story = files[`./${chapterId}.ts`]!().then((m) => m.STORY);
    // A failed download is forgotten, so that opening the chapter again tries again.
    story.catch(() => loading.delete(chapterId));
    loading.set(chapterId, story);
  }
  return story;
}
