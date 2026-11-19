import { describe, expect, it } from 'vitest';
import { CHAPTER_NAMES, type ChapterName } from '../src/match/chapters';
import { ENV_LABEL, type EnvType } from '../src/match/taxonomy';
import { makeRng } from '../src/scenes/draw';
import type { PartDef } from '../src/scenes/part';
import { ALL_GROUPS as GROUPS, ALL_PARTS as PARTS, ALL_PERMITS as PERMITS, PAINTING_PARTS } from '../src/scenes/all-parts';
import { PARTS as SCENE_PARTS } from '../src/scenes/parts';
import { GROUP_RANGE, type Climate, type Region, regionsIn, span } from '../src/scenes/permit';
import { regionOf } from '../src/scenes/region';
import { partSvg } from '../src/scenes/part-card';
import { composeScene } from '../src/scenes/scene';
import { listedAs } from '../src/scenes/stage';
import { GROUPS as SCENE_GROUPS, PERMITS as SCENE_PERMITS } from '../src/scenes/whitelist';

const ENVS = Object.keys(ENV_LABEL) as EnvType[];
const CENOZOIC: ChapterName[] = ['Paleogene', 'Neogene', 'Quaternary'];
const permitOf = (id: string) => PERMITS.find((p) => p.id === id)!;
const older = (a: ChapterName, b: ChapterName) => CHAPTER_NAMES.indexOf(a) > CHAPTER_NAMES.indexOf(b);

describe('the whitelist', () => {
  it('has exactly one entry for every drawing, and one drawing for every entry', () => {
    const ids = PERMITS.map((p) => p.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    expect(ids.filter((id) => !PARTS[id])).toEqual([]);
    expect(Object.keys(PARTS).filter((id) => !ids.includes(id))).toEqual([]);
    // No drawing is defined twice across the group files.
    const files = import.meta.glob<{ PARTS?: Record<string, PartDef>; PAINTING_PARTS?: Record<string, PartDef> }>('../src/scenes/parts/*.ts', { eager: true });
    const perFile = Object.entries(files).flatMap(([file, m]) => (file.endsWith('index.ts') ? [] : [...Object.keys(m.PARTS ?? {}), ...Object.keys(m.PAINTING_PARTS ?? {})]));
    expect(perFile.filter((id, i) => perFile.indexOf(id) !== i)).toEqual([]);
  });

  it('keeps the parts made only for the painted pictures out of the scene script', () => {
    // The scene script takes PARTS, PERMITS and GROUPS; everything listed there must be drawable in a scene,
    // and everything kept apart must be for the paintings alone.
    expect(SCENE_PERMITS.filter((p) => p.paintingsOnly).map((p) => p.id)).toEqual([]);
    expect(PERMITS.filter((p) => p.paintingsOnly && SCENE_PARTS[p.id]).map((p) => p.id)).toEqual([]);
    expect(Object.keys(PAINTING_PARTS).filter((id) => !PERMITS.find((p) => p.id === id)?.paintingsOnly)).toEqual([]);
    expect(Object.keys(SCENE_PARTS).filter((id) => !SCENE_PERMITS.some((p) => p.id === id))).toEqual([]);
    expect(SCENE_GROUPS.flatMap((g) => g.permits).length).toBe(SCENE_PERMITS.length);
  });

  it('gives every entry a name, a reason, and at least one scene and chapter', () => {
    for (const p of PERMITS) {
      expect(p.name.length, p.id).toBeGreaterThan(2);
      expect(p.basis.length, p.id).toBeGreaterThan(15);
      // A part made for the painted pictures alone lists no scene, and that is the only kind that may.
      expect(p.scenes.length > 0, p.id).toBe(!p.paintingsOnly);
      expect(p.chapters.length, p.id).toBeGreaterThan(0);
      expect(p.scenes.filter((s) => !ENVS.includes(s)), p.id).toEqual([]);
      if (p.latitudes) expect(p.latitudes[0], p.id).toBeLessThan(p.latitudes[1]);
      // A landmass list for one chapter is only meaningful for a chapter the part is listed in.
      expect(Object.keys(p.regionsByChapter ?? {}).filter((c) => !p.chapters.includes(c as ChapterName)), p.id).toEqual([]);
      expect((p.localOnlyIn ?? []).filter((c) => !p.chapters.includes(c)), p.id).toEqual([]);
    }
  });

  it('keeps every group inside its known time range', () => {
    for (const p of PERMITS) {
      const range = GROUP_RANGE[p.group];
      if (!range) continue;
      const allowed = span(range[0], range[1]);
      expect(p.chapters.filter((c) => !allowed.includes(c)), `${p.id} (${p.group})`).toEqual([]);
    }
  });

  it('has no grass before the Cenozoic and no flowering plants before the Cretaceous', () => {
    for (const p of PERMITS) {
      if (p.group === 'grass') expect(p.chapters.filter((c) => !CENOZOIC.includes(c)), p.id).toEqual([]);
      if (p.group === 'grass' || p.group === 'flowering') expect(p.chapters.filter((c) => older(c, 'Early Cretaceous')), p.id).toEqual([]);
    }
    // A plant whose name gives it away must be filed under the right group, or the rule above would miss it.
    const telltale = /grass|flower|palm|lily|lotus|broadleaf|oak|maple|birch|willow|magnolia|mangrove|cactus|sedge|reed|cattail|eucalypt|acacia|beech|shrub|seagrass/i;
    for (const p of PERMITS) {
      if (telltale.test(`${p.id} ${p.name}`) && !/reedfish|sea lily/i.test(p.name)) expect(['grass', 'flowering'], `${p.id} is filed under ${p.group}`).toContain(p.group);
    }
  });

  it('lists no fossil class that is too broad to stand for one part', () => {
    const tooBroad = ['mammalia', 'reptilia', 'osteichthyes', 'cephalopoda', 'insecta', 'saurischia', 'ornithischia', 'no_class_specified'];
    for (const p of PERMITS) expect(p.matches.filter((m) => tooBroad.includes(m.toLowerCase())), p.id).toEqual([]);
  });
});

/** Tags that carry the same attribute twice. Browsers forgive that inside a page; a standalone SVG file is rejected. */
function doubledAttributes(svg: string): string[] {
  const bad: string[] = [];
  for (const tag of svg.match(/<[a-zA-Z][^>]*>/g) ?? []) {
    const names = [...tag.matchAll(/\s([a-zA-Z:-]+)=/g)].map((m) => m[1]!);
    if (new Set(names).size !== names.length) bad.push(tag.slice(0, 80));
  }
  return bad;
}

describe('the drawings', () => {
  it.each(Object.keys(PARTS))('%s follows the drawing conventions', (id) => {
    const def = PARTS[id]!;
    expect(def.w).toBeGreaterThan(10);
    expect(def.h).toBeGreaterThan(5);
    for (const detail of [true, false]) {
      for (const sun of [1, -1] as const) {
        // Every colour must pass through `tone`: here tone returns a marker, so any colour left in the output was written bare.
        const out = def.draw({ rng: makeRng(5), tone: () => 'TONED', detail, sun });
        expect(out.length).toBeGreaterThan(20);
        expect(out).not.toMatch(/NaN|undefined|Infinity/);
        expect(out, 'a colour that did not go through tone()').not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgb\(|hsl\(/);
        expect(out, 'ids, gradients, filters and text are not allowed in a part').not.toMatch(/\bid="|<defs|url\(|<text|<filter|<linearGradient|<radialGradient/);
        expect(doubledAttributes(out)).toEqual([]);
      }
    }
    expect(partSvg(id)).toContain('<svg');
  });
});

describe('the scenes', () => {
  const settings: { paleolatitude: number | null; climate: Climate; region?: Region; waterLevel?: number }[] = [
    { paleolatitude: 10, climate: 'neutral', region: 'north-america' },
    { paleolatitude: -70, climate: 'cold', region: 'antarctica', waterLevel: 0 },
    { paleolatitude: 35, climate: 'wet', region: 'asia', waterLevel: 1 },
    { paleolatitude: -25, climate: 'dry', region: 'australia' },
    { paleolatitude: null, climate: 'neutral' },
  ];

  it.each(ENVS)('%s renders in every chapter, under every kind of setting', (environment) => {
    for (const chapter of CHAPTER_NAMES) {
      settings.forEach((s, i) => {
        const r = composeScene({ environment, chapter, seed: 1000 + i * 37, ...s });
        expect(r.svg, `${chapter} ${i}`).not.toMatch(/NaN|undefined|Infinity/);
        expect(r.svg).toContain('Representative scene, not a portrait of this exact spot');
        expect(doubledAttributes(r.svg), `${chapter} ${i}`).toEqual([]);
        expect(r.description.length).toBeGreaterThan(60);
        // The whitelist gate: nothing drawn is outside its scenes or chapters.
        for (const id of r.shown.keys()) {
          const p = permitOf(id);
          expect(p.scenes, `${id} in ${environment}`).toContain(listedAs(environment));
          expect(p.chapters, `${id} in ${chapter}`).toContain(chapter);
          if (!r.shown.get(id)) {
            const regions = regionsIn(p, chapter);
            if (regions) expect(regions, `${id} in ${s.region}`).toContain(s.region);
            expect(p.localOnly, `${id} is local-only`).toBeFalsy();
            expect(p.localOnlyIn ?? [], `${id} is local-only in the ${chapter}`).not.toContain(chapter);
          }
        }
      });
    }
  });

  it('gives the same picture for the same place, and a different one for another', () => {
    const p = { environment: 'swamp' as const, chapter: 'Late Carboniferous' as const, paleolatitude: -5, climate: 'wet' as const, seed: 12 };
    const strip = (svg: string) => svg.replace(/s[a-z0-9]{5}\d+/g, 'ID');
    expect(strip(composeScene(p).svg)).toBe(strip(composeScene(p).svg));
    expect(strip(composeScene({ ...p, seed: 13 }).svg)).not.toBe(strip(composeScene(p).svg));
  });

  it('always shows a part whose fossils are recorded nearby, but never outside its chapters', () => {
    const base = { environment: 'swamp' as const, paleolatitude: -5, climate: 'neutral' as const, seed: 3, localOrganisms: ['Sigillaria|Lycopsida'] };
    expect(composeScene({ ...base, chapter: 'Late Carboniferous' }).shown.get('sigillaria')).toBe(true);
    expect(composeScene({ ...base, chapter: 'Jurassic' }).shown.has('sigillaria')).toBe(false);
  });
});

describe('the three Ediacaran assemblages', () => {
  const EDIACARAN = ['Charnia', 'Fractofusus', 'Dickinsonia', 'Kimberella', 'Tribrachidium', 'Cloudina'];
  const seeds = Array.from({ length: 10 }, (_, i) => i * 53 + 2);
  const drawn = (environment: EnvType, localOrganisms: string[], seed: number) =>
    [...composeScene({ environment, chapter: 'Precambrian', paleolatitude: null, climate: 'neutral', seed, localOrganisms }).shown.keys()].filter((id) => permitOf(id).assemblages).sort();
  /** The assemblages that every part drawn belongs to: never empty if the scene keeps to one. */
  const shared = (ids: string[]) => ids.map((id) => permitOf(id).assemblages!).reduce((a, b) => a.filter((x) => b.includes(x)));

  it('files every Ediacaran part under its assemblages, and draws it only where its fossils are recorded', () => {
    for (const p of PERMITS) {
      expect(p.assemblages !== undefined, p.id).toBe(p.group === 'ediacaran');
      if (p.assemblages) expect(p.localOnly, p.id).toBe(true);
    }
    const sets: Record<string, string[]> = {};
    for (const p of PERMITS) for (const a of p.assemblages ?? []) (sets[a] ??= []).push(p.id);
    // The fronds lived both in deep water and on the shallow sandy floors.
    expect(sets).toEqual({ avalon: ['charnia', 'fractofusus'], 'white-sea': ['charnia', 'dickinsonia', 'kimberella', 'tribrachidium'], nama: ['cloudina'] });
    for (const environment of ENVS) for (const seed of seeds) expect(drawn(environment, [], seed), environment).toEqual([]);
  });

  it('never draws from two assemblages in one scene, whatever is recorded nearby', () => {
    const records = [EDIACARAN, ['Charnia', 'Dickinsonia'], ['Dickinsonia', 'Cloudina'], ['Arborea', 'Kimberella'], ['Charnia', 'Fractofusus', 'Cloudina', 'Tribrachidium']];
    for (const environment of ENVS) {
      for (const localOrganisms of records) {
        for (const seed of seeds) {
          const ids = drawn(environment, localOrganisms, seed);
          if (ids.length) expect(shared(ids), `${environment}: ${localOrganisms.join(', ')} (seed ${seed})`).not.toEqual([]);
        }
      }
    }
  });

  it('keeps to the assemblage with the most parts recorded nearby, and shows all of it', () => {
    for (const seed of seeds) {
      // An open shelf is the one scene type shared by the frond and the White Sea three, and the frond belongs to both sets.
      expect(drawn('shelf-sea', EDIACARAN, seed)).toEqual(['charnia', 'dickinsonia', 'kimberella', 'tribrachidium']);
      expect(drawn('deep-sea', EDIACARAN, seed)).toEqual(['charnia', 'fractofusus']);
      expect(drawn('shoreline', EDIACARAN, seed)).toEqual(['dickinsonia', 'kimberella', 'tribrachidium']);
      expect(drawn('reef', EDIACARAN, seed)).toEqual(['cloudina']);
      expect(drawn('shelf-sea', ['Charnia', 'Fractofusus'], seed)).toEqual(['charnia']);
      expect(drawn('shelf-sea', ['Arborea', 'Dickinsonia'], seed)).toEqual(['charnia', 'dickinsonia']);
      // In deep water the frond keeps company with Fractofusus, never with the shallow-water animals.
      expect(drawn('deep-sea', ['Charnia', 'Dickinsonia', 'Kimberella'], seed)).toEqual(['charnia']);
    }
    // One part of each recorded: the place's seed settles it, and both answers turn up.
    const ties = seeds.map((seed) => drawn('carbonate-sea', ['Dickinsonia', 'Cloudina'], seed).join());
    expect(new Set(ties)).toEqual(new Set(['dickinsonia', 'cloudina']));
  });
});

describe('landmasses', () => {
  it('puts the test places on the right landmass', () => {
    const cases: [string, number, number, Region][] = [
      ['Grand Canyon', 36.1, -112.1, 'north-america'],
      ['London', 51.5, -0.1, 'europe'],
      ['Reykjavik', 64.1, -21.9, 'europe'],
      ['Karoo', -32.3, 22.6, 'africa'],
      ['Fayum', 29.3, 30.8, 'africa'],
      ['Delhi', 28.6, 77.2, 'india'],
      ['Liaoning', 41.8, 123.4, 'asia'],
      ['Sydney', -33.9, 151.2, 'australia'],
      ['Wellington', -41.3, 174.8, 'new-zealand'],
      ['Paraná Basin', -24, -51, 'south-america'],
      ['Transantarctic Mountains', -84, 166, 'antarctica'],
      ['Greenland', 72, -40, 'north-america'],
      ['Panama', 9, -79.5, 'north-america'],
    ];
    for (const [name, lat, lng, region] of cases) expect(regionOf(lat, lng), name).toBe(region);
  });
});

describe('whitelist groups', () => {
  it('every group file is listed', () => {
    const files = Object.keys(import.meta.glob('../src/scenes/whitelist/*.ts')).filter((f) => !f.endsWith('index.ts'));
    expect(GROUPS.length).toBe(files.length);
  });
});

describe('parts tied to one spot', () => {
  const quaternary = (place: { lat: number; lng: number }, seed: number) =>
    composeScene({ environment: 'land', chapter: 'Quaternary', paleolatitude: place.lat, climate: 'neutral', seed, region: regionOf(place.lat, place.lng), place }).shown;

  it('counts Java as Asia and New Guinea as Australia', () => {
    expect(regionOf(-7.4, 110.8)).toBe('asia'); // Sangiran, Java
    expect(regionOf(-8.6, 121.1)).toBe('asia'); // Flores
    expect(regionOf(-6, 141)).toBe('australia'); // New Guinea
    expect(regionOf(-25, 134)).toBe('australia');
  });

  it('shows Homo floresiensis on Flores and nowhere else', () => {
    const seeds = Array.from({ length: 12 }, (_, i) => i + 1);
    expect(seeds.some((seed) => quaternary({ lat: -8.6, lng: 121.1 }, seed).has('floresiensis'))).toBe(true);
    for (const place of [{ lat: -7.4, lng: 110.8 }, { lat: 13.7, lng: 100.5 }, { lat: -25, lng: 134 }]) {
      expect(seeds.some((seed) => quaternary(place, seed).has('floresiensis'))).toBe(false);
    }
  });
});
