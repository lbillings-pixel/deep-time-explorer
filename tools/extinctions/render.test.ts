// Paints the pictures of the extinctions as SVG files, for rasterise.mjs to turn into images.
// Runs only when asked for (EXTINCTIONS=1), never as part of `npm test`:
//   EXTINCTIONS=1 npx vitest run tools/extinctions/render.test.ts && node tools/extinctions/rasterise.mjs
// One picture only:  ONLY=end-cretaceous EXTINCTIONS=1 npx vitest run tools/extinctions/render.test.ts
// (or, in any shell:  node tools/extinctions/rasterise.mjs --paint end-cretaceous)
// It runs under vitest because Node cannot run this project's TypeScript directly.
// Output: review-sheet/extinctions/<id>.svg, and <id>.cast.txt listing the plants and animals in it (git-ignored).
import fs from 'node:fs';
import { expect, it } from 'vitest';
import { H, W, figure, figuresUsed } from './paint';

// This one always runs, with `npm test`: the rule that keeps anachronisms out of the pictures.
it('figure() refuses a plant or animal outside its chapters', () => {
  expect(() => figure('tyrannosaur', 'Permian', { x: 0, y: 0, scale: 1 })).toThrow(/not permitted in the Permian/);
  expect(() => figure('no-such-part', 'Permian', { x: 0, y: 0, scale: 1 })).toThrow(/no whitelist entry/);
  expect(figure('tyrannosaur', 'Late Cretaceous', { x: 0, y: 0, scale: 1 })).toContain('<path');
});

/** Every file scenes/<id>.ts is one picture and exports paint(): string. The id is the one in src/match/extinctions.ts. */
const IDS = fs.readdirSync('tools/extinctions/scenes').filter((f) => f.endsWith('.ts')).map((f) => f.slice(0, -3));

it.skipIf(!process.env.EXTINCTIONS)(
  'paint the extinction pictures',
  async () => {
    const only = process.env.ONLY?.split(',').map((s) => s.trim());
    const dir = 'review-sheet/extinctions';
    fs.mkdirSync(dir, { recursive: true });
    for (const id of IDS) {
      if (only && !only.includes(id)) continue;
      const scene = (await import(`./scenes/${id}.ts`)) as { paint: () => string };
      const svg = scene.paint();
      expect(svg, `${id}: must be a ${W} by ${H} SVG`).toContain(`viewBox="0 0 ${W} ${H}"`);
      expect(svg, `${id}: no text in a picture`).not.toMatch(/<text[\s>]/);
      fs.writeFileSync(`${dir}/${id}.svg`, svg);
      // Each part once, however many times it was drawn (a figure is drawn again for its reflection or shadow).
      const cast = [...new Set(figuresUsed().map((c) => `${c.id} (${c.name}; permitted in the ${c.chapter})`))];
      fs.writeFileSync(`${dir}/${id}.cast.txt`, cast.join('\n') + '\n');
      console.log(`${id}: ${Math.round(svg.length / 1024)} KB of SVG; ${cast.join(', ') || 'no living things'}`);
    }
  },
  120000,
);
