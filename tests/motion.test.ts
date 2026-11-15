import { describe, expect, it } from 'vitest';
import type { ChapterName } from '../src/match/chapters';
import type { EnvType } from '../src/match/taxonomy';
import { composeScene } from '../src/scenes/scene';

const pages = (environment: EnvType, chapters: ChapterName[]) =>
  chapters.flatMap((chapter) => Array.from({ length: 10 }, (_, i) => composeScene({ environment, chapter, paleolatitude: 20, climate: 'neutral', seed: 7 + i * 131 }).html));

/** The value of a style variable on every layer of one kind. */
function values(html: string, kind: string, name: string): number[] {
  const out: number[] = [];
  for (const m of html.matchAll(new RegExp(`class="sp k-${kind}"[^>]*style="([^"]*)"`, 'g'))) {
    const v = new RegExp(`${name}:(-?[\\d.]+)`).exec(m[1]!);
    if (v) out.push(Number(v[1]));
  }
  return out;
}

describe('motion in the layered scenes', () => {
  it('gives land animals a breath and a shift of weight that are large enough to see', () => {
    const all = pages('river-plain', ['Jurassic', 'Neogene']).join('');
    const breaths = values(all, 'idle', '--by');
    expect(breaths.length).toBeGreaterThan(10);
    // Between 2.4% and 8.5% taller at the top of each breath: more for small animals, less for giants.
    expect(Math.min(...breaths)).toBeGreaterThanOrEqual(1.02);
    expect(Math.max(...breaths)).toBeLessThanOrEqual(1.09);
    const leans = values(all, 'idle', '--a').map(Math.abs);
    expect(Math.min(...leans)).toBeGreaterThan(0.5);
    expect(Math.max(...leans)).toBeLessThan(9);
  });

  it('sets crawlers creeping to and fro, and no longer leaves any animal on the old, faint breathing', () => {
    const all = pages('shoreline', ['Jurassic', 'Quaternary']).join('') + pages('shelf-sea', ['Ordovician']).join('');
    expect(all).toMatch(/class="sp k-(crawl|scuttle)"/);
    expect(all).not.toContain('k-breathe');
    // A crawler stays within about its own length of where it was drawn: under a tenth of the picture each way.
    const reach = [...values(all, 'crawl', '--t'), ...values(all, 'scuttle', '--t')];
    expect(Math.min(...reach)).toBeGreaterThanOrEqual(12);
    // A crawler that turns round does so rarely: one round trip takes most of a minute or more.
    const rounds = values(all, 'crawl', '--t');
    expect(rounds.length).toBeGreaterThan(0);
    expect(Math.min(...rounds)).toBeGreaterThanOrEqual(45);
    expect(Math.max(...rounds)).toBeLessThanOrEqual(130);
  });

  it('lets thin-winged birds glide, with almost no wing beat', () => {
    const coast = pages('shoreline', ['Quaternary', 'Neogene']).join('') + pages('shelf-sea', ['Quaternary']).join('');
    const squash = [...coast.matchAll(/class="sp k-cross gait"[^>]*--gy:([\d.]+);--gt:([\d.]+)s/g)].map((m) => Number(m[1]));
    // Whatever flies over a coast, at least one glider is among them, and a glider's wings close by under 5%.
    expect(squash.some((v) => v >= 0.955 && v < 1)).toBe(true);
  });

  it('gives swimmers and flyers a gait as they travel', () => {
    const sea = pages('shelf-sea', ['Jurassic', 'Ordovician']).join('');
    const sky = pages('river-plain', ['Jurassic', 'Neogene']).join('');
    // Every travelling animal that is one layer has a gait; none is left sliding rigidly.
    expect(sea + sky).not.toMatch(/class="sp k-(cross|hover)"/);
    expect(sea).toMatch(/class="sp k-(cross|hover) gait"/);
    expect(sky).toMatch(/class="sp k-cross gait"/);
    // A wing beat is a strong, quick squash for small flyers and a shallow, slow one for the largest.
    const beats = [...sky.matchAll(/class="sp k-cross gait"[^>]*--gy:([\d.]+);--gt:([\d.]+)s/g)].map((m) => [Number(m[1]), Number(m[2])] as const);
    expect(beats.length).toBeGreaterThan(5);
    for (const [squash, seconds] of beats) expect(squash < 0.75 ? seconds < 0.5 : seconds > 1).toBe(true);
  });

  it('cuts a shoal or swarm into its individuals, each turning on its own', () => {
    const sea = pages('shelf-sea', ['Ordovician', 'Cambrian']).join('') + pages('deep-sea', ['Ordovician', 'Silurian']).join('');
    const groups = [...sea.matchAll(/<div class="grp k-(?:cross|hover)"[^>]*>(.*?)<\/div>/g)].map((m) => m[1]!);
    expect(groups.length).toBeGreaterThan(3);
    for (const g of groups) {
      const each = g.match(/class="sp gait"/g) ?? [];
      expect(each.length).toBeGreaterThanOrEqual(2);
      // No two individuals share a rhythm.
      const swings = [...g.matchAll(/--ht:([\d.]+)s;--hd:(-?[\d.]+)s/g)].map((m) => m[0]);
      expect(new Set(swings).size).toBe(swings.length);
    }
    // Agnostids and graptolites tumble by many degrees; fish in a shoal only by a few.
    const tips = [...sea.matchAll(/class="sp gait"[^>]*--ga:([\d.]+)deg/g)].map((m) => Number(m[1]));
    expect(Math.max(...tips)).toBeGreaterThan(12);
  });
});
