// The page: a place goes in, a timeline of 15 chapters comes out.
//
// The timeline is a list of small picture tiles grouped by era. Each tile shows a
// picture, a name, a date and one line; everything else (the large picture, the
// story, the evidence, the caveats) appears when the tile is opened, and can be
// closed again.
import './scenes/motion.css';
import { browserRead } from './lib/data';
import { fetchMapUnits } from './data/rock';
import { type Band, ROCK_KINDS, bandsOf, rockKind, thicknessWords } from './column';
import { type Exploration, PLATE_MODELS, type PlaceThen, explore } from './explore';
import { type PaleoDem, type Terrain, loadPaleoDem, terrainAt } from './geo/paleodem';
import { type LatLng, reconstruct } from './geo/plates';
import { type Globe, createGlobe } from './globe/globe';
import { coordWords, createPicker } from './globe/picker';
import { PALETTES, paintGlobe } from './globe/render';
import { CLIMATE_WORD, climateEvidence } from './match/climate';
import { MAJOR_EVENTS } from './match/events';
import { loadEventText, loadTectonicText } from './match/event-text';
import { EVENTS, type EventText, type TimelineEvent, PICTURE_CAVEAT } from './match/extinctions';
import type { Chapter } from './match/chapters';
import { type ChapterResult, type RockUnit, TIER_LABEL, type Tier } from './match/match';
import { ENV_LABEL, readLiths } from './match/taxonomy';
import { KIND_LABEL, REGION_CAVEAT, type TectonicEvent, type TectonicText, chapterOf } from './match/tectonics';
import { type Place, parseCoordinates, searchOnline, searchShipped } from './places';
import { sceneParams } from './scenes/inputs';
import { showFullScreen } from './fullscreen';
import { onSetting, openSettings, setSetting, settings } from './settings';
import { loadStory } from './stories';
import type { ChapterStory } from './stories/types';
import { labelCaveats, latitudeWords, localSentences, shownGenera, withGroup } from './stories/local';

type Child = Node | string | null | false | undefined;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  el.append(...children.filter((c): c is Node | string => c !== null && c !== false && c !== undefined));
  return el;
}

const form = document.querySelector<HTMLFormElement>('#search')!;
const input = document.querySelector<HTMLInputElement>('#query')!;
const statusBox = document.querySelector<HTMLElement>('#status')!;
const choices = document.querySelector<HTMLElement>('#choices')!;
const result = document.querySelector<HTMLElement>('#result')!;

// The scene code is large, so it loads in the background, and each scene is drawn only as it nears the screen.
const sceneCode = import('./scenes/scene');
const drawWhenSeen = new WeakMap<Element, () => void>();
const seen = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      seen.unobserve(entry.target);
      drawWhenSeen.get(entry.target)?.();
    }
  },
  { rootMargin: '600px' },
);

// Motion runs only in scenes that are on screen, and only if the visitor has not paused it.
const onScreen = new IntersectionObserver((entries) => {
  for (const entry of entries) entry.target.classList.toggle('live', entry.isIntersecting);
});
function applySettings(): void {
  document.documentElement.classList.toggle('still', !settings.motion);
  document.documentElement.classList.toggle('full-on-click', settings.fullscreen);
  for (const b of document.querySelectorAll('button.motion')) b.textContent = settings.motion ? 'Pause motion' : 'Play motion';
}
applySettings();
document.querySelector('#settings-button')!.addEventListener('click', openSettings);

// The globe's colors: the set chosen in the settings, or else one picked at random each time the page is opened.
// Adding &globe=1, 2 or 3 to the address picks that visit's set by hand.
const params = new URLSearchParams(location.search);
const RANDOM_VIEW = PALETTES[Number(params.get('globe')) - 1] ?? PALETTES[Math.floor(Math.random() * PALETTES.length)]!;
const globeView = () => PALETTES[Number(settings.globe) - 1] ?? RANDOM_VIEW;

// ---------- wording ----------

const round = (n: number) => (n >= 10 ? Math.round(n).toLocaleString('en') : String(Math.round(n * 10) / 10));

function ageRange(old: number, young: number): string {
  if (young === 0) return old === 0 ? 'today' : `${round(old)} million years ago to today`;
  return old === young ? `${round(old)} million years ago` : `${round(old)} to ${round(young)} million years ago`;
}

const latitude = (lat: number) => (Math.round(Math.abs(lat)) === 0 ? 'the equator' : `${Math.round(Math.abs(lat))}° ${lat >= 0 ? 'north' : 'south'}`);

const rockTypes = (u: RockUnit) => [...new Set(u.liths.map((l) => l.name))].slice(0, 5).join(', ');

function describeUnit(u: RockUnit): string {
  const types = rockTypes(u);
  return `${u.name}${types && !u.name.toLowerCase().includes(types) ? ` (${types})` : ''}, ${ageRange(u.old, u.young)}`;
}

// ---------- rendering ----------

/** A list of caveats behind a click, with a count. Empty until filled. */
function caveatList(title: string, items: string[]): HTMLDetailsElement {
  const details = h('details', { class: 'caveats' });
  fillCaveats(details, title, items);
  return details;
}

function fillCaveats(details: HTMLElement, title: string, items: string[]): void {
  details.hidden = items.length === 0;
  details.replaceChildren(h('summary', {}, `${title} (${items.length})`), h('ul', {}, ...items.map((text) => h('li', {}, text))));
}

/** The short form of a tier, for a closed tile. The full wording is inside. */
const TIER_SHORT: Record<Tier, string> = { 1: 'Recorded here', 2: 'Inferred from the rock here', 3: 'Recorded in the region', 4: 'Regional picture', 5: 'No record' };

/**
 * A tile: a row with a picture and a few words, which opens in place to a full panel and closes again.
 * `onToggle` is told each time it opens or closes.
 */
function tile(kind: string, picture: HTMLElement, words: HTMLElement, body: HTMLElement, onToggle?: (open: boolean) => void): HTMLElement {
  const summary = h('summary', {}, picture, words);
  const details = h('details', {}, summary, body);
  const close = h('button', { type: 'button', class: 'link close' }, 'Close');
  close.addEventListener('click', () => {
    details.open = false;
    summary.focus();
    summary.scrollIntoView({ block: 'nearest' });
  });
  body.append(close);
  details.addEventListener('toggle', () => onToggle?.(details.open));
  return h('li', { class: `tile ${kind}` }, details);
}

/**
 * The story: what the data says about this place is shown; the general passage for this time and setting waits behind a click.
 * The passages are added by `addPassages` once the chapter's text has been fetched.
 */
function story(c: ChapterResult): HTMLElement | null {
  if (!c.environments[0]) return null;
  return h('div', { class: 'story' }, h('p', { class: 'local' }, localSentences(c).join(' ')));
}

function addPassages(box: HTMLElement, c: ChapterResult, chapterStory: ChapterStory): void {
  const passage = chapterStory.scenes[c.environments[0]!.type];
  const world = chapterStory.world;
  box.append(
    ...(passage ? [h('details', {}, h('summary', {}, 'The story of this time'), h('p', {}, passage.plain), h('details', {}, h('summary', {}, 'More detail'), h('p', {}, passage.more)))] : []),
    h('details', {}, h('summary', {}, `The wider world in the ${c.chapter.name}`), h('p', {}, world.plain), h('p', {}, world.more)),
  );
}

function factList(c: ChapterResult): HTMLElement {
  const facts: Child[] = [];
  const fact = (label: string, ...body: Child[]) => facts.push(h('li', {}, h('strong', {}, `${label}: `), ...body));
  const units = (list: RockUnit[]) => h('ul', {}, ...list.map((u) => h('li', {}, describeUnit(u))));

  if (c.paleo?.status === 'ok' && c.paleo.lats.length > 0) {
    const primary = c.paleo.lats[0]!;
    const all = c.paleo.lats.map((l) => l.lat);
    const [min, max] = [Math.min(...all), Math.max(...all)];
    let text = `about ${latitude(primary.lat)}`;
    if (c.paleo.lats.length > 1) {
      text += max - min < 5 ? `. ${c.paleo.lats.length} plate models agree to within 5°.` : `. ${c.paleo.lats.length} plate models place it between ${latitude(min)} and ${latitude(max)}.`;
    }
    if (c.chapter.young >= 200) text += ' Positions this old are uncertain.';
    fact('Ancient latitude', text);
  }
  if (c.rocksHere.length > 0) fact('Rock of this age here', units(c.rocksHere));
  const climate = climateEvidence(c);
  if (climate.length > 0) fact('Climate, from the rock here', climate.map((e) => `${e.rock} in the ${e.unit} points to ${CLIMATE_WORD[e.climate]}`).join('; ') + '.');
  for (const u of c.underground) {
    fact('Formed underground', `${u.unit.name} (${u.because}) formed below the surface, so it does not record what the surface looked like.`);
  }
  for (const e of c.events) fact('Major event', `${e.name}, ${ageRange(e.old, e.young)}. ${e.summary}`);
  for (const m of c.mountains) {
    fact(
      'Mountain building in the region',
      `${m.event.name}, ${ageRange(m.event.old, m.event.young)}. ` +
        (m.unit
          ? `${m.unit.name}, mapped at this spot, formed underground and is old enough to have been here while those mountains were built. Whether it was squeezed and heated then, or only lifted, no date measured at this spot shows.`
          : `The mountain building is still going on, and ground rises to about ${m.metres!.toLocaleString('en')} meters within 10 km of this spot today. That places the spot in the range. How long the range has stood here, no evidence at this spot shows.`),
    );
  }
  if (c.rocksRegion.length > 0) fact('Rock of this age in the region', units(c.rocksRegion.slice(0, 8)), c.rocksRegion.length > 8 ? `and ${c.rocksRegion.length - 8} more` : null);
  if (c.looselyDated.length > 0) {
    fact(
      'Loosely dated rock',
      'formed some time in a span too long to tie to one chapter, so it does not decide the environment here.',
      h(
        'ul',
        {},
        ...c.looselyDated.map((u) => {
          const underground = readLiths(u.liths).some((r) => r.kind === 'underground');
          return h('li', {}, describeUnit(u), underground ? '. Formed underground.' : null);
        }),
      ),
    );
  }
  const sites = [...c.sitesNear, ...c.sitesRegion];
  if (sites.length > 0) {
    const where = c.sitesNear.length > 0 ? `${c.sitesNear.length} within 25 km, ${c.sitesRegion.length} more within 100 km` : `${c.sitesRegion.length} between 25 and 100 km away`;
    const genera = shownGenera(c).map(withGroup);
    const formations = [...new Set(sites.map((s) => s.formation).filter(Boolean))].slice(0, 4);
    fact(
      'Fossil sites of this age',
      `${where}. Nearest: ${Math.round(sites[0]!.km)} km.`,
      formations.length > 0 ? ` Rock formations: ${formations.join(', ')}.` : null,
      genera.length > 0 ? ` Most often recorded: ${genera.join(', ')}.` : null,
    );
  }
  const evidence = c.environments.flatMap((e) => e.evidence.map((line) => `${ENV_LABEL[e.type]}: ${line}`));
  if (evidence.length > 0) fact('Evidence for the environment', h('ul', {}, ...evidence.slice(0, 8).map((line) => h('li', {}, line))));
  return h('ul', { class: 'facts' }, ...facts);
}

/** When the record shows more than one environment in a chapter, list them all, oldest first. */
function sequence(c: ChapterResult): HTMLElement | null {
  if (c.environments.length < 2) return null;
  const inOrder = [...c.environments].sort((a, b) => b.old - a.old || b.young - a.young);
  return h(
    'div',
    { class: 'also' },
    h('p', {}, 'On record within this chapter, oldest first:'),
    h('ol', {}, ...inOrder.map((e) => h('li', {}, `${ENV_LABEL[e.type]}, ${ageRange(e.old, e.young)}`, e.tier === c.tier ? null : ` (${TIER_LABEL[e.tier].toLowerCase()})`))),
  );
}

/** A button that turns the globe to a time and brings it into view. */
function onGlobe(globe: Globe, age: number, label: string): HTMLElement {
  const button = h('button', { type: 'button', class: 'link to-globe' }, label);
  button.addEventListener('click', () => {
    globe.showAge(age);
    globe.element.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    globe.element.querySelector<HTMLElement>('h2')!.focus({ preventScroll: true });
  });
  return button;
}

/** What a reader should know before trusting the passage shown: first the caveats on this setting, then those on the chapter as a whole. */
function textCaveats(c: ChapterResult, chapterStory: ChapterStory | null): string[] {
  const env = c.environments[0];
  const all = (env && chapterStory?.caveats) || [];
  const mine = all.filter((x) => env && x.about.includes(env.type));
  const wider = all.filter((x) => x.about.includes('world') && !mine.includes(x));
  // A major event dates rock that the map dates loosely; say what that link rests on.
  const events = c.events.map((e) => `The ${e.name} entry describes the event as a whole. Its link to this spot rests on the kind of rock mapped here and on the region, not on a date measured at this spot.`);
  return [...mine.map((x) => x.text), ...events, ...wider.map((x) => x.text), ...labelCaveats(shownGenera(c))];
}

/** One chapter's stretch of the rock column, drawn by time: each layer a block in the color of its main rock, the gaps left hatched. */
function strata(band: Band): HTMLElement {
  const box = h('span', { class: 'strata', 'aria-hidden': 'true' });
  // Oldest first, so that where two layers overlap in time the younger lies on top.
  for (const { layer, top, height } of [...band.layers].reverse()) {
    const block = h('span', { class: layer.here ? 'here' : '' });
    block.style.cssText = `top: ${(top * 100).toFixed(2)}%; height: ${(height * 100).toFixed(2)}%; background: ${ROCK_KINDS[rockKind(layer)].color}`;
    box.append(block);
  }
  return box;
}

/**
 * The rock layers beneath the region, behind a click: one row per chapter with its stretch of the column and the layers in words.
 * Where no column covers the place, the panel says so.
 */
function columnPanel(x: Exploration, bands: Band[]): HTMLElement {
  const summary = h('summary', {}, h('h2', {}, 'Rock layers beneath this region'));
  if (!x.column) {
    return h(
      'details',
      { class: 'column', id: 'rock-layers' },
      summary,
      h('p', {}, 'No stacked record of rock layers has been compiled for this region in the data this site uses. Such records cover the United States and Canada well, and New Zealand, the Caribbean and parts of South America and Africa. The rock mapped at the surface here is listed in each chapter of the timeline, under "The evidence and the caveats".'),
    );
  }
  const used = [...new Set(x.layers.map(rockKind))];
  const rows = bands.map((band) => {
    const list = band.layers.map(({ layer }) => {
      const rocks = [...new Set(layer.liths.map((l) => l.name))].slice(0, 4).join(', ');
      const details = [rocks, ageRange(layer.old, layer.young), thicknessWords(layer), layer.envs.length > 0 ? `laid down in: ${[...new Set(layer.envs.map((e) => e.replace(/ indet\.$/, '')))].slice(0, 3).join(', ')}` : null].filter(Boolean).join('; ');
      const swatch = h('span', { class: 'swatch', 'aria-hidden': 'true' });
      swatch.style.background = ROCK_KINDS[rockKind(layer)].color;
      return h('li', {}, swatch, h('strong', {}, layer.name), `: ${details}.`, layer.here ? h('span', { class: 'at-spot' }, ' Rock of this kind and age is also mapped at this exact spot.') : null);
    });
    const span = band.chapter.id === 'precambrian' && band.old < band.chapter.old ? `${round(band.old)} to ${round(band.young)} million years ago shown` : ageRange(band.chapter.old, band.chapter.young);
    return h(
      'li',
      { class: band.layers.length > 0 ? 'band' : 'band gap' },
      strata(band),
      h('div', {}, h('h3', {}, band.chapter.name, ' ', h('span', { class: 'age' }, span)), band.layers.length > 0 ? h('ul', {}, ...list) : h('p', { class: 'none' }, 'No rock of this age is recorded in this region.')),
    );
  });
  const legend = h(
    'ul',
    { class: 'legend' },
    ...used.map((kind) => {
      const swatch = h('span', { class: 'swatch', 'aria-hidden': 'true' });
      swatch.style.background = ROCK_KINDS[kind].color;
      return h('li', {}, swatch, ROCK_KINDS[kind].word);
    }),
  );
  return h(
    'details',
    { class: 'column', id: 'rock-layers' },
    summary,
    h(
      'p',
      {},
      `This is the stacked record of rock layers for the region around this place (${x.column}), youngest at the top. It is drawn by time, not by thickness: each band is one chapter of the timeline, each colored block is a layer placed by its age, and a hatched stretch is a time from which no rock is recorded here, either because none was laid down or because it was later worn away.`,
    ),
    legend,
    h('ol', { class: 'bands' }, ...rows),
    caveatList('Caveats about the rock layers', [
      'The record describes a region that can be tens of kilometers across, not this exact spot. A layer listed here may be missing, thinner or thicker beneath this place.',
      'Layers are placed by their age ranges, which are often broad. Two layers that overlap in time are drawn one over the other.',
      'Thickness is recorded as a least and a greatest figure for the region, and for some layers not at all.',
      'The colors show only the main kind of rock in each layer. Most layers hold several kinds.',
    ]),
  );
}

/** One chapter: a tile with its scene, drawn small from the data for this place, which opens to the scene at full size and the text. */
function chapterTile(c: ChapterResult, place: LatLng, globe: Globe | null, band: Band | null): HTMLElement {
  const env = c.environments[0];
  const params = sceneParams(c, place);
  const about = h('p');
  const pictureCaveats = caveatList('Caveats about the picture', []);
  const art = h('div', { class: 'scene-art' }, params ? null : 'No record');
  // The picture's description is in the panel ("What this picture shows"), so the tile itself reads as name, date and setting.
  const picture = h('div', { class: `pic ${params ? `scene-${params.environment}` : 'scene-none'}`, 'aria-hidden': 'true' }, art);
  let stack: Element | null = null;
  let open = false;
  // Shows the scene full screen, once it has been drawn.
  let full: ((opener: HTMLElement) => void) | null = null;
  // With "Full-screen pictures" on in the settings, a click on the picture shows it full screen and leaves the tile as it is.
  picture.addEventListener('click', (event) => {
    if (!settings.fullscreen || !full) return;
    event.preventDefault();
    full(picture.closest('summary')!);
  });
  if (params) {
    drawWhenSeen.set(art, () => {
      sceneCode
        .then(({ composeScene, fitLayers }) => {
          const scene = composeScene(params);
          full = (opener) => {
            const large = h('div', { class: 'scene-art', role: 'img', 'aria-label': scene.description });
            large.innerHTML = scene.html;
            showFullScreen(large, `${c.chapter.name}: ${ENV_LABEL[env!.type]}. Representative scene, not a portrait of this exact spot.`, opener, () => {
              fitLayers(large.firstElementChild!);
              large.firstElementChild!.classList.add('live');
            });
          };
          art.innerHTML = scene.html;
          about.textContent = scene.description;
          stack = art.firstElementChild!;
          fitLayers(stack);
          if (open) onScreen.observe(stack);
          const uncertain = c.tier >= 3 ? ['No rock of this age is confirmed at this exact spot, so the setting itself is less certain than a picture can show.'] : [];
          fillCaveats(pictureCaveats, 'Caveats about the picture', [...uncertain, ...scene.caveats]);
        })
        .catch((err) => {
          console.error(err);
          art.textContent = 'The scene could not be drawn.';
        });
    });
    seen.observe(art);
  }
  const words = h(
    'span',
    { class: 'words' },
    h('h4', {}, c.chapter.name),
    h('span', { class: 'age' }, ageRange(c.chapter.old, c.chapter.young)),
    h('span', { class: 'environment' }, env ? ENV_LABEL[env.type] : 'No record'),
    // The short wording on the closed tile, the full wording once it is open.
    env ? h('span', { class: `tier tier-${c.tier}` }, h('span', { class: 'short' }, TIER_SHORT[c.tier]), h('span', { class: 'full' }, TIER_LABEL[c.tier])) : null,
  );
  const pause = h('button', { type: 'button', class: 'link motion' }, settings.motion ? 'Pause motion' : 'Play motion');
  pause.addEventListener('click', () => setSetting('motion', !settings.motion));
  const enlarge = h('button', { type: 'button', class: 'link' }, 'Full screen');
  enlarge.addEventListener('click', () => full?.(enlarge));
  // The chapter's passages and their caveats are fetched when the tile is first opened. Until then, and if the
  // download fails, only the caveats that need no story text are listed.
  const storyBox = story(c);
  const caveats = caveatList('Caveats about the text', textCaveats(c, null));
  const wait = h('p', { class: 'note', role: 'status' });
  let asked = false;
  const fetchStory = () => {
    if (asked || !storyBox) return;
    asked = true;
    wait.textContent = 'Loading the story of this time…';
    storyBox.append(wait);
    loadStory(c.chapter.id)
      .then((chapterStory) => {
        wait.remove();
        addPassages(storyBox, c, chapterStory);
        fillCaveats(caveats, 'Caveats about the text', textCaveats(c, chapterStory));
      })
      .catch((err) => {
        console.error(err);
        wait.textContent = 'The story of this time could not be loaded. Check your connection, then close this chapter and open it again.';
        asked = false;
      });
  };
  const body = h(
    'div',
    { class: 'body' },
    params ? h('p', { class: 'caption' }, 'Representative scene, not a portrait of this exact spot. ', pause, ' ', enlarge) : null,
    params ? h('details', {}, h('summary', {}, 'What this picture shows'), about) : null,
    storyBox,
    sequence(c),
    ...c.notes.map((n) => h('p', { class: 'note' }, n)),
    globe && c.paleo?.status === 'ok' ? onGlobe(globe, (c.chapter.old + c.chapter.young) / 2, `Show the ${c.chapter.name} on the globe`) : null,
    h('details', { class: 'evidence' }, h('summary', {}, 'The evidence and the caveats'), factList(c), caveats, pictureCaveats),
  );
  // A scene moves only while its tile is open: fifteen small moving pictures would be a lot for a phone.
  const li = tile('chapter', picture, words, body, (now) => {
    open = now;
    if (now) fetchStory();
    if (!stack) return;
    if (now) onScreen.observe(stack);
    else {
      onScreen.unobserve(stack);
      stack.classList.remove('live');
    }
  });
  // An event's note beside the timeline points at its chapter by this id.
  li.id = `chapter-${c.chapter.id}`;
  // On a wide screen the chapter's stretch of the rock column stands at the tile's left edge; a click on it opens the full panel.
  if (band) {
    const strip = strata(band);
    strip.title = 'Rock layers of this time in the region. Click for the full list.';
    strip.addEventListener('click', () => {
      const panel = document.querySelector<HTMLDetailsElement>('#rock-layers')!;
      panel.open = true;
      panel.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
      panel.querySelector('summary')!.focus({ preventScroll: true });
    });
    li.classList.add('with-strata');
    li.prepend(strip);
  }
  return li;
}

/** The plate model and the ancient maps stop here, in millions of years. */
const OLDEST_MAP = 540;

const TERRAIN_THEN = { land: 'was land', 'shallow-sea': 'lay under a shallow sea', 'deep-sea': 'lay under deep sea' };

/** Where this place was when the extinction happened: built only from the plate model and the ancient maps. */
function placeThen(e: TimelineEvent, then: PlaceThen | undefined): string | null {
  if (!then) return null;
  let text = `When this happened, this spot lay ${latitudeWords(then.lat)} and, on the broad maps of the ancient world, ${TERRAIN_THEN[then.terrain]}.`;
  if (then.kmFromImpact !== undefined) {
    const km = Math.round(then.kmFromImpact / 100) * 100;
    text += km < 300 ? ' It was within a few hundred kilometers of where the asteroid struck.' : ` It was about ${km.toLocaleString('en')} km from where the asteroid struck.`;
  }
  if (e.age >= 200) text += ' Positions this old are uncertain.';
  return text;
}

/** The painting, the text and the caveats of an extinction. */
function extinctionBody(e: TimelineEvent, text: EventText, then: PlaceThen | undefined, globe: Globe | null): Child[] {
  const base = `${import.meta.env.BASE_URL}extinctions/${e.id}`;
  const img = h('img', { src: `${base}-800.webp`, srcset: `${base}-800.webp 800w, ${base}.webp 1600w`, sizes: '(max-width: 760px) 100vw, 720px', width: '1600', height: '900', loading: 'lazy', alt: text.picture });
  // The painting full screen: by the button under it, or, with "Full-screen pictures" on in the settings, by a click on the painting.
  const enlarge = h('button', { type: 'button', class: 'link' }, 'Full screen');
  const full = () => showFullScreen(h('img', { src: `${base}.webp`, width: '1600', height: '900', alt: text.picture }), `${e.name}. An impression painted by this site's code, not a record of a real view.`, enlarge);
  enlarge.addEventListener('click', full);
  img.addEventListener('click', () => settings.fullscreen && full());
  const figure = h('figure', { class: 'painting' }, img, h('figcaption', {}, "An impression painted by this site's code, not a record of a real view. ", enlarge));
  // A picture that has not been painted yet leaves no gap.
  img.addEventListener('error', () => figure.remove());
  // In the last million years the place has been where it is now: there is no ancient position to tell or to show.
  if (e.age < 1) then = undefined;
  // Before the oldest maps of the ancient world, nothing can be said about where a place lay.
  const local = e.age > OLDEST_MAP ? 'This is older than the oldest maps of the ancient world, which reach back about 540 million years, so this site cannot say where this spot lay at the time.' : placeThen(e, then);
  return [
    figure,
    h('div', { class: 'story' }, local && h('p', { class: 'local' }, local), h('p', {}, text.plain), h('details', {}, h('summary', {}, 'More detail'), h('p', {}, text.more))),
    globe && then ? onGlobe(globe, e.age, 'Show this time on the globe') : null,
    h(
      'details',
      { class: 'evidence' },
      h('summary', {}, text.sources ? 'The caveats and the sources' : 'The caveats'),
      caveatList('Caveats about the text', text.caveats),
      caveatList('Caveats about the picture', [PICTURE_CAVEAT, ...(text.pictureCaveats ?? [])]),
      caveatList('Published sources', text.sources ?? []),
    ),
  ];
}

/**
 * The one panel in which an event is read. Events (extinctions, turning points, tectonic events) are not part of the place's own
 * thread of scenes, so they are small notes beside it, and a note opens here, over the page.
 */
const eventPanel = h('dialog', { class: 'event-panel', 'aria-labelledby': 'event-panel-title' });
document.body.append(eventPanel);
// A click on the dimmed page around the panel closes it. So does the link to the globe, which lies beneath the panel:
// this runs before the link's own action, so that the focus the panel hands back does not undo the move to the globe.
eventPanel.addEventListener(
  'click',
  (e) => {
    if (e.target === eventPanel || (e.target as Element).closest('.to-globe')) eventPanel.close();
  },
  true,
);

interface EventNote {
  /** Sets the color of the note's edge: 'mass', 'lost', 'turning' or 'tectonic'. */
  kind: string;
  kicker: string;
  name: string;
  when: string;
  thumb: HTMLElement | null;
  /** Id of the chapter the event belongs with. */
  chapter: string;
  /** The panel's contents, built when the note is opened, once the event's text has been fetched. */
  body: () => Promise<Child[]>;
}

/** A note for one event: a small picture, a label, a name and a date. It opens the event's panel, and while it is pointed at, its chapter is outlined. */
function eventNote(n: EventNote): HTMLElement {
  const button = h(
    'button',
    { type: 'button', class: `event-note ${n.kind}` },
    h('span', { class: 'pic', 'aria-hidden': 'true' }, n.thumb),
    h('span', { class: 'words' }, h('span', { class: 'kicker' }, n.kicker), h('span', { class: 'name' }, n.name), h('span', { class: 'age' }, n.when)),
  );
  button.addEventListener('click', () => {
    // Close stands at the top and stays there as the panel is scrolled: at the foot, a phone's own bars can cover it.
    const close = h('button', { type: 'button', class: 'close' }, 'Close');
    close.addEventListener('click', () => eventPanel.close());
    const wait = h('p', { class: 'wait', role: 'status' }, 'Loading…');
    const inner = h('div', { class: `inner ${n.kind}` }, h('div', { class: 'bar' }, h('p', { class: 'kicker' }, n.kicker), close), h('h3', { id: 'event-panel-title' }, n.name), h('p', { class: 'age' }, n.when), wait);
    eventPanel.replaceChildren(inner);
    eventPanel.showModal();
    eventPanel.scrollTop = 0;
    // If another note is opened meanwhile, this one's contents arrive in a panel no longer shown, and do no harm.
    n.body().then(
      (body) => {
        wait.remove();
        inner.append(...body.filter((c): c is Node | string => !!c));
      },
      (err) => {
        console.error(err);
        wait.textContent = 'The text could not be loaded. Check your connection, then close this and open it again.';
      },
    );
  });
  const mark = (on: boolean) => document.getElementById(`chapter-${n.chapter}`)?.classList.toggle('marked', on);
  button.addEventListener('mouseenter', () => mark(true));
  button.addEventListener('mouseleave', () => mark(false));
  button.addEventListener('focus', () => mark(true));
  button.addEventListener('blur', () => mark(false));
  const li = h('li', {}, button);
  li.dataset.chapter = n.chapter;
  return li;
}

/** The note for an extinction or a turning point, with a thumbnail of its painting. */
function extinctionNote(e: TimelineEvent, then: PlaceThen | undefined, globe: Globe | null): HTMLElement {
  const thumb = h('img', { src: `${import.meta.env.BASE_URL}extinctions/${e.id}-320.webp`, width: '320', height: '180', loading: 'lazy', alt: '' });
  thumb.addEventListener('error', () => thumb.remove());
  return eventNote({
    kind: e.kind === 'turning-point' ? 'turning' : e.rank === 1 ? 'mass' : 'lost',
    kicker: e.kind === 'turning-point' ? 'Turning point' : e.rank === 1 ? 'Mass extinction' : 'Lesser extinction',
    name: e.name,
    when: e.when,
    thumb,
    chapter: e.chapter,
    body: async () => extinctionBody(e, await loadEventText(e), then, globe),
  });
}

/** Where the place lay about the middle of a tectonic event, on the ancient map nearest that time. Null before the oldest maps, or where the plate model cannot place the spot. */
function tectonicThen(x: Exploration, e: TectonicEvent): { age: number; at: LatLng; terrain: Terrain } | null {
  const middle = (e.old + e.young) / 2;
  if (!x.globe || middle > OLDEST_MAP) return null;
  const { dem, model } = x.globe;
  const age = dem.ages.reduce((best, a) => (Math.abs(a - middle) < Math.abs(best - middle) ? a : best));
  const at = reconstruct(model, x.point, age);
  return at && { age, at, terrain: terrainAt(dem, age, at).terrain };
}

/** A small globe of one time, turned to where the place then lay, with the place marked at its center. Painted when it nears the screen. */
function smallGlobe(dem: PaleoDem, age: number, at: LatLng): HTMLCanvasElement {
  const size = 360;
  const canvas = h('canvas', { width: String(size), height: String(size) });
  drawWhenSeen.set(canvas, () => {
    const ctx = canvas.getContext('2d')!;
    const image = ctx.createImageData(size, size);
    paintGlobe(image, dem, dem.ages.indexOf(age), at, { palette: globeView() });
    ctx.putImageData(image, 0, 0);
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 10, 0, Math.PI * 2);
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, 6, 0, Math.PI * 2);
    ctx.fillStyle = globeView().marker.color;
    ctx.fill();
  });
  seen.observe(canvas);
  return canvas;
}

/**
 * The note for a tectonic event in whose published region the place lies. Its picture is a globe of the time, drawn from the
 * ancient maps, so it needs no painting.
 */
function tectonicNote(e: TectonicEvent, x: Exploration, globe: Globe | null): HTMLElement {
  const then = tectonicThen(x, e);
  return eventNote({
    kind: 'tectonic',
    kicker: KIND_LABEL[e.kind],
    name: e.name,
    when: ageRange(e.old, e.young),
    thumb: then && smallGlobe(x.globe!.dem, then.age, then.at),
    chapter: chapterOf(e).id,
    body: async () => tectonicBody(e, await loadTectonicText(e), x, globe, then),
  });
}

function tectonicBody(e: TectonicEvent, text: TectonicText, x: Exploration, globe: Globe | null, then: ReturnType<typeof tectonicThen>): Child[] {
  let local: string;
  if (then) {
    local = then.age === 0 ? 'The small globe shows the Earth today, with this spot marked.' : `The small globe shows the Earth ${then.age} million years ago, about the middle of this event, with this spot marked. It then lay ${latitudeWords(then.at.lat)} and, on the broad maps of the ancient world, ${TERRAIN_THEN[then.terrain]}.`;
    if (then.age >= 200) local += ' Positions this old are uncertain.';
  } else if ((e.old + e.young) / 2 > OLDEST_MAP) {
    local = 'This is older than the oldest maps of the ancient world, which reach back about 540 million years, so this site cannot say where this spot lay at the time.';
  } else {
    local = 'The plate model cannot place this spot at the time, so there is no globe to show.';
  }
  const deep = x.timeline.flatMap((c) => c.mountains).find((m) => m.event === e);
  return [
    then && h('div', { class: 'globe-pic', 'aria-hidden': 'true' }, smallGlobe(x.globe!.dem, then.age, then.at)),
    h(
      'div',
      { class: 'story' },
      h('p', { class: 'local' }, 'This spot lies inside the region that published work gives for this event. ', local),
      h('p', {}, text.plain),
      deep?.unit && h('p', {}, `Rock that formed deep underground is mapped at this spot (${deep.unit.name}), and it is old enough to have been here while these mountains were built. Whether it was squeezed and heated then, or only lifted, no date measured at this spot shows.`),
      deep && !deep.unit && h('p', {}, 'These mountains are still being built, and high ground rises within 10 km of this spot today, which places it in the range. How long the range has stood here, no evidence at this spot shows.'),
    ),
    globe && then ? onGlobe(globe, then.age, 'Show this time on the globe') : null,
    h(
      'details',
      { class: 'evidence' },
      h('summary', {}, 'The caveats and the sources'),
      caveatList('Caveats about the text', [REGION_CAVEAT, ...text.caveats]),
      then ? caveatList('Caveats about the picture', ['The globe is drawn from reconstructed maps of the ancient world on a grid of about 100 km. It shows this spot where one plate model places it; other models differ, more so further back in time.']) : null,
      caveatList('Published sources', text.sources),
    ),
  ];
}

// The eras group the chapters, oldest last, as the timeline runs.
const ERAS = [
  { id: 'cenozoic', name: 'Cenozoic', old: 66, young: 0 },
  { id: 'mesozoic', name: 'Mesozoic', old: 251.9, young: 66 },
  { id: 'paleozoic', name: 'Paleozoic', old: 538.8, young: 251.9 },
  { id: 'precambrian', name: 'Precambrian', old: 4600, young: 538.8 },
];
/** The last line of the timeline, below the oldest turning point. The age is Dalrymple's (2001), from lead isotopes in meteorites and in the Earth's lead. */
const EARTH_FORMS = 'The Earth forms, about 4.54 billion years ago, over tens of millions of years. Its earliest age is called the Hadean.';
const eraOf = (c: Chapter) => ERAS.find((e) => (c.old + c.young) / 2 <= e.old && (c.old + c.young) / 2 >= e.young)!;
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/**
 * Said once, near the top, where most of the rock at the point formed deep underground. Such places show little but
 * regional pictures, and a visitor who knows the mountains were built in the meantime deserves to be told why.
 */
function bedrockNote(x: Exploration): string | null {
  const here = new Map<string, RockUnit>();
  for (const c of x.timeline) for (const u of [...c.rocksHere, ...c.looselyDated]) if (u.origin === 'here') here.set(`${u.name}|${u.old}|${u.young}`, u);
  const deep = [...here.values()].filter((u) => readLiths(u.liths, u.name).some((r) => r.kind === 'underground'));
  if (here.size === 0 || deep.length * 2 < here.size) return null;
  const told = x.tectonics.some((e) => e.kind === 'mountains');
  return (
    'Most of the rock mapped at this spot formed deep underground: rock altered by heat and pressure, or rock that cooled from magma below the surface. It does not record what the surface looked like. Maps give such rock one age range, often a very wide one, which may not include the times when it was later heated, squeezed or lifted into mountains. So most chapters here rest on the region or on the broad maps of the ancient world. ' +
    (told
      ? 'Mountain building that published work describes for this region is shown in the timeline as tiles of its own; other such times may be missing.'
      : 'A time of mountain building can be missing from this timeline altogether.')
  );
}

/** Wide enough for the events to stand beside the thread of chapters. */
const WIDE = matchMedia('(min-width: 60rem)');
/** Moves the event notes of the timeline on show to where they belong at this width. */
let placeNotes = (): void => {};
WIDE.addEventListener('change', () => placeNotes());

const NO_RECORD =
  'There is no record for this spot. No dated rock is mapped here, no fossil site lies within 100 km, and the plate model reconstructs only continental crust, so it gives no past position here. This is what the open ocean looks like in the data. Try a place on land.';

function render(place: Place, x: Exploration): void {
  // Open ocean and the like: one plain message, not fifteen empty chapters.
  const noRecord = x.notices.length === 0 && x.timeline.every((c) => c.tier === 5 && c.paleo?.status !== 'no-crust-yet');
  const summary = [
    x.mapUnits === 0 ? 'No dated rock units are mapped here.' : x.detailedMap ? 'Rock units from the detailed geological map.' : null,
    x.column ? `Regional rock column: ${x.column}.` : 'No regional rock column covers this place.',
    x.fossilSites > 0 ? `${x.fossilSites.toLocaleString('en')} fossil sites within 100 km.` : 'No fossil sites recorded within 100 km.',
  ];
  const globe = x.globe && !noRecord ? createGlobe({ ...x.globe, place: x.point, palette: globeView() }) : null;
  const then = (e: TimelineEvent) => x.extinctions.find((t) => t.id === e.id);
  const bands = x.column ? bandsOf(x.layers) : null;
  const placers: ((wide: boolean) => void)[] = [];
  const eras = ERAS.map((era) => {
    const chapters = x.timeline.filter((c) => eraOf(c.chapter) === era);
    const events = EVENTS.filter((e) => chapters.some((c) => c.chapter.id === e.chapter));
    // Tectonic events run youngest first too, by the middle of each.
    const tectonics = x.tectonics.filter((e) => chapters.some((c) => c.chapter === chapterOf(e))).sort((a, b) => a.old + a.young - (b.old + b.young));
    // The chapters are the thread. Each chapter's events are notes: beside the thread on a wide screen, in a row under their
    // chapter on a narrow one. Youngest first: the mass extinction that closed a chapter, then what fell within it.
    const notes: HTMLElement[] = [];
    const tiles = chapters.flatMap((c) => {
      const here = events.filter((e) => e.chapter === c.chapter.id).sort((a, b) => a.rank - b.rank || a.age - b.age);
      notes.push(...here.map((e) => extinctionNote(e, then(e), globe)), ...tectonics.filter((e) => chapterOf(e) === c.chapter).map((e) => tectonicNote(e, x, globe)));
      const under = h('li', { class: 'under' }, h('ol', { class: 'notes' }));
      under.dataset.chapter = c.chapter.id;
      return [chapterTile(c, x.point, globe, bands?.find((b) => b.chapter === c.chapter) ?? null), under];
    });
    const rail = h('aside', { class: 'rail', 'aria-label': `Events in the ${era.name}` }, h('ol', { class: 'notes' }));
    placers.push((wide) => {
      rail.hidden = !wide || notes.length === 0;
      for (const under of tiles) {
        if (!under.classList.contains('under')) continue;
        const mine = notes.filter((n) => n.dataset.chapter === under.dataset.chapter);
        under.hidden = wide || mine.length === 0;
        (wide ? rail : under).firstElementChild!.append(...mine);
      }
    });
    const turning = events.filter((e) => e.kind === 'turning-point').length;
    const lost = events.length - turning;
    const holds = [count(chapters.length, 'chapter', 'chapters'), lost > 0 ? count(lost, 'extinction', 'extinctions') : null, turning > 0 ? count(turning, 'turning point', 'turning points') : null, tectonics.length > 0 ? count(tectonics.length, 'tectonic event', 'tectonic events') : null].filter(Boolean).join(', ');
    return h(
      'details',
      { class: 'era', id: `era-${era.id}`, open: '' },
      h('summary', {}, h('h3', {}, era.name), h('span', { class: 'age' }, `${ageRange(era.old, era.young)} · ${holds}`)),
      h('div', { class: 'thread' }, h('ol', { class: 'tiles' }, ...tiles, ...(era.id === 'precambrian' ? [h('li', { class: 'marker' }, EARTH_FORMS)] : [])), rail),
    );
  });
  placeNotes = () => placers.forEach((place) => place(WIDE.matches));
  placeNotes();
  const jump = h(
    'nav',
    { class: 'eras', 'aria-label': 'Eras' },
    ...ERAS.map((era, i) => {
      const link = h('a', { href: `#era-${era.id}` }, era.name);
      // A link to an era that has been closed opens it again.
      link.addEventListener('click', () => (eras[i]!.open = true));
      return link;
    }),
  );
  const bedrock = noRecord ? null : bedrockNote(x);
  result.replaceChildren(
    h('h2', {}, place.label),
    h('p', { class: 'coords' }, `${place.lat.toFixed(3)}, ${place.lng.toFixed(3)}`),
    h('p', { class: 'summary' }, summary.filter(Boolean).join(' ')),
    ...x.notices.map((n) => h('p', { class: 'notice' }, n)),
    ...(bedrock ? [h('p', { class: 'aside' }, bedrock)] : []),
    ...(globe ? [globe.element] : []),
    ...(noRecord ? [] : [columnPanel(x, bands ?? [])]),
    ...(noRecord ? [h('p', { class: 'notice' }, NO_RECORD)] : [h('p', { class: 'how' }, 'Each tile opens to a larger picture, the story and the evidence. The youngest time comes first. The smaller notes are events of the wider world or the region: extinctions, turning points, mountain building and the opening of oceans.' + (bands ? ' On a wide screen, the colored strip at the left of each tile is the rock recorded in the region from that time.' : '')), jump, h('div', { class: 'timeline' }, ...eras)]),
    h(
      'details',
      { class: 'sources-box' },
      h('summary', {}, `Sources for this place (${x.sources.length})`),
      h('ul', { class: 'sources' }, ...x.sources.map((s) => h('li', {}, s.url ? h('a', { href: s.url, rel: 'noopener' }, s.text) : s.text))),
      h('p', { class: 'models' }, `Ancient latitudes use ${PLATE_MODELS.length} plate models. The first, ${PLATE_MODELS[0]!.label}, also sets the regional picture.`),
    ),
  );
  result.querySelector('h2')!.setAttribute('tabindex', '-1');
  result.querySelector<HTMLElement>('h2')!.focus();
}

// ---------- actions ----------

/** The place on show, if any: the pin-drop globe opens facing it. */
let shown: Place | null = null;
/** What was last drawn, so that it can be drawn again when the globe's colors are changed. */
let drawn: { place: Place; found: Exploration } | null = null;

onSetting((key) => {
  applySettings();
  if (key !== 'globe') return;
  closePicker();
  if (drawn && drawn.place === shown) render(drawn.place, drawn.found);
});

async function show(place: Place): Promise<void> {
  shown = place;
  choices.replaceChildren();
  result.replaceChildren();
  statusBox.textContent = `Reading the record for ${place.label}…`;
  const params = new URLSearchParams({ lat: String(place.lat), lng: String(place.lng), name: place.label });
  history.replaceState(null, '', `?${params}`);
  try {
    const found = await explore(browserRead, place, fetchMapUnits, MAJOR_EVENTS);
    // The visitor may have chosen another place while this one was being read; the later choice wins.
    if (shown !== place) return;
    drawn = { place, found };
    render(place, found);
    statusBox.textContent = '';
  } catch (err) {
    console.error(err);
    if (shown === place) statusBox.textContent = 'Something went wrong while reading the record for this place. Please try again.';
  }
}

function offer(places: Place[], query: string, online: boolean): void {
  result.replaceChildren();
  const list = h(
    'ul',
    { class: 'choices' },
    ...places.map((p) => {
      const button = h('button', { type: 'button' }, p.label);
      button.addEventListener('click', () => void show(p));
      return h('li', {}, button);
    }),
  );
  const more = h('button', { type: 'button', class: 'link' }, 'Search online for smaller places and landmarks');
  more.addEventListener('click', async () => {
    statusBox.textContent = 'Searching online…';
    try {
      const found = await searchOnline(query);
      statusBox.textContent = found.length === 0 ? `Nothing found online for "${query}". Try another spelling, or enter coordinates.` : '';
      offer(found, query, true);
    } catch {
      statusBox.textContent = 'The online place search could not be reached. Try another spelling, or enter coordinates.';
    }
  });
  choices.replaceChildren(
    ...(places.length > 0 ? [h('h2', {}, 'Which place?'), list] : []),
    online ? h('p', { class: 'credit' }, 'Online place search by Open-Meteo, using GeoNames data.') : more,
  );
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const query = input.value.trim();
  const typed = parseCoordinates(query);
  if (typed) return void show(typed);
  // Two numbers that are not a place on Earth: say so, and do not look for a town of that name.
  if (/^-?\d+(\.\d+)?\s*[, ]\s*-?\d+(\.\d+)?$/.test(query)) {
    choices.replaceChildren();
    statusBox.textContent = 'Those numbers are not a latitude and longitude. Latitude comes first and runs from -90 to 90; longitude runs from -180 to 180. For example: 64.13, -21.9.';
    return;
  }
  statusBox.textContent = 'Searching…';
  try {
    const places = await searchShipped(browserRead, query);
    statusBox.textContent = places.length === 0 ? `No town or city of 5,000 people or more starts with "${query}".` : '';
    offer(places, query, false);
  } catch {
    statusBox.textContent = 'The place list could not be loaded. You can still enter a latitude and longitude, such as 64.13, -21.9.';
  }
});

document.querySelector('#locate')!.addEventListener('click', () => {
  if (!navigator.geolocation) {
    statusBox.textContent = 'This browser cannot share its location. Enter a place name or coordinates instead.';
    return;
  }
  statusBox.textContent = 'Asking your device for its location…';
  navigator.geolocation.getCurrentPosition(
    (pos) => void show({ label: 'Your location', lat: pos.coords.latitude, lng: pos.coords.longitude }),
    () => (statusBox.textContent = 'Your location is not available. Enter a place name or coordinates instead.'),
  );
});

// A globe of today's Earth for dropping a pin. Its maps are fetched only when it is first asked for.
const pickButton = document.querySelector<HTMLButtonElement>('#pick')!;
const pickerBox = document.querySelector<HTMLElement>('#picker')!;
let pickerMaps: Promise<PaleoDem> | undefined;
function closePicker(): void {
  pickerBox.replaceChildren();
  pickButton.setAttribute('aria-expanded', 'false');
}
pickButton.addEventListener('click', async () => {
  if (pickerBox.hasChildNodes()) return closePicker();
  statusBox.textContent = 'Loading the globe…';
  try {
    pickerMaps ??= loadPaleoDem(browserRead);
    const picker = createPicker(
      await pickerMaps,
      globeView(),
      (p) => {
        closePicker();
        void show({ label: `Dropped pin, ${coordWords(p)}`, lat: p.lat, lng: p.lng });
      },
      shown ?? undefined,
    );
    pickerBox.replaceChildren(picker);
    pickButton.setAttribute('aria-expanded', 'true');
    statusBox.textContent = '';
    picker.querySelector<HTMLElement>('h2')!.focus();
  } catch {
    pickerMaps = undefined;
    statusBox.textContent = 'The globe could not be loaded. You can still enter a latitude and longitude, such as 64.13, -21.9.';
  }
});

// A shared or reloaded link opens straight on its place.
const fromLink = parseCoordinates(`${params.get('lat')}, ${params.get('lng')}`);
if (fromLink) void show({ ...fromLink, label: params.get('name') || fromLink.label });
