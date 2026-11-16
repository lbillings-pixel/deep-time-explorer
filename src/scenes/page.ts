// The scene workbench: any scene type in any chapter, with every setting the
// app would feed it; the same setting through all 15 chapters; and a gallery
// of every part with its whitelist entry, for checking.

import './page.css';
import './motion.css';
import { CHAPTER_NAMES, type ChapterName } from '../match/chapters';
import { ENV_LABEL, type EnvType } from '../match/taxonomy';
import { ALL_GROUPS as GROUPS, ALL_PARTS as PARTS, ALL_PERMITS as PERMITS } from './all-parts';
import { type Climate, type Permit, type Region, kindOf } from './permit';
import { REGION_NAME } from './region';
import { partSvg } from './part-card';
import { type SceneParams, composeScene, fitLayers, renderScene } from './scene';
import { GENERAL_CAVEATS } from './whitelist';

const ENVS = Object.keys(ENV_LABEL) as EnvType[];
const CLIMATES: Climate[] = ['neutral', 'wet', 'dry', 'cold'];
const WATER_ENVS: EnvType[] = ['carbonate-sea', 'shelf-sea', 'reef', 'swamp', 'lake', 'river-plain', 'delta', 'shoreline'];

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, text = ''): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  if (text) node.textContent = text;
  return node;
}

const latText = (lat: number) => (Math.abs(lat) < 3 ? 'Equator' : `${Math.abs(lat)}° ${lat < 0 ? 'south' : 'north'}`);

function field(label: string, control: HTMLElement, extra?: HTMLElement): HTMLElement {
  const wrap = el('div', { class: 'field' });
  wrap.append(el('label', { for: control.id }, label));
  const row = el('div', { class: 'row' });
  row.append(control);
  if (extra) row.append(extra);
  wrap.append(row);
  return wrap;
}

function buildWorkbench(): HTMLElement {
  const query = new URLSearchParams(location.search);
  const state: SceneParams = {
    environment: ENVS.includes(query.get('scene') as EnvType) ? (query.get('scene') as EnvType) : 'swamp',
    chapter: CHAPTER_NAMES.includes(query.get('chapter') as ChapterName) ? (query.get('chapter') as ChapterName) : 'Late Carboniferous',
    paleolatitude: query.has('lat') ? Number(query.get('lat')) : -5,
    climate: 'neutral',
    region: (query.get('region') as SceneParams['region']) ?? undefined,
    seed: query.has('seed') ? Number(query.get('seed')) : 12,
    waterLevel: 0.5,
    localOrganisms: [],
  };
  const section = el('section', { class: 'demo', 'aria-labelledby': 'bench-h' });
  section.append(el('h2', { id: 'bench-h' }, 'Any scene, any time'));

  const stage = el('div', { class: 'stage' });
  const figure = el('figure', { class: 'main' });
  const frame = el('div', { class: 'frame' });
  const caption = el('figcaption', { 'aria-live': 'polite' });
  figure.append(frame, caption);
  const form = el('form', { class: 'controls', 'aria-label': 'Scene settings' });
  form.addEventListener('submit', (e) => e.preventDefault());

  const stripTitle = el('h3');
  const strip = el('div', { class: 'strip' });

  const draw = () => {
    // The main view is the layered, moving version, as on the timeline. The strip below uses still pictures.
    const scene = composeScene(state);
    frame.innerHTML = scene.html;
    // Measuring needs the picture to be on the page, which on the first call it is not yet.
    const stack = frame.firstElementChild!;
    requestAnimationFrame(() => fitLayers(stack));
    frame.firstElementChild!.classList.add('live');
    caption.textContent = scene.description;
    stripTitle.textContent = `${ENV_LABEL[state.environment]}, through every chapter`;
    strip.replaceChildren(
      ...CHAPTER_NAMES.map((chapter) => {
        const fig = el('figure');
        fig.append(renderScene({ ...state, chapter }), el('figcaption', {}, chapter));
        return fig;
      }),
    );
  };

  const scene = el('select', { id: 'b-scene' });
  for (const e of ENVS) scene.append(new Option(ENV_LABEL[e], e, false, e === state.environment));
  scene.addEventListener('change', () => {
    state.environment = scene.value as EnvType;
    draw();
  });
  form.append(field('Scene type', scene));

  const period = el('select', { id: 'b-period' });
  for (const c of CHAPTER_NAMES) period.append(new Option(c, c, false, c === state.chapter));
  period.addEventListener('change', () => {
    state.chapter = period.value as ChapterName;
    draw();
  });
  form.append(field('Chapter', period));

  const lat = el('input', { id: 'b-lat', type: 'range', min: '-85', max: '85', step: '5', value: '-5' });
  const latOut = el('output', { for: 'b-lat' }, latText(-5));
  const unknown = el('input', { type: 'checkbox', id: 'b-nolat' });
  const setLat = () => {
    state.paleolatitude = unknown.checked ? null : Number(lat.value);
    latOut.textContent = unknown.checked ? 'Not known' : latText(Number(lat.value));
    draw();
  };
  lat.addEventListener('input', setLat);
  unknown.addEventListener('change', setLat);
  form.append(field('Ancient latitude', lat, latOut));
  const unknownRow = el('div', { class: 'choice' });
  unknownRow.append(unknown, el('label', { for: 'b-nolat' }, 'Latitude not known (as in the Precambrian)'));
  form.append(unknownRow);

  const climates = el('fieldset', { class: 'choice' });
  climates.append(el('legend', {}, 'Climate from rock evidence'));
  for (const c of CLIMATES) {
    const input = el('input', { type: 'radio', name: 'b-climate', id: `b-${c}`, value: c });
    input.checked = c === state.climate;
    input.addEventListener('change', () => {
      state.climate = c;
      draw();
    });
    climates.append(input, el('label', { for: `b-${c}` }, c === 'neutral' ? 'None found' : c[0]!.toUpperCase() + c.slice(1)));
  }
  form.append(climates);

  const region = el('select', { id: 'b-region' });
  region.append(new Option('Not set', ''));
  for (const [id, name] of Object.entries(REGION_NAME)) region.append(new Option(name, id));
  region.addEventListener('change', () => {
    state.region = (region.value || undefined) as Region | undefined;
    draw();
  });
  form.append(field('Present-day landmass', region));

  const water = el('input', { id: 'b-water', type: 'range', min: '0', max: '1', step: '0.1', value: '0.5' });
  water.addEventListener('input', () => {
    state.waterLevel = Number(water.value);
    draw();
  });
  form.append(field(`Water level or depth (${WATER_ENVS.length} scene types use it)`, water));

  const seed = el('input', { id: 'b-seed', type: 'number', min: '1', max: '9999', value: String(state.seed) });
  seed.addEventListener('input', () => {
    state.seed = Number(seed.value) || 1;
    draw();
  });
  const another = el('button', { type: 'button' }, 'Another place');
  another.addEventListener('click', () => {
    state.seed = 1 + Math.floor(Math.random() * 9999);
    seed.value = String(state.seed);
    draw();
  });
  form.append(field('Place number', seed, another));

  const fossils = el('input', { id: 'b-fossils', type: 'text', placeholder: 'Arthropleura, Sigillaria' });
  fossils.addEventListener('change', () => {
    state.localOrganisms = fossils.value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    draw();
  });
  form.append(field('Fossils recorded nearby (genus names, comma-separated)', fossils));
  form.append(el('p', { class: 'hint' }, 'A part that matches is always shown, if its scene and chapter limits allow.'));

  stage.append(figure, form);
  section.append(stage, stripTitle, strip);
  draw();
  return section;
}

function chapterRange(chapters: ChapterName[]): string {
  const young = chapters[0];
  const old = chapters[chapters.length - 1];
  return young === old ? `${old} only` : `${old} to ${young}`;
}

function limits(permit: Permit): string {
  const out: string[] = [];
  if (permit.climates) out.push(`Climate: ${permit.climates.join(', ')} only.`);
  if (permit.latitudes) out.push(`Only between ${latText(permit.latitudes[0])} and ${latText(permit.latitudes[1])}.`);
  if (permit.regions) out.push(`Only on: ${permit.regions.map((r) => REGION_NAME[r]).join(', ')}.`);
  for (const [chapter, regions] of Object.entries(permit.regionsByChapter ?? {})) out.push(`In the ${chapter}: ${regions.map((r) => REGION_NAME[r]).join(', ')}.`);
  if (permit.localOnly) out.push('Shown only where its fossils are recorded nearby.');
  if (permit.assemblage) out.push('Never drawn together with the Ediacaran organisms of a different age and setting.');
  if (permit.localOnlyIn) out.push(`In the ${permit.localOnlyIn.join(' and the ')}, shown only where its fossils are recorded nearby.`);
  return out.join(' ');
}

function buildGallery(): HTMLElement {
  const section = el('section', { class: 'gallery', 'aria-labelledby': 'gallery-h' });
  section.append(
    el('h2', { id: 'gallery-h' }, 'Parts gallery'),
    el('p', { class: 'blurb' }, `Every plant, animal and trace drawn so far: ${PERMITS.length} parts. Each card gives the chapters and scene types the part is allowed in. Open the caveats under each heading for what is guessed or disputed.`),
  );
  const caveatList = (title: string, caveats: string[]) => {
    const details = el('details', { class: 'caveats' });
    details.append(el('summary', {}, `${title} (${caveats.length})`));
    const list = el('ol');
    for (const d of caveats) list.append(el('li', {}, d));
    details.append(list);
    return details;
  };
  section.append(caveatList('Caveats that apply to every picture', Object.values(GENERAL_CAVEATS)));

  for (const group of GROUPS) {
    section.append(el('h3', {}, `${group.title} (${group.permits.length})`));
    if (group.caveats.length) section.append(caveatList('Caveats', group.caveats.map((c) => c.text)));
    const grid = el('div', { class: 'cards' });
    for (const permit of group.permits) {
      if (!PARTS[permit.id]) continue;
      const card = el('article', { class: 'card' });
      const water = ['swimmer', 'drifter', 'stalked', 'mound', 'floor'].includes(PARTS[permit.id]!.role);
      const pic = el('div', { class: `pic${water ? ' sea' : ''}` });
      pic.innerHTML = partSvg(permit.id);
      card.append(
        pic,
        el('h4', {}, permit.name),
        el('p', { class: 'when' }, `${chapterRange(permit.chapters)} · ${kindOf(permit.group)}`),
        el('p', {}, `${permit.basis} ${limits(permit)}`),
        el('p', { class: 'when' }, permit.paintingsOnly ? 'Painted pictures only' : permit.scenes.map((s) => ENV_LABEL[s]).join(', ')),
      );
      grid.append(card);
    }
    section.append(grid);
  }
  return section;
}

const app = document.getElementById('app')!;
app.append(buildWorkbench(), buildGallery());
