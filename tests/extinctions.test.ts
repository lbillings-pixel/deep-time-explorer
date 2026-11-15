import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { explore } from '../src/explore';
import { CHAPTERS } from '../src/match/chapters';
import { MAJOR_EVENTS } from '../src/match/events';
import { EVENTS, EXTINCTIONS, PICTURE_CAVEAT } from '../src/match/extinctions';
import { TURNING_POINTS } from '../src/match/turning-points';
import { PLACES, nodeRead, savedMapUnits } from './helpers';

describe('the extinctions and turning points', () => {
  it('each belongs to a chapter, at an age on that chapter\'s younger boundary or inside it', () => {
    expect(EXTINCTIONS.filter((e) => e.rank === 1).map((e) => e.id).sort()).toEqual(['end-cretaceous', 'end-ordovician', 'end-permian', 'end-triassic', 'late-devonian']);
    expect(new Set(EVENTS.map((e) => e.id)).size).toBe(EVENTS.length);
    expect(EXTINCTIONS.every((e) => e.kind === undefined)).toBe(true);
    // A turning point is shown as a small card, like a lesser extinction.
    expect(TURNING_POINTS.every((e) => e.kind === 'turning-point' && e.rank === 2)).toBe(true);
    for (const e of EVENTS) {
      const chapter = CHAPTERS.find((c) => c.id === e.chapter);
      expect(chapter, e.id).toBeDefined();
      expect(e.age, e.id).toBeGreaterThanOrEqual(chapter!.young);
      expect(e.age, e.id).toBeLessThanOrEqual(chapter!.old);
    }
  });

  it('each has its painting in the three sizes the page asks for, and a description of it', () => {
    for (const e of EVENTS) {
      for (const size of ['', '-800', '-320']) expect(existsSync(`public/extinctions/${e.id}${size}.webp`), `${e.id}${size}.webp`).toBe(true);
      expect(e.picture, e.id).toMatch(/^A painting/);
    }
  });

  it('has text and caveats written for visitors', () => {
    for (const e of EVENTS) {
      for (const text of [e.plain, e.more]) {
        expect(text.length, e.id).toBeGreaterThan(600);
        expect(text, e.id).not.toMatch(/—|\bmya\b|\d\s?Ma\b|TODO|…/);
      }
      expect(e.caveats.length, e.id).toBeGreaterThanOrEqual(3);
      // A lesser extinction or a turning point is less familiar, so it names the published work it rests on.
      if (e.rank === 2) expect(e.sources?.length ?? 0, e.id).toBeGreaterThanOrEqual(3);
      for (const c of [...e.caveats, ...(e.pictureCaveats ?? []), PICTURE_CAVEAT]) expect(c, e.id).not.toMatch(/\b(I|my|we|our)\b|—|\bcolour|\bgrey\b/);
    }
  });

  it('places a spot at the time of each event, and measures the distance from the end-Cretaceous impact', async () => {
    const at = async (name: string) => (await explore(nodeRead, PLACES.find((p) => p.name === name)!, savedMapUnits(name), MAJOR_EVENTS)).extinctions;
    const canyon = await at('Grand Canyon, USA');
    // The plate model reaches back 540 million years; older events have no position.
    expect(canyon.map((t) => t.id).sort()).toEqual(EVENTS.filter((e) => e.age <= 540).map((e) => e.id).sort());
    for (const t of canyon) expect(Math.abs(t.lat), t.id).toBeLessThanOrEqual(90);
    // The Grand Canyon and the Yucatán are about 2,800 km apart today, and both ride on the North American plate.
    const km = canyon.find((t) => t.id === 'end-cretaceous')!.kmFromImpact!;
    expect(km).toBeGreaterThan(2000);
    expect(km).toBeLessThan(3600);
  });
});
