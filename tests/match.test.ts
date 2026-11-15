import { describe, expect, it } from 'vitest';
import { CHAPTERS, chaptersSpanned } from '../src/match/chapters';
import { type FossilSite, type Paleo, type RockUnit, matchChapter } from '../src/match/match';
import { envFromName, readLiths } from '../src/match/taxonomy';

const chapter = (id: string) => CHAPTERS.find((c) => c.id === id)!;
const lith = (name: string, type: string, cls = 'sedimentary') => ({ name, type, class: cls });
const unit = (over: Partial<RockUnit>): RockUnit => ({ origin: 'here', name: 'Test unit', old: 290, young: 260, liths: [], envs: [], source: 'test', ...over });
const site = (over: Partial<FossilSite>): FossilSite => ({ id: 1, km: 5, old: 290, young: 260, env: 'fluvial indet.', formation: '', genera: [], ...over });
const map = (terrain: Paleo['terrain'][number]['terrain'], nearLand = terrain === 'land'): Paleo => ({
  status: 'ok',
  lats: [{ model: 'PALEOMAP', lat: -40 }],
  terrain: [{ age: 275, terrain, nearLand, metres: terrain === 'land' ? 200 : terrain === 'shallow-sea' ? -50 : -3000 }],
});

describe('taxonomy', () => {
  it('maps both vocabularies, quoted or not', () => {
    expect(envFromName('"floodplain"')).toEqual({ type: 'river-plain', specific: true });
    expect(envFromName('reef, buildup or bioherm')?.type).toBe('reef');
    expect(envFromName('marine indet.')).toEqual({ type: 'shelf-sea', specific: false });
    expect(envFromName('loess')?.type).toBe('desert');
    expect(envFromName('')).toBeNull();
  });

  it('reads rock type only when it is diagnostic', () => {
    expect(readLiths([lith('sandstone', 'siliciclastic'), lith('shale', 'siliciclastic')])).toEqual([]);
    expect(readLiths([lith('sandstone', 'siliciclastic'), lith('coal', 'organic')])).toMatchObject([{ type: 'swamp' }]);
    expect(readLiths([lith('limestone', 'carbonate'), lith('dolomite', 'carbonate'), lith('shale', 'siliciclastic')])).toMatchObject([{ type: 'carbonate-sea' }]);
    // Limestone as a minor part of a sandstone unit decides nothing.
    expect(readLiths([lith('sandstone', 'siliciclastic'), lith('clay', 'siliciclastic'), lith('limestone', 'carbonate')])).toEqual([]);
    // A till with peat in it records both ice and bog; the unit's name says which matters more.
    expect(readLiths([lith('till', 'siliciclastic'), lith('peat', 'organic')], 'Clayey Till')).toMatchObject([
      { type: 'swamp', named: false },
      { type: 'ice', named: true },
    ]);
    expect(readLiths([lith('basalt', 'volcanic', 'igneous')])).toMatchObject([{ kind: 'volcanic' }]);
    expect(readLiths([lith('granite', 'plutonic', 'igneous')])).toMatchObject([{ kind: 'underground' }]);
  });
});

describe('the evidence ladder', () => {
  const permian = chapter('permian');

  it('tier 1: a fossil site within 25 km with a recorded environment', () => {
    const r = matchChapter(permian, [], [site({ km: 5 })], map('shallow-sea'));
    expect(r.tier).toBe(1);
    expect(r.environments[0]!.type).toBe('river-plain');
    // The regional map disagrees, and the result says so.
    expect(r.notes.join(' ')).toMatch(/local evidence is preferred/);
  });

  it('tier 2: diagnostic rock type at the point', () => {
    const r = matchChapter(permian, [unit({ liths: [lith('limestone', 'carbonate')] })], [], map('land'));
    expect(r.tier).toBe(2);
    expect(r.environments[0]!.type).toBe('carbonate-sea');
  });

  it('tier 3: a fossil site 25 to 100 km away', () => {
    const r = matchChapter(permian, [], [site({ km: 60 })], map('land'));
    expect(r.tier).toBe(3);
  });

  it('tier 4: only the regional map', () => {
    const r = matchChapter(permian, [unit({ liths: [lith('sandstone', 'siliciclastic')] })], [], map('shallow-sea'));
    expect(r.tier).toBe(4);
    expect(r.environments[0]!.type).toBe('shelf-sea');
    expect(r.rocksHere).toHaveLength(1);
  });

  it('tier 5: nothing at all', () => {
    const r = matchChapter(permian, [], [], { status: 'no-crust-yet', crustAppears: 15, lats: [], terrain: [] });
    expect(r.tier).toBe(5);
    expect(r.notes[0]).toMatch(/did not exist yet/);
  });

  it('a specific environment outranks many unspecific ones in the same tier', () => {
    const sites = [site({ id: 1, env: 'reef' }), site({ id: 2, env: 'marine indet.' }), site({ id: 3, env: 'marine indet.' })];
    expect(matchChapter(permian, [], sites, null).environments[0]!.type).toBe('reef');
  });
});

describe('dating', () => {
  it('counts the chapters an age range spans', () => {
    expect(chaptersSpanned(290, 260)).toBe(1);
    expect(chaptersSpanned(145, 23.03)).toBe(3);
    expect(chaptersSpanned(3200, 2500)).toBe(1);
  });

  it('a unit spanning three or more chapters is context only', () => {
    const basalt = unit({ old: 145, young: 23.03, liths: [lith('basalt', 'volcanic', 'igneous')] });
    const r = matchChapter(chapter('paleogene'), [basalt], [], map('land'));
    expect(r.looselyDated).toHaveLength(1);
    expect(r.tier).toBe(4);
  });

  it('a unit dated "1,000 to 485 million years ago" cannot place a regional formation at the point', () => {
    // Greenville, South Carolina: a world-scale map shows sediment and lava of Neoproterozoic to Cambrian age, and the
    // regional column lists Cambrian formations of the Carolina Slate Belt, which lie far to the southeast.
    const worldMap = unit({ name: 'Interlayered sedimentary and volcanic rocks', old: 1000, young: 485.4, liths: [lith('volcanic', 'volcanic', 'igneous'), lith('sedimentary', '')] });
    const formation = unit({ origin: 'column', name: 'Richtex Formation', old: 513.3, young: 501, liths: [lith('siltstone', 'siliciclastic')], envs: ['marine indet.'] });
    const r = matchChapter(chapter('cambrian'), [worldMap, formation], [], null);
    expect(r.looselyDated).toEqual([worldMap]);
    expect(r.rocksHere).toEqual([]);
    expect(r.rocksRegion).toEqual([formation]);
    expect(r.tier).toBe(3);
    // A range that long inside one chapter is still dated to that chapter.
    expect(matchChapter(chapter('precambrian'), [unit({ old: 1000, young: 538.8 })], [], null).looselyDated).toEqual([]);
    // Two full chapters of ordinary length are not too long.
    expect(matchChapter(chapter('jurassic'), [unit({ old: 251.9, young: 143.1 })], [], null).looselyDated).toEqual([]);
  });
});

describe('rock that does not record the surface', () => {
  it('granite gives an underground note and leaves the scene to the map', () => {
    const r = matchChapter(chapter('permian'), [unit({ liths: [lith('granite', 'plutonic', 'igneous')] })], [], map('land'));
    expect(r.underground).toHaveLength(1);
    expect(r.tier).toBe(4);
  });

  it('gneiss inside a mountain belt gives mountains, ahead of rock recorded elsewhere in the region but behind rock recorded here', () => {
    const belt = { id: 'test-belt', name: 'Test mountain building', kind: 'mountains' as const, old: 280, young: 270, provinces: [], boxes: [] };
    const gneiss = unit({ old: 1600, young: 1000, liths: [lith('gneiss', 'metamorphic', 'metamorphic')] });
    const seaNearby = unit({ origin: 'column', envs: ['marine indet.'] });
    const inRegion = matchChapter(chapter('permian'), [gneiss, seaNearby], [], map('land'), [], [belt]);
    expect(inRegion.environments.map((e) => e.type)).toEqual(['mountains', 'shelf-sea']);
    expect(inRegion.tier).toBe(3);
    // Fossil sites a few kilometers from deep rock in a rising range record the ground beside the range, so they follow the mountains.
    const beside = matchChapter(chapter('permian'), [gneiss], [site({})], map('land'), [], [belt]);
    expect(beside.environments.map((e) => e.type)).toEqual(['mountains', 'river-plain']);
    expect(beside.tier).toBe(3);
    // Without the range, the same sites are evidence of the spot.
    expect(matchChapter(chapter('permian'), [gneiss], [site({})], map('land')).environments[0]).toMatchObject({ type: 'river-plain', tier: 1 });
    // Rock layers confirmed at the spot itself stay first, range or no range.
    const sand = unit({ liths: [lith('sandstone', 'siliciclastic')] });
    const layers = unit({ origin: 'column', envs: ['fluvial indet.'], liths: [lith('sandstone', 'siliciclastic')] });
    expect(matchChapter(chapter('permian'), [gneiss, sand, layers], [], map('land'), [], [belt]).environments[0]).toMatchObject({ type: 'river-plain', tier: 1 });
    // Rock younger than the event was not there to be lifted.
    const young = unit({ old: 100, young: 90, liths: [lith('gneiss', 'metamorphic', 'metamorphic')] });
    expect(matchChapter(chapter('permian'), [young], [], map('land'), [], [belt]).mountains).toEqual([]);
  });

  it('in a belt still rising, high ground today gives mountains without deep rock, but only in the youngest chapters', () => {
    const rising = { id: 'test-rising', name: 'Test mountain building', kind: 'mountains' as const, old: 100, young: 0, provinces: [], boxes: [] };
    const at = (id: string, height: number | null, belt = rising) => matchChapter(chapter(id), [], [], map('land'), [], [belt], height);
    expect(at('quaternary', 2400).environments[0]).toMatchObject({ type: 'mountains', tier: 3 });
    expect(at('neogene', 2400).mountains).toMatchObject([{ unit: null, metres: 2400 }]);
    // Height today says nothing of the Paleogene or earlier.
    expect(at('paleogene', 2400).mountains).toEqual([]);
    // The lowland that the event's outline also takes in, and a spot whose height is not known.
    expect(at('quaternary', 520).mountains).toEqual([]);
    expect(at('quaternary', null).mountains).toEqual([]);
    // A belt whose building has ended must show its deep rock.
    expect(at('neogene', 2400, { ...rising, young: 10 }).mountains).toEqual([]);
  });

  it('after the building ends a range is shown wearing down, for its span and no longer, and does not lead', () => {
    const gneiss = unit({ old: 1600, young: 1000, liths: [lith('gneiss', 'metamorphic', 'metamorphic')] });
    // Ended 280 million years ago: by default it wears down for 30 million years, into the first of the Triassic.
    const belt = { id: 'test-belt', name: 'Test mountain building', kind: 'mountains' as const, old: 335, young: 280, provinces: [], boxes: [] };
    const at = (id: string, b: typeof belt & { wornBy?: number }, units = [gneiss]) => matchChapter(chapter(id), units, [], map('land'), [], [b]);
    expect(at('permian', belt).mountains).toMatchObject([{ state: 'building' }]);
    expect(at('triassic', belt).mountains).toMatchObject([{ state: 'wearing-down' }]);
    expect(at('triassic', belt).environments[0]).toMatchObject({ type: 'mountains', tier: 3 });
    expect(at('jurassic', belt).mountains).toEqual([]);
    // An entry can say that the range was buried at once, or that it stands to this day.
    expect(at('triassic', { ...belt, wornBy: 280 }).mountains).toEqual([]);
    expect(at('quaternary', { ...belt, wornBy: 0 }).mountains).toMatchObject([{ state: 'wearing-down' }]);
    // Where the ancient maps show sea, a worn range is not assumed to have stood above it.
    expect(matchChapter(chapter('triassic'), [gneiss], [], map('shallow-sea'), [], [belt]).mountains).toEqual([]);
    // Without deep rock at the spot nothing ties it to the old range.
    expect(at('triassic', belt, []).mountains).toEqual([]);
    // A worn range is weighed with the other evidence from the region: a sea recorded there for the whole chapter outweighs it.
    const sea = unit({ origin: 'column', old: 251.9, young: 201.4, envs: ['marine indet.', 'reef, buildup or bioherm'] });
    expect(at('triassic', belt, [gneiss, sea]).environments.map((e) => e.type)).toEqual(['reef', 'mountains', 'shelf-sea']);
  });

  it('lava is volcanic land only where the regional map shows land', () => {
    const lava = unit({ liths: [lith('basalt', 'volcanic', 'igneous')] });
    expect(matchChapter(chapter('permian'), [lava], [], map('land')).environments[0]!.type).toBe('volcanic-land');
    const atSea = matchChapter(chapter('permian'), [lava], [], map('deep-sea'));
    expect(atSea.environments[0]!.type).toBe('deep-sea');
    expect(atSea.notes.join(' ')).toMatch(/on land or under water/);
  });
});

describe('regional columns', () => {
  const column = unit({ origin: 'column', name: 'Kaibab Limestone', envs: ['open shallow subtidal'], liths: [lith('limestone', 'carbonate')] });

  it('a column unit counts as local only when the map shows matching rock at the point', () => {
    const sedimentaryHere = unit({ liths: [lith('sandstone', 'siliciclastic')] });
    expect(matchChapter(chapter('permian'), [column, sedimentaryHere], [], null).tier).toBe(1);
    expect(matchChapter(chapter('permian'), [column], [], null).tier).toBe(3);
    const graniteHere = unit({ liths: [lith('granite', 'plutonic', 'igneous')] });
    expect(matchChapter(chapter('permian'), [column, graniteHere], [], null).tier).toBe(3);
  });
});
