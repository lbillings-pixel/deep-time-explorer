// The local half of a chapter's story: a few plain sentences built only from
// the data for this place. They say what the match rests on, where the place
// lay, what the rocks say of the climate, and which fossils are found nearby.
// The general half is the passage for the chapter and environment.

import { CLIMATE_WORD, climateEvidence } from '../match/climate';
import { type ChapterResult, type FossilSite, NEAR_KM, REGION_KM, type RockUnit } from '../match/match';
import { wornDown } from '../match/mountain-caveats';
import { FOSSIL_GROUPS, FOSSIL_GROUP_CAVEATS } from './fossil-groups';

function listOf(items: string[]): string {
  if (items.length < 2) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

const count = (n: number, one: string, many: string) => `${n.toLocaleString('en')} ${n === 1 ? one : many}`;

function unitNames(units: RockUnit[], limit = 3): string {
  const names = [...new Set(units.map((u) => u.name))];
  return listOf(names.slice(0, limit)) + (names.length > limit ? ` and ${names.length - limit} more` : '');
}

export interface Genus {
  name: string;
  /** The class the fossil database files it under. Not shown to visitors as it stands. */
  cls: string;
}

/** The genera recorded at the most sites, most frequent first, without any subgenus. */
export function commonGenera(sites: FossilSite[], limit: number): Genus[] {
  const tally = new Map<string, { genus: Genus; sites: number }>();
  for (const s of sites) {
    // "Dyoros (Dyoros)|Strophomenata" -> Dyoros, of the class Strophomenata
    const here = new Map(s.genera.map((g) => [g.split(/[ |]/)[0]!, g.split('|')[1] ?? '']));
    for (const [name, cls] of here) {
      const entry = tally.get(name) ?? { genus: { name, cls }, sites: 0 };
      entry.sites++;
      tally.set(name, entry);
    }
  }
  return [...tally.values()]
    .sort((a, b) => b.sites - a.sites)
    .slice(0, limit)
    .map((entry) => entry.genus);
}

const groupOf = (genus: Genus) => FOSSIL_GROUPS.genera[genus.name] ?? FOSSIL_GROUPS.classes[genus.cls];

/** "Diictodon (a mammal relative)" where the plain-language lists cover the genus. */
export function withGroup(genus: Genus): string {
  const group = groupOf(genus);
  return group ? `${genus.name} (${group})` : genus.name;
}

/**
 * The caveats on the plain-language labels given to these fossil names: the
 * general one, then every one that names a label or a fossil in the list.
 */
export function labelCaveats(genera: Genus[]): string[] {
  const labeled = genera.map((g) => ({ name: g.name, group: groupOf(g) })).filter((x) => x.group);
  if (labeled.length === 0) return [];
  const [general, ...rest] = FOSSIL_GROUP_CAVEATS;
  const named = rest.filter((text) => labeled.some((l) => text.includes(`"${l.group}"`) || new RegExp(`\\b${l.name}\\b`).test(text)));
  return [general!, ...named];
}

/** The fossil names a chapter card shows: the commonest nearby, or failing that in the region. */
export const shownGenera = (c: ChapterResult) => commonGenera(c.sitesNear.length > 0 ? c.sitesNear : c.sitesRegion, 6);

export const latitudeWords = (lat: number) => (Math.round(Math.abs(lat)) === 0 ? 'on the equator' : `about ${Math.round(Math.abs(lat))}° ${lat >= 0 ? 'north' : 'south'} of the equator`);

const TERRAIN: Record<string, string> = { 'Ancient elevation map: land': 'land', 'Ancient elevation map: shallow sea': 'a shallow sea', 'Ancient elevation map: deep sea': 'deep sea' };

export function localSentences(c: ChapterResult): string[] {
  const env = c.environments[0];
  if (!env) return [];
  const out: string[] = [];
  const near = c.sitesNear.length;
  const far = c.sitesRegion.length;

  if (c.tier === 1) {
    const parts: string[] = [];
    if (c.rocksHere.length > 0) parts.push(`rock of this age is recorded here (${unitNames(c.rocksHere)})`);
    if (near > 0) parts.push(`${count(near, 'fossil site', 'fossil sites')} of this age ${near === 1 ? 'lies' : 'lie'} within ${NEAR_KM} km`);
    const text = parts.join(', and ');
    if (text) out.push(text.charAt(0).toUpperCase() + text.slice(1) + '.');
  } else if (c.tier === 2) {
    out.push(`The setting is read from the kind of rock found here: ${env.evidence.slice(0, 2).join('; ')}.`);
  } else if (env.type === 'mountains') {
    // Mountains are never read from rock of the chapter's own age: they come from a published event and from deep rock at the
    // spot or, for an event still going on, from high ground at the spot today.
    // Where mountains were being built, ranges that were only wearing down at the time are left out of the sentence.
    const state = wornDown(c) ? 'wearing-down' : 'building';
    const events = [...new Set(c.mountains.filter((m) => m.state === state).map((m) => m.event.name))].join(' and the ');
    const tie = wornDown(c)
      ? 'from rock mapped here that formed deep underground and is old enough to have been part of those mountains. Their building had ended by this time, and they are taken to have still stood, wearing down'
      : c.mountains.some((m) => m.unit)
      ? 'from rock mapped here that formed deep underground and is old enough to have been here while the mountains were built'
      : 'from the high ground that rises within 10 km of this spot today, in a range that is still rising';
    out.push(`No rock at this spot records the surface at this time. The setting comes from published work on the region (the ${events}) and ${tie}.`);
  } else if (c.tier === 3) {
    const parts: string[] = [];
    if (c.rocksRegion.length > 0) parts.push(`rock recorded in the region (${unitNames(c.rocksRegion)})`);
    if (far > 0) parts.push(`${count(far, 'fossil site', 'fossil sites')} ${NEAR_KM} to ${REGION_KM} km away`);
    out.push(`No rock of this age is confirmed at this exact spot. The setting comes from ${parts.join(' and ')}.`);
  } else if (c.tier === 4) {
    const shows = TERRAIN[env.evidence[0] ?? ''];
    out.push(`No rock of this age is recorded here. Broad maps of the ancient world show ${shows ?? 'this setting'} in this area, and the picture rests on that alone.`);
  }

  const lat = c.paleo?.status === 'ok' ? c.paleo.lats[0]?.lat : undefined;
  if (lat !== undefined) out.push(`At the time, this spot lay ${latitudeWords(lat)}.${c.chapter.young >= 200 ? ' Positions this old are uncertain.' : ''}`);

  for (const e of climateEvidence(c)) out.push(`The ${e.rock} in the ${e.unit} points to ${CLIMATE_WORD[e.climate]}.`);

  const sites = near > 0 ? c.sitesNear : c.sitesRegion;
  const genera = commonGenera(sites, 4).map(withGroup);
  if (genera.length > 0) out.push(`Fossils of this age found ${near > 0 ? `within ${NEAR_KM} km` : `within ${REGION_KM} km`} include ${listOf(genera)}.`);
  return out;
}
