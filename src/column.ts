// The rock layers beneath a region: Macrostrat's regional column for the place, laid out by time, one band per
// chapter of the timeline. Drawn by time and not by thickness, so that a gap in the record shows as a gap; thickness
// is recorded as a range, and for about one unit in ten not at all, so it is given in words.
import type { ColumnLayer } from './data/columns';
import { type Chapter, CHAPTERS, inChapter } from './match/chapters';
import type { RockUnit } from './match/match';

export interface Layer extends ColumnLayer {
  /** True if the geological map shows rock of the same broad kind and of overlapping age at the exact spot. */
  here: boolean;
}

/** One chapter's stretch of the column. */
export interface Band {
  chapter: Chapter;
  /** The span of time the band is drawn over. For the Precambrian it stops at the oldest layer in the column, not at the Earth's beginning. */
  old: number;
  young: number;
  /** Youngest first. `top` and `height` are fractions of the band, measured from its young end. */
  layers: { layer: Layer; top: number; height: number }[];
}

/**
 * Marks the layers that the map confirms at the spot. A column describes a whole region, so a layer counts as "here"
 * only if a map unit at the point is of the same class of rock (sedimentary, igneous or metamorphic) and their ages
 * overlap by more than a sliver.
 */
export function markHere(layers: ColumnLayer[], units: RockUnit[]): Layer[] {
  const mapped = units.filter((u) => u.origin === 'here');
  return layers.map((layer) => ({
    ...layer,
    here: mapped.some(
      (u) =>
        u.liths.some((l) => layer.liths.some((m) => m.class === l.class)) &&
        Math.min(u.old, layer.old) - Math.max(u.young, layer.young) > 0.05 * Math.min(u.old - u.young, layer.old - layer.young),
    ),
  }));
}

/** The column cut into the chapters of the timeline, youngest first. */
export function bandsOf(layers: Layer[]): Band[] {
  const oldest = Math.max(0, ...layers.map((l) => l.old));
  return CHAPTERS.map((chapter) => {
    const old = chapter.id === 'precambrian' ? Math.max(Math.min(chapter.old, oldest), chapter.young + 1) : chapter.old;
    const span = old - chapter.young;
    const inside = layers
      .filter((l) => inChapter(chapter, l.old, l.young))
      .sort((a, b) => a.young - b.young || a.old - b.old)
      .map((layer) => {
        const top = (Math.max(layer.young, chapter.young) - chapter.young) / span;
        const bottom = (Math.min(layer.old, old) - chapter.young) / span;
        return { layer, top, height: Math.max(bottom - top, 0) };
      });
    return { chapter, old, young: chapter.young, layers: inside };
  });
}

/** The rock type that makes up most of a layer, or null if none is recorded. */
function mainRock(layer: ColumnLayer) {
  return layer.liths.reduce<ColumnLayer['liths'][number] | null>((best, l) => (!best || l.prop > best.prop ? l : best), null);
}

/** The kinds of rock the column is colored by. The words are also the legend. */
export const ROCK_KINDS = {
  sand: { word: 'Sandstone, gravel and other coarse sediment', color: '#e2c877' },
  mud: { word: 'Shale, mudstone and other fine sediment', color: '#9ba693' },
  carbonate: { word: 'Limestone and dolomite', color: '#8db6d6' },
  salt: { word: 'Salt, gypsum and other chemical rock', color: '#e6b6c8' },
  coal: { word: 'Coal and peat', color: '#3d3d3d' },
  volcanic: { word: 'Lava and ash', color: '#b06f5a' },
  plutonic: { word: 'Granite and other rock cooled underground', color: '#dc8f86' },
  metamorphic: { word: 'Rock altered by heat and pressure', color: '#9a86b7' },
  other: { word: 'Other or unrecorded', color: '#c9c2b3' },
} as const;

export type RockKind = keyof typeof ROCK_KINDS;

const FINE = /mud|shale|clay|silt|marl|argillite|slate/i;

export function rockKind(layer: ColumnLayer): RockKind {
  const rock = mainRock(layer);
  if (!rock) return 'other';
  if (rock.class === 'metamorphic') return 'metamorphic';
  if (rock.type === 'carbonate') return 'carbonate';
  if (rock.type === 'evaporite' || rock.type === 'chemical') return 'salt';
  if (rock.type === 'organic') return 'coal';
  if (rock.type === 'volcanic') return 'volcanic';
  if (rock.class === 'igneous') return 'plutonic';
  if (rock.type === 'siliciclastic') return FINE.test(rock.name) ? 'mud' : 'sand';
  return 'other';
}

/** Thickness in plain words, or null where none is recorded. Macrostrat gives a least and a greatest figure, in meters. */
export function thicknessWords(layer: ColumnLayer): string | null {
  const [least, most] = layer.thick;
  const m = (n: number) => `${Math.round(n).toLocaleString('en')} m`;
  if (!most || most <= 0) return null;
  return least > 0 && Math.round(least) !== Math.round(most) ? `${m(least)} to ${m(most)} thick` : `about ${m(most)} thick`;
}
