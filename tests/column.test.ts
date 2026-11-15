import { describe, expect, it } from 'vitest';
import { type Layer, bandsOf, markHere, rockKind, thicknessWords } from '../src/column';
import type { ColumnLayer } from '../src/data/columns';
import { explore } from '../src/explore';
import { MAJOR_EVENTS } from '../src/match/events';
import type { RockUnit } from '../src/match/match';
import { PLACES, nodeRead, savedMapUnits } from './helpers';

const lith = (name: string, type: string, cls: string, prop = 1) => ({ name, type, class: cls, prop });
const layer = (over: Partial<ColumnLayer>): ColumnLayer => ({ name: 'Test layer', old: 290, young: 270, liths: [lith('sandstone', 'siliciclastic', 'sedimentary')], envs: [], thick: [0, 0], ...over });
const run = (name: string) => explore(nodeRead, PLACES.find((p) => p.name === name)!, savedMapUnits(name), MAJOR_EVENTS);

describe('the rock layers', () => {
  it('places a layer in its chapter by time, youngest at the top', () => {
    const bands = bandsOf([{ ...layer({ old: 290, young: 270 }), here: false }]);
    const permian = bands.find((b) => b.chapter.id === 'permian')!;
    expect(permian.layers).toHaveLength(1);
    // The Permian runs from 298.9 to 251.902 million years ago.
    expect(permian.layers[0]!.top).toBeCloseTo((270 - 251.902) / (298.9 - 251.902), 5);
    expect(permian.layers[0]!.height).toBeCloseTo(20 / (298.9 - 251.902), 5);
    expect(bands.filter((b) => b.layers.length > 0).map((b) => b.chapter.id)).toEqual(['permian']);
  });

  it('cuts a layer that spans chapters into each, and never draws outside a band', () => {
    const bands = bandsOf([{ ...layer({ old: 330, young: 240 }), here: false }]);
    expect(bands.filter((b) => b.layers.length > 0).map((b) => b.chapter.id)).toEqual(['triassic', 'permian', 'late-carboniferous', 'early-carboniferous']);
    for (const b of bands) for (const l of b.layers) expect(l.top >= 0 && l.top + l.height <= 1.000001).toBe(true);
    expect(bands.find((b) => b.chapter.id === 'permian')!.layers[0]).toMatchObject({ top: 0, height: 1 });
  });

  it('draws the Precambrian only back to the oldest layer', () => {
    const band = bandsOf([{ ...layer({ old: 1700, young: 1100 }), here: false }]).at(-1)!;
    expect(band.old).toBe(1700);
    expect(band.layers[0]!.top + band.layers[0]!.height).toBeCloseTo(1, 5);
  });

  it('marks a layer as at the spot only for the same class of rock and an overlapping age', () => {
    const unit = (over: Partial<RockUnit>): RockUnit => ({ origin: 'here', name: 'Map unit', old: 295, young: 265, liths: [{ name: 'limestone', type: 'carbonate', class: 'sedimentary' }], envs: [], source: 'test', ...over });
    const marked = (units: RockUnit[]) => markHere([layer({})], units)[0]!.here;
    expect(marked([unit({})])).toBe(true);
    expect(marked([unit({ old: 200, young: 150 })])).toBe(false);
    expect(marked([unit({ liths: [{ name: 'granite', type: 'plutonic', class: 'igneous' }] })])).toBe(false);
    expect(marked([unit({ origin: 'column' })])).toBe(false);
  });

  it('colors a layer by its main rock and words its thickness', () => {
    expect(rockKind(layer({ liths: [lith('shale', 'siliciclastic', 'sedimentary', 0.7), lith('limestone', 'carbonate', 'sedimentary', 0.3)] }))).toBe('mud');
    expect(rockKind(layer({ liths: [lith('gneiss', 'metamorphic', 'metamorphic')] }))).toBe('metamorphic');
    expect(rockKind(layer({ liths: [lith('basalt', 'volcanic', 'igneous')] }))).toBe('volcanic');
    expect(rockKind(layer({ liths: [] }))).toBe('other');
    expect(thicknessWords(layer({ thick: [0, 0] }))).toBeNull();
    expect(thicknessWords(layer({ thick: [0, 120] }))).toBe('about 120 m thick');
    expect(thicknessWords(layer({ thick: [50, 1200] }))).toBe('50 m to 1,200 m thick');
  });

  it('has a column at the Grand Canyon, with layers in most chapters of the Paleozoic, and none in London', async () => {
    const canyon = await run('Grand Canyon, USA');
    expect(canyon.layers.length).toBeGreaterThan(20);
    const filled = bandsOf(canyon.layers as Layer[]).filter((b) => b.layers.length > 0).map((b) => b.chapter.id);
    expect(filled).toEqual(expect.arrayContaining(['permian', 'cambrian', 'precambrian']));
    expect(canyon.layers.some((l) => l.here)).toBe(true);
    const london = await run('London, UK');
    expect(london.column).toBeNull();
    expect(london.layers).toEqual([]);
  });
});
