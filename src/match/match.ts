// The matching rules: turn the evidence for one location into an environment
// for each time chapter, with a confidence tier.
import { type Chapter, CHAPTERS, RECONSTRUCTION_LIMIT, chaptersSpanned, inChapter, overlap } from './chapters';
import type { MajorEvent } from './events';
import type { TectonicEvent } from './tectonics';
import { type EnvType, type Lith, envFromName, readLiths } from './taxonomy';
import type { Terrain } from '../geo/paleodem';

export interface RockUnit {
  /** 'here' = a geological-map unit at the point; 'column' = a unit in the regional Macrostrat column. */
  origin: 'here' | 'column';
  name: string;
  /** Age range in Ma. Undated units are dropped before matching. */
  old: number;
  young: number;
  liths: Lith[];
  /** Recorded depositional environments (columns only). */
  envs: string[];
  /** Key into the location's source list. */
  source: string;
}

export interface FossilSite {
  id: number;
  /** Distance from the location. */
  km: number;
  old: number;
  young: number;
  env: string;
  formation: string;
  /** "Genus|Class" */
  genera: string[];
}

/** The regional picture for one chapter, from the plate models and ancient maps. */
export interface Paleo {
  status: 'ok' | 'no-crust-yet' | 'not-reconstructable';
  /** Age in Ma at which the plate model first shows crust here (when status is 'no-crust-yet'). */
  crustAppears?: number;
  /** Ancient latitude by plate model, at the middle of the chapter. */
  lats: { model: string; lat: number }[];
  /** Ancient terrain at each 5-million-year step in the chapter. */
  terrain: { age: number; terrain: Terrain; nearLand: boolean; /** Elevation on the ancient map; negative below sea level. */ metres: number }[];
}

/** 1 recorded here; 2 inferred from rock type here; 3 recorded in the region; 4 regional map only; 5 no record. */
export type Tier = 1 | 2 | 3 | 4 | 5;

export const TIER_LABEL: Record<Tier, string> = {
  1: 'Recorded in the rocks here',
  2: 'Inferred from the rock type here',
  3: 'Recorded in the region',
  4: 'Regional picture only, lower confidence',
  5: 'No record',
};

export interface Environment {
  type: EnvType;
  tier: Tier;
  evidence: string[];
  /** Age range of the evidence, within the chapter (Ma). */
  old: number;
  young: number;
}

export interface ChapterResult {
  chapter: Chapter;
  /** Tier of the best evidence. */
  tier: Tier;
  /**
   * The matched environment first, then the others on record: the rest of the
   * best tier, then anything lower tiers add. Empty at tier 5.
   */
  environments: Environment[];
  notes: string[];
  /** Well-dated rock units at the point. */
  rocksHere: RockUnit[];
  /** Units from the regional column that are not confirmed at the point. */
  rocksRegion: RockUnit[];
  /** Units whose age range spans three or more chapters, or two chapters and more than 150 million years: context only. */
  looselyDated: RockUnit[];
  /** Rock at the point that formed below ground, and so records no surface environment. */
  underground: { unit: RockUnit; because: string }[];
  /** Major events that date loosely dated rock at the point. */
  events: MajorEvent[];
  /**
   * Mountain building in the region during this chapter, where rock that formed underground is mapped at the point and is
   * old enough to have been caught up in it. `unit` is the oldest such rock.
   */
  mountains: { event: TectonicEvent; unit: RockUnit }[];
  sitesNear: FossilSite[];
  sitesRegion: FossilSite[];
  paleo: Paleo | null;
}

export const NEAR_KM = 25;
export const REGION_KM = 100;
const LOOSE_SPAN = 3;
/**
 * A range that touches two chapters is also too loose if it is longer than this, in millions of years. Only a range
 * reaching back into the Precambrian can be: "1,000 to 485 million years ago" touches the Precambrian and the
 * Cambrian, and says almost nothing about the Cambrian.
 */
const LOOSE_YEARS = 150;
const MARINE: EnvType[] = ['deep-sea', 'shelf-sea', 'carbonate-sea', 'reef'];
const LAND: EnvType[] = ['river-plain', 'lake', 'swamp', 'desert', 'ice', 'volcanic-land', 'mountains', 'land'];
const TERRAIN_ENV: Record<Terrain, EnvType> = { 'deep-sea': 'deep-sea', 'shallow-sea': 'shelf-sea', land: 'land' };
const TERRAIN_WORD: Record<Terrain, string> = { 'deep-sea': 'deep sea', 'shallow-sea': 'shallow sea', land: 'land' };

interface Candidate {
  type: EnvType;
  /** False when the record says only "marine" or "terrestrial". */
  specific: boolean;
  score: number;
  evidence: string;
  old: number;
  young: number;
}

/**
 * Best supported first. A named setting ("river") always outranks an unspecific
 * one ("terrestrial"), however many records say only the unspecific thing.
 */
function rank(candidates: Candidate[], tier: Tier): Environment[] {
  const byType = new Map<EnvType, Environment & { specific: boolean; score: number }>();
  for (const c of candidates) {
    const e = byType.get(c.type) ?? { type: c.type, tier, evidence: [], old: c.old, young: c.young, specific: false, score: 0 };
    e.specific ||= c.specific;
    e.score += c.score;
    e.old = Math.max(e.old, c.old);
    e.young = Math.min(e.young, c.young);
    if (!e.evidence.includes(c.evidence)) e.evidence.push(c.evidence);
    byType.set(c.type, e);
  }
  return [...byType.values()]
    .sort((a, b) => Number(b.specific) - Number(a.specific) || b.score - a.score)
    .map(({ type, evidence, old, young }) => ({ type, tier, evidence, old, young }));
}

function majorityTerrain(steps: Paleo['terrain']): Terrain {
  const count = (t: Terrain) => steps.filter((s) => s.terrain === t).length;
  return (['land', 'shallow-sea', 'deep-sea'] as const).reduce((best, t) => (count(t) > count(best) ? t : best));
}

const sedimentary = (u: RockUnit) => u.liths.some((l) => l.class === 'sedimentary');

/** `events` and `tectonics` are the major events and the tectonic events whose extent covers the location. */
export function matchChapter(chapter: Chapter, units: RockUnit[], sites: FossilSite[], paleo: Paleo | null, events: MajorEvent[] = [], tectonics: TectonicEvent[] = []): ChapterResult {
  const length = chapter.old - chapter.young;
  // Share of the chapter that an item covers; an instant still counts a little.
  const share = (old: number, young: number) => Math.max(overlap(chapter, old, young) / length, 0.01);
  const clip = (old: number, young: number) => ({ old: Math.min(old, chapter.old), young: Math.max(young, chapter.young) });
  const loose = (old: number, young: number) => {
    const spanned = chaptersSpanned(old, young);
    return spanned >= LOOSE_SPAN || (spanned > 1 && old - young > LOOSE_YEARS);
  };

  const present = units.filter((u) => inChapter(chapter, u.old, u.young));
  const looselyDated = present.filter((u) => loose(u.old, u.young));
  const dated = present.filter((u) => !loose(u.old, u.young));
  const rocksHere = dated.filter((u) => u.origin === 'here');
  // A column describes a whole region. One of its units counts as "here" only if the
  // geological map shows sedimentary rock of overlapping age at the point: granite or
  // gneiss at the point says nothing about a sea recorded elsewhere in the region.
  const confirmedHere = (u: RockUnit) =>
    sedimentary(u) &&
    rocksHere.some((h) => sedimentary(h) && Math.min(h.old, u.old) - Math.max(h.young, u.young) > 0.05 * Math.min(h.old - h.young, u.old - u.young));
  const columnHere = dated.filter((u) => u.origin === 'column' && confirmedHere(u));
  const rocksRegion = dated.filter((u) => u.origin === 'column' && !confirmedHere(u));

  const datedSites = sites.filter((s) => inChapter(chapter, s.old, s.young) && !loose(s.old, s.young));
  const sitesNear = datedSites.filter((s) => s.km <= NEAR_KM);
  const sitesRegion = datedSites.filter((s) => s.km > NEAR_KM && s.km <= REGION_KM);

  const fromUnits = (list: RockUnit[]): Candidate[] =>
    list.flatMap((u) =>
      u.envs.flatMap((name) => {
        const env = envFromName(name);
        return env ? [{ ...env, ...clip(u.old, u.young), score: share(u.old, u.young) / u.envs.length, evidence: `${u.name} (${name})` }] : [];
      }),
    );
  const fromSites = (list: FossilSite[], where: string): Candidate[] => {
    const out: Candidate[] = [];
    for (const s of list) {
      const env = envFromName(s.env);
      if (env) out.push({ ...env, ...clip(s.old, s.young), score: share(s.old, s.young), evidence: '' });
    }
    // One evidence line per environment type: "7 fossil sites within 25 km".
    for (const c of out) {
      const n = out.filter((o) => o.type === c.type).length;
      c.evidence = `${n} fossil ${n === 1 ? 'site' : 'sites'} ${where}`;
    }
    return out;
  };

  const notes: string[] = [];
  const underground: ChapterResult['underground'] = [];
  const fromRockType: Candidate[] = [];
  const landOnMap = paleo?.status === 'ok' && paleo.terrain.some((t) => t.nearLand);
  for (const u of rocksHere) {
    for (const reading of readLiths(u.liths, u.name)) {
      const candidate = { specific: true, ...clip(u.old, u.young), evidence: `${u.name} (${reading.because})` };
      if (reading.kind === 'underground') underground.push({ unit: u, because: reading.because });
      else if (reading.kind === 'environment') fromRockType.push({ ...candidate, type: reading.type, score: share(u.old, u.young) * (reading.named ? 2 : 1) });
      // Lava erupts on land and under the sea. Claim volcanic land only where the regional map shows land.
      else if (landOnMap) fromRockType.push({ ...candidate, type: 'volcanic-land', score: share(u.old, u.young) });
      else notes.push(`Volcanic rock (${reading.because}) formed here, but nothing shows whether it erupted on land or under water.`);
    }
  }

  // A major event can date rock that the map dates too loosely to use on its own.
  const eventsUsed: MajorEvent[] = [];
  for (const event of events) {
    if (!inChapter(chapter, event.old, event.young)) continue;
    for (const u of looselyDated) {
      const reading = readLiths(u.liths, u.name).find((r) => r.kind === event.rock);
      if (u.origin !== 'here' || u.old < event.old || u.young > event.young || !reading) continue;
      fromRockType.push({ type: event.environment, specific: true, ...clip(event.old, event.young), score: share(event.old, event.young), evidence: `${u.name} (${reading.because}), dated by the ${event.name}` });
      if (!eventsUsed.includes(event)) eventsUsed.push(event);
    }
  }

  // Rock that formed underground cannot say when it was later squeezed and lifted. A mountain-building event in the
  // region can, provided the rock (or the rock it was made from) already existed: the map's age for it must not be
  // younger than the end of the event.
  const deepHere = units.filter((u) => u.origin === 'here' && readLiths(u.liths, u.name).some((r) => r.kind === 'underground')).sort((a, b) => b.old - a.old);
  const mountains: ChapterResult['mountains'] = [];
  for (const event of tectonics) {
    if (event.kind !== 'mountains' || !inChapter(chapter, event.old, event.young)) continue;
    const unit = deepHere.find((u) => u.old >= event.young);
    if (unit) mountains.push({ event, unit });
  }
  // That is evidence from the region, and it ranks with it: rock or fossils that record a setting at the spot come first.
  // Among the evidence from the region, mountains lead: the event names this ground, while rock recorded elsewhere in the
  // region (a sea, a river plain) is more likely the lowland beside the range than the range itself.
  const fromMountains: Candidate[] = mountains.map(({ event, unit }) => ({
    type: 'mountains',
    specific: true,
    ...clip(event.old, event.young),
    score: share(event.old, event.young),
    evidence: `${event.name} in this region; ${unit.name}, mapped here, formed underground and is old enough to have been here at the time`,
  }));

  const ladder: Environment[][] = [
    rank([...fromUnits(columnHere), ...fromSites(sitesNear, `within ${NEAR_KM} km`)], 1),
    rank(fromRockType, 2),
    [...rank(fromMountains, 3), ...rank([...fromUnits(rocksRegion), ...fromSites(sitesRegion, `${NEAR_KM} to ${REGION_KM} km away`)], 3)],
  ];
  const environments: Environment[] = [];
  for (const rung of ladder) for (const e of rung) if (!environments.some((x) => x.type === e.type)) environments.push(e);
  // Evidence at the spot that says only "land" does not say what kind of land. Mountains recorded for the region do, and agree with it.
  const range = environments.find((e) => e.type === 'mountains');
  if (range && environments[0]!.type === 'land') environments.unshift(...environments.splice(environments.indexOf(range), 1));

  const mapTerrain = paleo?.status === 'ok' && paleo.terrain.length > 0 ? majorityTerrain(paleo.terrain) : null;
  let tier: Tier = 5;
  if (environments.length > 0) {
    tier = environments[0]!.tier;
    const best = environments[0]!.type;
    const mapSaysSea = mapTerrain === 'deep-sea' || mapTerrain === 'shallow-sea';
    if (mapTerrain && ((mapSaysSea && LAND.includes(best)) || (mapTerrain === 'land' && MARINE.includes(best)))) {
      notes.push(`The broad-scale map shows ${TERRAIN_WORD[mapTerrain]} here at this time. The local evidence is preferred.`);
    }
  } else if (mapTerrain) {
    tier = 4;
    const steps = paleo!.terrain;
    environments.push({ type: TERRAIN_ENV[mapTerrain], tier, evidence: [`Ancient elevation map: ${TERRAIN_WORD[mapTerrain]}`], old: chapter.old, young: chapter.young });
    const others = steps.filter((s) => s.terrain !== mapTerrain);
    if (others.length > 0) {
      notes.push(`The map shows ${TERRAIN_WORD[mapTerrain]} for most of this time, but ${others.map((s) => `${TERRAIN_WORD[s.terrain]} at ${s.age} million years ago`).join(', ')}.`);
    }
  } else if (!paleo) {
    // Either a chapter older than the ancient maps, or the maps failed to load (the page says so separately).
    notes.push(chapter.old > RECONSTRUCTION_LIMIT ? 'No rock of this age is recorded here, and ancient maps do not reach back this far.' : 'No rock of this age is recorded here.');
  } else if (paleo.status === 'no-crust-yet') {
    notes.push(`The crust here did not exist yet. The plate model shows none before about ${paleo.crustAppears} million years ago.`);
  } else {
    notes.push('The plate model does not reconstruct this spot, so there is no regional picture for it.');
  }

  return { chapter, tier, environments, notes, rocksHere: [...rocksHere, ...columnHere], rocksRegion, looselyDated, underground, events: eventsUsed, mountains, sitesNear, sitesRegion, paleo };
}

export function matchTimeline(units: RockUnit[], sites: FossilSite[], paleo: (Paleo | null)[], events: MajorEvent[] = [], tectonics: TectonicEvent[] = []): ChapterResult[] {
  return CHAPTERS.map((chapter, i) => matchChapter(chapter, units, sites, paleo[i] ?? null, events, tectonics));
}
