import { describe, expect, it } from 'vitest';
import { explore } from '../src/explore';
import { CHAPTERS } from '../src/match/chapters';
import { climateEvidence, rockClimate } from '../src/match/climate';
import { MAJOR_EVENTS } from '../src/match/events';
import { type RockUnit, matchChapter } from '../src/match/match';
import { ENV_LABEL, type EnvType } from '../src/match/taxonomy';
import { sceneParams } from '../src/scenes/inputs';
import { composeScene } from '../src/scenes/scene';
import { STORIES, passageFor } from '../src/stories/all';
import { FOSSIL_GROUPS } from '../src/stories/fossil-groups';
import { localSentences } from '../src/stories/local';
import { PLACES, nodeRead, savedMapUnits } from './helpers';

const run = (name: string) => explore(nodeRead, PLACES.find((p) => p.name === name)!, savedMapUnits(name), MAJOR_EVENTS);
const chapter = (id: string) => CHAPTERS.find((c) => c.id === id)!;
const unit = (over: Partial<RockUnit>): RockUnit => ({ origin: 'here', name: 'Test unit', old: 290, young: 260, liths: [], envs: [], source: 'test', ...over });
const lith = (name: string, type: string) => ({ name, type, class: 'sedimentary' });

/** The environment types that must have a passage in each chapter: every pairing the matching rules can plausibly produce. */
const ALWAYS: EnvType[] = ['deep-sea', 'shelf-sea', 'carbonate-sea', 'reef', 'shoreline', 'delta'];
const after = (id: string) => CHAPTERS.slice(0, CHAPTERS.findIndex((c) => c.id === id) + 1).map((c) => c.id);
const EXPECTED: Record<string, EnvType[]> = Object.fromEntries(CHAPTERS.map((c) => [c.id, [...ALWAYS]]));
for (const id of after('cambrian')) EXPECTED[id]!.push('land', 'volcanic-land');
for (const id of after('devonian')) EXPECTED[id]!.push('river-plain', 'lake', 'swamp');
for (const id of after('permian')) EXPECTED[id]!.push('desert');
for (const id of ['quaternary', 'neogene', 'paleogene', 'permian', 'late-carboniferous', 'ordovician', 'precambrian']) EXPECTED[id]!.push('ice');
// Mountains are matched from the mountain-building events and the mapped rock, which can fall in any chapter.
for (const c of CHAPTERS) EXPECTED[c.id]!.push('mountains');

describe('climate from the rocks', () => {
  const permian = chapter('permian');
  const climateOf = (units: RockUnit[]) => rockClimate(climateEvidence(matchChapter(permian, units, [], null)));

  it('reads coal as wet, salt as dry and till as cold', () => {
    expect(climateOf([unit({ liths: [lith('sandstone', 'siliciclastic'), lith('coal', 'organic')] })])).toBe('wet');
    expect(climateOf([unit({ liths: [lith('gypsum', 'evaporite')] })])).toBe('dry');
    expect(climateOf([unit({ name: 'Clayey Till', liths: [lith('clay', 'siliciclastic')] })])).toBe('cold');
  });

  it('makes no claim without evidence, or when the evidence points two ways', () => {
    expect(climateOf([unit({ liths: [lith('sandstone', 'siliciclastic')] })])).toBeNull();
    expect(climateOf([unit({ liths: [lith('till', 'siliciclastic'), lith('peat', 'organic')] })])).toBeNull();
  });
});

describe('story text', () => {
  it('covers every chapter, and every environment the matching rules can produce in it', () => {
    expect(Object.keys(STORIES).sort()).toEqual(CHAPTERS.map((c) => c.id).sort());
    for (const c of CHAPTERS) {
      const story = STORIES[c.id]!;
      expect(Object.keys(story.scenes).sort(), c.name).toEqual([...EXPECTED[c.id]!].sort());
      for (const passage of [story.world, ...Object.values(story.scenes)]) {
        expect(passage.plain.length, c.name).toBeGreaterThan(200);
        expect(passage.more.length, c.name).toBeGreaterThan(200);
        // No em dashes, no "Ma" shorthand, nothing left unfinished.
        expect(passage.plain + passage.more, c.name).not.toMatch(/—|\bmya\b|\d\s?Ma\b|TODO|…/);
      }
    }
  });

  it('keeps the review flags as they were last set', () => {
    const stories = Object.values(STORIES);
    expect(stories.filter((s) => !s.world.vetted).length).toBe(0);
    const unvetted = stories.flatMap((s) => Object.entries(s.scenes).filter(([, p]) => !p.vetted).map(([env]) => env));
    expect(unvetted).toEqual(CHAPTERS.map(() => 'mountains'));
    expect(FOSSIL_GROUPS.vetted).toBe(false);
  });
});

describe('scenes and stories at the test places', () => {
  it.each(PLACES.map((p) => p.name))('%s: every matched chapter gets a scene, local sentences and a passage', async (name) => {
    const x = await run(name);
    const lines: string[] = [name];
    for (const c of x.timeline) {
      const env = c.environments[0];
      const params = sceneParams(c, x.point);
      if (!env) {
        expect(params).toBeNull();
        continue;
      }
      const scene = composeScene(params!);
      expect(scene.svg).not.toMatch(/NaN|undefined/);
      expect(passageFor(c.chapter.id, env.type), `${c.chapter.name}: ${ENV_LABEL[env.type]}`).toBeDefined();
      const local = localSentences(c);
      expect(local.length).toBeGreaterThan(0);
      const water = params!.waterLevel === undefined ? '' : ` | water ${params!.waterLevel.toFixed(2)}`;
      // The cast is part of the snapshot, so a whitelist change that alters a test place's picture shows up as a failed test.
      const cast = [...scene.shown.entries()].map(([id, local]) => (local ? `${id}*` : id));
      lines.push(`${c.chapter.name} | ${ENV_LABEL[env.type]} | ${params!.climate} | ${params!.region}${water}`, `  ${local.join(' ')}`, `  Drawn (* = recorded nearby): ${cast.join(', ') || 'nothing'}`);
    }
    await expect(lines.join('\n') + '\n').toMatchFileSnapshot(`snapshots/${name.replace(/[^a-z]+/gi, '-').toLowerCase()}.story.txt`);
  });
});
