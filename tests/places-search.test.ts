import { describe, expect, it } from 'vitest';
import { randomShipped, searchShipped } from '../src/places';
import { nodeRead } from './helpers';

describe('the shipped place list', () => {
  it('finds towns by the start of their name', async () => {
    const found = await searchShipped(nodeRead, 'salt lake');
    expect(found[0]?.label).toBe('Salt Lake City, Utah, United States');
  });

  it('picks a random town, with its full name, from anywhere in the list', async () => {
    const first = await randomShipped(nodeRead, () => 0);
    expect(first.label).toBe('Shanghai, Shanghai, China');
    const last = await randomShipped(nodeRead, () => 0.999999);
    expect(last.label).not.toBe(first.label);
    expect(Math.abs(last.lat)).toBeLessThanOrEqual(90);
    const labels = new Set<string>();
    for (let i = 0; i < 20; i++) labels.add((await randomShipped(nodeRead)).label);
    expect(labels.size).toBeGreaterThan(15);
  });
});
