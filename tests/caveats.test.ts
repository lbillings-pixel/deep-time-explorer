import { describe, expect, it } from 'vitest';
import { CHAPTERS } from '../src/match/chapters';
import { GENERAL_CAVEATS, GROUPS } from '../src/scenes/whitelist';
import { STORIES } from '../src/stories/all';
import { FOSSIL_GROUP_CAVEATS } from '../src/stories/fossil-groups';
import { labelCaveats } from '../src/stories/local';

// Caveats are shown to visitors, so they must read as notes to a reader, not as
// a writer's notes to an editor.
const NOT_FOR_VISITORS: [RegExp, string][] = [
  [/\b(I|I'm|I've|my|me|we|our|us)\b/, 'first person'],
  [/\b(the table|the brief|the owner|vetting|vetted|whitelist|worth a check|check or cut)\b/i, 'talk about how the text was made'],
  [/(^|[.?!] )(Check|Confirm|Verify)\b/, 'an instruction to an editor'],
  [
    /(colour|grey|armour|centre|metre|favour|behaviour|mould|plough|sulphur|fibre|theatre|defence|travell|programme|catalogue|analyse)|(recognis|fossilis|organis|specialis|characteris|criticis|generalis|civilis|colonis|emphasis)(e|ed|es|ing|ation)\b/i,
    'British spelling',
  ],
  [/—|\bMa\b|\bmya\b|TODO|…/, 'a dash, shorthand or something unfinished'],
];

function problems(text: string): string[] {
  const found = NOT_FOR_VISITORS.filter(([pattern]) => pattern.test(text)).map(([, what]) => what);
  if (text.length < 25) found.push('too short to stand alone');
  if (!/[.?!"”)]$/.test(text)) found.push('does not end as a sentence');
  return found;
}

describe('caveats', () => {
  it('for the pictures: are written for visitors, and name real parts in their own group', () => {
    const bad: string[] = [];
    for (const text of Object.values(GENERAL_CAVEATS)) for (const p of problems(text)) bad.push(`general: ${p}: ${text.slice(0, 70)}`);
    for (const g of GROUPS) {
      const ids = new Set(g.permits.map((p) => p.id));
      for (const c of g.caveats) {
        for (const p of problems(c.text)) bad.push(`${g.id}: ${p}: ${c.text.slice(0, 70)}`);
        for (const id of c.parts) if (!ids.has(id)) bad.push(`${g.id}: unknown part "${id}": ${c.text.slice(0, 50)}`);
      }
    }
    expect(bad).toEqual([]);
  });

  it('for the stories: are written for visitors, and each concerns a passage that exists', () => {
    const bad: string[] = [];
    for (const c of CHAPTERS) {
      const story = STORIES[c.id]!;
      for (const cav of story.caveats) {
        for (const p of problems(cav.text)) bad.push(`${c.id}: ${p}: ${cav.text.slice(0, 70)}`);
        if (cav.about.length === 0) bad.push(`${c.id}: concerns no passage: ${cav.text.slice(0, 50)}`);
        for (const a of cav.about) if (a !== 'world' && !story.scenes[a]) bad.push(`${c.id}: no "${a}" passage: ${cav.text.slice(0, 50)}`);
      }
    }
    for (const text of FOSSIL_GROUP_CAVEATS) for (const p of problems(text)) bad.push(`fossil labels: ${p}: ${text.slice(0, 70)}`);
    expect(bad).toEqual([]);
  });

  it('for the fossil labels: a chapter shows the general caveat and those that name its labels or fossils, and none without a label', () => {
    expect(labelCaveats([{ name: 'Nosuchgenus', cls: 'Nosuchclass' }])).toEqual([]);
    const some = labelCaveats([{ name: 'Glossopteris', cls: '' }, { name: 'Orthoceras', cls: 'Cephalopoda' }]);
    expect(some[0]).toBe(FOSSIL_GROUP_CAVEATS[0]);
    expect(some.some((t) => t.includes('Glossopteris'))).toBe(true);
    expect(some.some((t) => t.includes('Orthoceras'))).toBe(true);
    expect(some.length).toBeLessThan(8);
  });
});
