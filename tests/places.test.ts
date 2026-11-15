import { describe, expect, it } from 'vitest';
import { type Exploration, explore } from '../src/explore';
import { MAJOR_EVENTS } from '../src/match/events';
import { TIER_LABEL } from '../src/match/match';
import { WORN_CAVEAT, WORN_SPAN_CAVEAT, mountainCaveats, wornDown } from '../src/match/mountain-caveats';
import { ENV_LABEL } from '../src/match/taxonomy';
import { PLACES, nodeRead, savedMapUnits } from './helpers';

const run = (name: string) => {
  const place = PLACES.find((p) => p.name === name)!;
  return explore(nodeRead, place, savedMapUnits(name), MAJOR_EVENTS);
};
const chapter = (x: Exploration, id: string) => x.timeline.find((c) => c.chapter.id === id)!;

/** One line per chapter: what the visitor is told. */
function summarise(x: Exploration): string {
  return x.timeline
    .map((c) => {
      const env = c.environments[0] ? ENV_LABEL[c.environments[0].type] : 'No record';
      const lats = c.paleo?.lats.map((l) => Math.round(l.lat)) ?? [];
      const lat = lats.length ? ` | lat ${Math.min(...lats)} to ${Math.max(...lats)}` : '';
      return `${c.chapter.name.padEnd(20)} tier ${c.tier} | ${env}${lat}`;
    })
    .join('\n');
}

describe('test places', () => {
  it.each(PLACES.map((p) => p.name))('%s: timeline is stable', async (name) => {
    const x = await run(name);
    expect(x.notices).toEqual([]);
    expect(x.timeline).toHaveLength(15);
    await expect(`${name}\n${summarise(x)}\n`).toMatchFileSnapshot(`snapshots/${name.replace(/[^a-z]+/gi, '-').toLowerCase()}.txt`);
  });

  it('Reykjavik: young crust, so the deep past is a gap with the reason given', async () => {
    const x = await run('Reykjavik, Iceland');
    // Fossil sites on the spot record a shoreline; the basalt underfoot adds volcanic land.
    expect(chapter(x, 'quaternary').environments.map((e) => e.type)).toEqual(expect.arrayContaining(['shoreline', 'volcanic-land']));
    expect(chapter(x, 'neogene').environments[0]?.type).toBe('volcanic-land');
    const jurassic = chapter(x, 'jurassic');
    expect(jurassic.tier).toBe(5);
    expect(jurassic.notes[0]).toMatch(/crust here did not exist yet/);
  });

  it('Canadian Shield: ancient granite tells an underground story', async () => {
    const x = await run('Canadian Shield, northern Ontario');
    const precambrian = chapter(x, 'precambrian');
    expect(precambrian.underground.length).toBeGreaterThan(0);
    expect(precambrian.paleo).toBeNull();
  });

  it('Karoo: Permian river plain, recorded by fossil sites on the spot', async () => {
    const permian = chapter(await run('Karoo, South Africa'), 'permian');
    expect(permian.tier).toBe(1);
    expect(permian.environments[0]?.type).toBe('river-plain');
  });

  it('Greenville: rock that formed underground, inside mountain belts, gives chapters of mountains', async () => {
    const x = await run('Greenville, South Carolina, USA');
    const mountains = x.timeline.filter((c) => c.environments[0]?.type === 'mountains');
    expect(mountains.map((c) => c.chapter.id)).toEqual(['triassic', 'permian', 'late-carboniferous', 'early-carboniferous', 'devonian', 'ordovician']);
    // "Recorded in the region", never more: the mountain building is a published event for the region, not a date measured here.
    expect(mountains.every((c) => c.tier === 3)).toBe(true);
    // In the Triassic the building had ended, and the range is shown wearing down, with the caveats that go with that.
    const triassic = chapter(x, 'triassic');
    expect(wornDown(triassic)).toBe(true);
    expect(mountainCaveats(triassic)).toEqual([WORN_CAVEAT, WORN_SPAN_CAVEAT]);
    expect(wornDown(chapter(x, 'permian'))).toBe(false);
    expect(mountainCaveats(chapter(x, 'permian'))).toEqual([]);
    expect(chapter(x, 'permian').mountains.map((m) => m.event.id)).toContain('alleghanian');
  });

  it('Deccan Traps: the vetted event dates basalt that the map dates too loosely', async () => {
    const x = await run('Deccan Traps, India');
    const lateCretaceous = chapter(x, 'late-cretaceous');
    expect(lateCretaceous.looselyDated.length).toBeGreaterThan(0);
    expect(lateCretaceous.tier).toBe(2);
    expect(lateCretaceous.environments[0]?.type).toBe('volcanic-land');
    expect(lateCretaceous.events.map((e) => e.name)).toEqual(['Deccan Traps']);
    // Nothing is claimed for chapters the event does not reach.
    expect(chapter(x, 'jurassic').events).toEqual([]);
  });

  it('Mid-Pacific: no land record at all', async () => {
    const x = await run('Mid-Pacific Ocean');
    expect(x.timeline.every((c) => c.tier === 5)).toBe(true);
  });

  it('falls back to the shipped coarse maps when the live map service is down', async () => {
    const karoo = PLACES.find((p) => p.name === 'Karoo, South Africa')!;
    const offline = async () => {
      throw new Error('offline');
    };
    const x = await explore(nodeRead, karoo, offline, MAJOR_EVENTS);
    expect(x.detailedMap).toBe(false);
    expect(x.notices).toHaveLength(1);
    expect(x.notices[0]).toMatch(/coarser world and continental maps/);
    // The world map still shows Permian sedimentary rock here, so the fossil-site evidence still counts as local.
    const permian = chapter(x, 'permian');
    expect(permian.rocksHere.map((u) => u.name)).toContain('Paleozoic sedimentary rocks');
    expect(permian.environments[0]?.type).toBe('river-plain');
  });

  it('every tier label is used somewhere across the test places', async () => {
    const tiers = new Set((await Promise.all(PLACES.map((p) => run(p.name)))).flatMap((x) => x.timeline.map((c) => TIER_LABEL[c.tier])));
    expect(tiers.size).toBe(5);
  });
});
