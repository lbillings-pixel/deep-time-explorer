// The 15 time chapters of the timeline: the geological periods, with the
// Cretaceous and Carboniferous split in two. Boundary ages (Ma) are Macrostrat's
// copy of the international time scale, so they agree with the rock-unit data.

/** Chapter names, youngest first. The scenes and stories key on these. */
export const CHAPTER_NAMES = [
  'Quaternary',
  'Neogene',
  'Paleogene',
  'Late Cretaceous',
  'Early Cretaceous',
  'Jurassic',
  'Triassic',
  'Permian',
  'Late Carboniferous',
  'Early Carboniferous',
  'Devonian',
  'Silurian',
  'Ordovician',
  'Cambrian',
  'Precambrian',
] as const;

export type ChapterName = (typeof CHAPTER_NAMES)[number];

export interface Chapter {
  id: string;
  name: ChapterName;
  /** Start of the chapter, Ma. */
  old: number;
  /** End of the chapter, Ma. */
  young: number;
}

export const CHAPTERS: Chapter[] = [
  { id: 'quaternary', name: 'Quaternary', old: 2.58, young: 0 },
  { id: 'neogene', name: 'Neogene', old: 23.04, young: 2.58 },
  { id: 'paleogene', name: 'Paleogene', old: 66, young: 23.04 },
  { id: 'late-cretaceous', name: 'Late Cretaceous', old: 100.5, young: 66 },
  { id: 'early-cretaceous', name: 'Early Cretaceous', old: 143.1, young: 100.5 },
  { id: 'jurassic', name: 'Jurassic', old: 201.4, young: 143.1 },
  { id: 'triassic', name: 'Triassic', old: 251.902, young: 201.4 },
  { id: 'permian', name: 'Permian', old: 298.9, young: 251.902 },
  { id: 'late-carboniferous', name: 'Late Carboniferous', old: 323.4, young: 298.9 },
  { id: 'early-carboniferous', name: 'Early Carboniferous', old: 358.86, young: 323.4 },
  { id: 'devonian', name: 'Devonian', old: 419.62, young: 358.86 },
  { id: 'silurian', name: 'Silurian', old: 443.1, young: 419.62 },
  { id: 'ordovician', name: 'Ordovician', old: 486.85, young: 443.1 },
  { id: 'cambrian', name: 'Cambrian', old: 538.8, young: 486.85 },
  { id: 'precambrian', name: 'Precambrian', old: 4600, young: 538.8 },
];

/** Plate reconstructions and ancient maps stop here; older chapters are rocks-only. */
export const RECONSTRUCTION_LIMIT = 540;

/** Million years of overlap between a dated item and a chapter. */
export function overlap(c: Chapter, old: number, young: number): number {
  return Math.max(0, Math.min(c.old, old) - Math.max(c.young, young));
}

/**
 * True if a dated item belongs in this chapter. The data mixes older and newer
 * editions of the time scale, whose boundaries differ by up to a couple of million
 * years, so an overlap that is only a sliver of both the chapter and the item is ignored.
 */
export function inChapter(c: Chapter, old: number, young: number): boolean {
  if (old === young) return old <= c.old && (old > c.young || (old === 0 && c.young === 0));
  return overlap(c, old, young) > 0.05 * Math.min(c.old - c.young, old - young);
}

/** How many chapters a dated item belongs in. */
export function chaptersSpanned(old: number, young: number): number {
  return Math.max(1, CHAPTERS.filter((c) => inChapter(c, old, young)).length);
}
