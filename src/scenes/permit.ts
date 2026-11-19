// The shape of a whitelist entry: which scenes, chapters, climates and parts of
// the world a plant or animal may be drawn in. The entries themselves are in
// whitelist/, one file per group of parts.

import { CHAPTER_NAMES, type ChapterName } from '../match/chapters';
import type { EnvType } from '../match/taxonomy';

/** 'neutral' is used when the rocks give no evidence of climate, which is most of the time. */
export type Climate = 'wet' | 'dry' | 'cold' | 'neutral';

/**
 * The present-day landmass a place sits on. Continents keep their identity as
 * they drift, so this is how a part is limited to, say, the southern continents.
 * See region.ts for the (rough) boundaries.
 */
export type Region = 'north-america' | 'south-america' | 'europe' | 'africa' | 'asia' | 'india' | 'australia' | 'new-zealand' | 'antarctica';

export const LAURASIA: Region[] = ['north-america', 'europe', 'asia'];
export const GONDWANA: Region[] = ['south-america', 'africa', 'india', 'australia', 'new-zealand', 'antarctica'];

/** Every climate except cold, for frost-tender plants and cold-intolerant animals. */
export const NOT_COLD: Climate[] = ['wet', 'dry', 'neutral'];

/**
 * What kind of organism a part is. Every entry must say. The automated tests
 * hold each group to its known time range (GROUP_RANGE below), which is what
 * stops, for example, a flowering plant appearing before the Cretaceous.
 */
export type Group =
  // plants and plant-like things
  | 'early-plant'
  | 'moss'
  | 'lycopsid'
  | 'horsetail'
  | 'fern'
  | 'seed-fern'
  | 'conifer'
  | 'cycad'
  | 'ginkgo'
  | 'flowering'
  | 'grass'
  | 'alga'
  | 'fungus'
  | 'microbe'
  // animals without backbones
  | 'ediacaran'
  | 'sponge'
  | 'coral'
  | 'bryozoan'
  | 'brachiopod'
  | 'mollusc'
  | 'ammonoid'
  | 'trilobite'
  | 'arthropod'
  | 'insect'
  | 'echinoderm'
  | 'graptolite'
  | 'other-invertebrate'
  // animals with backbones
  | 'fish'
  | 'amphibian'
  | 'synapsid'
  | 'reptile'
  | 'marine-reptile'
  | 'dinosaur'
  | 'pterosaur'
  | 'bird'
  | 'mammal'
  // primates near our own line, kept apart so the tests can hold them to their short time ranges
  | 'monkey'
  | 'ape'
  | 'hominin'
  | 'human'
  // not an organism
  | 'trace';

/** Every chapter from `older` up to `younger`, inclusive. */
export function span(older: ChapterName, younger: ChapterName): ChapterName[] {
  const from = CHAPTER_NAMES.indexOf(younger);
  const to = CHAPTER_NAMES.indexOf(older);
  if (from > to) throw new Error(`span('${older}', '${younger}'): the older chapter comes first`);
  return CHAPTER_NAMES.slice(from, to + 1);
}

/**
 * The widest time range each group may be listed for: [oldest chapter, youngest chapter].
 * A whitelist entry outside its group's range fails the tests. Groups not listed
 * here have no limit. 'grass' and 'flowering' carry the two rules from the brief:
 * no grass before the Cenozoic, no flowering plants before the Cretaceous.
 */
export const GROUP_RANGE: Partial<Record<Group, [ChapterName, ChapterName]>> = {
  moss: ['Ordovician', 'Quaternary'],
  'early-plant': ['Silurian', 'Early Carboniferous'],
  lycopsid: ['Silurian', 'Quaternary'],
  horsetail: ['Devonian', 'Quaternary'],
  fern: ['Devonian', 'Quaternary'],
  'seed-fern': ['Devonian', 'Late Cretaceous'],
  conifer: ['Late Carboniferous', 'Quaternary'],
  cycad: ['Permian', 'Quaternary'],
  ginkgo: ['Permian', 'Quaternary'],
  flowering: ['Early Cretaceous', 'Quaternary'],
  grass: ['Paleogene', 'Quaternary'],
  fungus: ['Silurian', 'Quaternary'],
  ediacaran: ['Precambrian', 'Precambrian'],
  coral: ['Ordovician', 'Quaternary'],
  bryozoan: ['Ordovician', 'Quaternary'],
  ammonoid: ['Devonian', 'Late Cretaceous'],
  trilobite: ['Cambrian', 'Permian'],
  graptolite: ['Cambrian', 'Early Carboniferous'],
  insect: ['Devonian', 'Quaternary'],
  amphibian: ['Devonian', 'Quaternary'],
  synapsid: ['Late Carboniferous', 'Jurassic'],
  reptile: ['Late Carboniferous', 'Quaternary'],
  'marine-reptile': ['Triassic', 'Late Cretaceous'],
  dinosaur: ['Triassic', 'Late Cretaceous'],
  pterosaur: ['Triassic', 'Late Cretaceous'],
  bird: ['Jurassic', 'Quaternary'],
  mammal: ['Triassic', 'Quaternary'],
  monkey: ['Paleogene', 'Quaternary'],
  ape: ['Neogene', 'Quaternary'],
  // 'hominin' is for the upright apes before our own genus (Australopithecus and its relatives); 'human' is the genus Homo.
  hominin: ['Neogene', 'Quaternary'],
  human: ['Quaternary', 'Quaternary'],
};

const PLANTS: Group[] = ['early-plant', 'moss', 'lycopsid', 'horsetail', 'fern', 'seed-fern', 'conifer', 'cycad', 'ginkgo', 'flowering', 'grass', 'alga'];

/** The broad heading a group is shown under in the parts gallery. */
export function kindOf(group: Group): 'plant' | 'animal' | 'trace' | 'microbe' | 'fungus' {
  if (PLANTS.includes(group)) return 'plant';
  return group === 'trace' || group === 'microbe' || group === 'fungus' ? group : 'animal';
}

/** The landmasses a part is limited to in one chapter, or undefined if it has no such limit. */
export function regionsIn(permit: Permit, chapter: ChapterName): Region[] | undefined {
  return permit.regionsByChapter?.[chapter] ?? permit.regions;
}

/** Something a visitor should know before trusting a drawing or a whitelist entry: a guess, a simplification, a point specialists dispute. */
export interface PartCaveat {
  /** Ids of the parts it concerns. Empty when it concerns the whole group. */
  parts: string[];
  /** Written for visitors: plain, third person, American spelling. */
  text: string;
}

/** The three sets of Ediacaran organisms; see `assemblage` below. */
export type Assemblage = 'avalon' | 'white-sea' | 'nama';

export interface Permit {
  /** Matches the drawing of the same id in parts/. */
  id: string;
  /** Plain name shown to visitors. */
  name: string;
  group: Group;
  /** Scene types it may appear in. Never drawn in any other. Empty only for a part marked `paintingsOnly`. */
  scenes: EnvType[];
  /**
   * Drawn only in the painted pictures (tools/extinctions), which check the chapter and nothing else; never in a
   * chapter scene. For a figure made for one painting, such as people dressed and posed for one place and task.
   */
  paintingsOnly?: boolean;
  /** Chapters it may appear in. Never drawn outside these. */
  chapters: ChapterName[];
  /** If given, drawn only under these climate settings. */
  climates?: Climate[];
  /** If given, drawn only where ancient latitude lies in this range (south is negative). */
  latitudes?: [number, number];
  /** If given, drawn only on these present-day landmasses. */
  regions?: Region[];
  /**
   * For an organism whose range changed with time: in the chapters named here,
   * these landmasses take the place of `regions`. Example: a cat that reached
   * South America only in the Quaternary lists the other continents in `regions`
   * and adds `regionsByChapter: { Quaternary: [...those, 'south-america'] }`.
   */
  regionsByChapter?: Partial<Record<ChapterName, Region[]>>;
  /** If given, drawn only within `km` of this present-day point. For an organism known from one island or one basin. */
  near?: { lat: number; lng: number; km: number };
  /** Drawn only where its fossils are recorded near the place. For organisms too local, or too briefly alive, to show by default. */
  localOnly?: boolean;
  /**
   * Chapters in which the part is drawn only where its fossils are recorded near the place, as `localOnly` does for
   * every chapter. For something common in its early chapters that lingered afterward in a few places, such as the
   * microbial mats and mounds that returned for a time after the Lau event of the Silurian. The painted pictures
   * (tools/extinctions) check only the chapter, so this is also what lets one of them show such a part.
   */
  localOnlyIn?: ChapterName[];
  /**
   * For the Ediacaran organisms, which fall into three sets of different ages and settings that did not live together:
   * 'avalon' (older, deep dark water), 'white-sea' (shallow sandy floors covered in microbial mat) and 'nama' (youngest,
   * shallow carbonate floors). The Precambrian is one chapter, so the Stage keeps them apart: one scene draws from one
   * assemblage only, the one with the most parts recorded near the place. A part found in more than one set, such as
   * the fronds, lists each and counts toward each. Every such part must be `localOnly`. The painted pictures do not
   * check this; whoever composes one must keep to one assemblage.
   */
  assemblages?: Assemblage[];
  /**
   * Fossil names that count as "recorded near here": genus names, and class names
   * as the Paleobiology Database spells them. A local record guarantees the part
   * appears and overrides the climate, latitude and landmass limits, but never
   * the scene or chapter limits. List a class only if this part fairly stands for
   * every member of it (Trilobita, Crinoidea). Never list Mammalia, Reptilia,
   * Osteichthyes, Cephalopoda, Insecta, Saurischia or Ornithischia: they are too
   * broad, and the database files some land animals under the wrong one.
   */
  matches: string[];
  /** Why it is on the list. One plain sentence, for a reader checking it. */
  basis: string;
}
