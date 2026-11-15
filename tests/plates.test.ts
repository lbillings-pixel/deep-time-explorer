import { describe, expect, it } from 'vitest';
import { crustAppears, loadPlateModel, reconstruct } from '../src/geo/plates';
import { loadPaleoDem, terrainAt } from '../src/geo/paleodem';
import { nodeRead } from './helpers';

const shield = { lat: 50, lng: -85 };

// Expected values are the GPlates Web Service's own answers for the same point
// (reconstruct_points, fetched 13 Nov 2026).
describe('reconstruct agrees with the GPlates Web Service', () => {
  it.each([
    ['PALEOMAP', 500, -21.9902, -76.098],
    ['PALEOMAP', 200, 29.6623, -30.0629],
    ['MERDITH2021', 500, -5.9465, -136.1985],
    ['MERDITH2021', 200, 24.0135, -19.1123],
    ['GOLONKA', 500, 20.0721, -103.6066],
  ])('%s at %i Ma', async (model, age, lat, lng) => {
    const at = reconstruct(await loadPlateModel(nodeRead, model), shield, age);
    expect(at!.lat).toBeCloseTo(lat, 2);
    expect(at!.lng).toBeCloseTo(lng, 2);
  });
});

describe('crust that the model cannot take back', () => {
  it('Iceland does not exist before its crust formed', async () => {
    const m = await loadPlateModel(nodeRead, 'PALEOMAP');
    const reykjavik = { lat: 64.13, lng: -21.9 };
    expect(crustAppears(m, reykjavik)).toBe(15);
    expect(reconstruct(m, reykjavik, 10)).not.toBeNull();
    expect(reconstruct(m, reykjavik, 100)).toBeNull();
  });

  it('PALEOMAP does not reconstruct ocean floor', async () => {
    const m = await loadPlateModel(nodeRead, 'PALEOMAP');
    expect(crustAppears(m, { lat: 0, lng: -140 })).toBeNull();
  });
});

describe('ancient terrain', () => {
  it('reads present-day land and sea from the 0 Ma map', async () => {
    const dem = await loadPaleoDem(nodeRead);
    expect(terrainAt(dem, 0, { lat: 28, lng: 87 }).terrain).toBe('land'); // Himalaya
    expect(terrainAt(dem, 0, { lat: 0, lng: -140 }).terrain).toBe('deep-sea'); // mid-Pacific
    expect(terrainAt(dem, 0, { lat: 53, lng: 3 }).terrain).toBe('shallow-sea'); // North Sea
  });
});
