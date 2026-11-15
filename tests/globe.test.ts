import { describe, expect, it } from 'vitest';
import { loadPaleoDem } from '../src/geo/paleodem';
import { chapterAt } from '../src/globe/globe';
import { PALETTES, fromScreen, paintGlobe, toScreen } from '../src/globe/render';
import { nodeRead } from './helpers';

describe('the globe', () => {
  it('puts the centre of the view at the centre of the disc, and hides the far side', () => {
    const view = { lat: 30, lng: -100 };
    const centre = toScreen(view, view);
    expect(centre.x).toBeCloseTo(0);
    expect(centre.y).toBeCloseTo(0);
    expect(centre.front).toBe(true);
    expect(toScreen({ lat: -30, lng: 80 }, view).front).toBe(false);
    // North is up, east is right.
    expect(toScreen({ lat: 40, lng: -100 }, view).y).toBeGreaterThan(0);
    expect(toScreen({ lat: 30, lng: -90 }, view).x).toBeGreaterThan(0);
  });

  it('turns a screen position back into the same point', () => {
    const view = { lat: -42, lng: 170 };
    for (const p of [{ lat: -30, lng: 150 }, { lat: -80, lng: -170 }, { lat: 10, lng: 175 }]) {
      const s = toScreen(p, view);
      expect(s.front).toBe(true);
      const back = fromScreen(s.x, s.y, view)!;
      expect(back.lat).toBeCloseTo(p.lat, 6);
      expect(Math.cos(((back.lng - p.lng) * Math.PI) / 180)).toBeCloseTo(1, 9);
    }
    expect(fromScreen(0.9, 0.9, view)).toBeNull();
  });

  it('paints today\'s Earth with land where there is land and sea where there is sea', async () => {
    const dem = await loadPaleoDem(nodeRead);
    const n = 200;
    const px = { data: new Uint8ClampedArray(n * n * 4), width: n, height: n };
    const at = (view: { lat: number; lng: number }) => {
      paintGlobe(px, dem, dem.ages.indexOf(0), view);
      const o = ((n / 2) * n + n / 2) * 4;
      return { r: px.data[o]!, b: px.data[o + 2]!, corner: px.data[3]! };
    };
    const sahara = at({ lat: 23, lng: 10 });
    expect(sahara.r).toBeGreaterThan(sahara.b);
    expect(sahara.corner).toBe(0);
    const pacific = at({ lat: -20, lng: -140 });
    expect(pacific.b).toBeGreaterThan(pacific.r);
  });

  it('has three view modes, each with cool seas and warm land that is never green', async () => {
    expect(PALETTES.length).toBe(3);
    expect(new Set(PALETTES.map((p) => p.name)).size).toBe(3);
    const dem = await loadPaleoDem(nodeRead);
    const n = 100;
    const px = { data: new Uint8ClampedArray(n * n * 4), width: n, height: n };
    const middle = ((n / 2) * n + n / 2) * 4;
    for (const palette of PALETTES) {
      for (const [, r, g, b] of palette.stops.filter((s) => s[0] >= 0)) expect(g, palette.name).toBeLessThanOrEqual(Math.max(r, b));
      paintGlobe(px, dem, dem.ages.indexOf(0), { lat: 23, lng: 10 }, { palette });
      expect(px.data[middle]!, palette.name + ': Sahara').toBeGreaterThan(px.data[middle + 2]!);
      paintGlobe(px, dem, dem.ages.indexOf(0), { lat: -20, lng: -140 }, { palette });
      expect(px.data[middle + 2]!, palette.name + ': Pacific').toBeGreaterThan(px.data[middle]!);
    }
  });

  it('zooms about the centre of the view', async () => {
    const dem = await loadPaleoDem(nodeRead);
    const n = 100;
    const view = { lat: 23, lng: 10 };
    const far = { data: new Uint8ClampedArray(n * n * 4), width: n, height: n };
    const near = { data: new Uint8ClampedArray(n * n * 4), width: n, height: n };
    paintGlobe(far, dem, dem.ages.indexOf(0), view);
    paintGlobe(near, dem, dem.ages.indexOf(0), view, { zoom: 2 });
    // The corner lies outside the whole globe, but inside the globe seen at twice the size.
    expect(far.data[3]).toBe(0);
    expect(near.data[3]).toBe(255);
    // A point a tenth of the way out in the far view is a fifth of the way out in the near one: same place, same land.
    const at = (px: typeof far, i: number, j: number) => px.data[(j * n + i) * 4]! - px.data[(j * n + i) * 4 + 2]!;
    expect(Math.sign(at(near, 60, 50))).toBe(Math.sign(at(far, 55, 50)));
  });

  it('names the chapter for an age', () => {
    expect(chapterAt(0)).toBe('Quaternary');
    expect(chapterAt(250)).toBe('Triassic');
    expect(chapterAt(255)).toBe('Permian');
    expect(chapterAt(70)).toBe('Late Cretaceous');
    expect(chapterAt(540)).toBe('Precambrian');
  });
});
