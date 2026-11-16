// Entry point for the procedural scenes.
// renderScene(params) assembles one scene as an SVG element from layered,
// whitelisted parts. Nothing here calls a network service or an AI model.

import { CHAPTERS } from '../match/chapters';
import { ENV_LABEL, type EnvType } from '../match/taxonomy';
import { carbonateSea } from './carbonate-sea';
import { deepSea } from './deep-sea';
import { delta } from './delta';
import { desert } from './desert';
import { makeRng, subSeed } from './draw';
import { layered } from './motion';
import { ice } from './ice';
import { lake } from './lake';
import { land } from './land';
import { mountains } from './mountains';
import { reef } from './reef';
import { riverPlain } from './river-plain';
import { shelfSea } from './shelf-sea';
import { shoreline } from './shoreline';
import { H, type SceneParams, Stage, W } from './stage';
import { swamp } from './swamp';
import { volcanicLand } from './volcanic-land';
import { GENERAL_CAVEATS, GROUPS, PERMITS } from './whitelist';

export type { SceneParams } from './stage';
export { fitLayers } from './motion';

const SVG_NS = 'http://www.w3.org/2000/svg';
export const LABEL = 'Representative scene, not a portrait of this exact spot';

/** One composition per environment type in the taxonomy. */
const COMPOSE: Record<EnvType, (st: Stage) => string> = {
  'deep-sea': deepSea,
  'shelf-sea': shelfSea,
  'carbonate-sea': carbonateSea,
  reef,
  shoreline,
  delta,
  'river-plain': riverPlain,
  lake,
  swamp,
  desert,
  ice,
  'volcanic-land': volcanicLand,
  mountains,
  land,
};

// Gradient and clip ids must be unique across every scene on a page.
const token = Math.random().toString(36).slice(2, 7);
let counter = 0;

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function listOf(items: string[]): string {
  if (items.length < 2) return items.join('');
  return items.slice(0, -1).join(', ') + ' and ' + items[items.length - 1];
}

const CLIMATE_TEXT = {
  wet: 'The colors follow a wet climate.',
  dry: 'The colors follow a dry climate.',
  cold: 'The colors follow a cold climate.',
  neutral: 'The rocks give no evidence of the climate, so the colors are a neutral choice.',
};

/** The plain-language description that travels with every scene. */
export function describe(st: Stage): string {
  const { p, light } = st;
  let where = '';
  let sun = 'The ancient latitude is not known, so the light is a neutral choice.';
  if (p.paleolatitude !== null) {
    const lat = Math.round(Math.abs(p.paleolatitude));
    where = lat < 3 ? ', on the equator' : `, about ${lat}° ${p.paleolatitude < 0 ? 'south' : 'north'} of the equator`;
    sun =
      light.elev > 56
        ? 'The sun is high overhead and the light is bright and even.'
        : light.elev > 25
          ? 'The sun stands partway up the sky.'
          : 'The sun is low and the light is dim and golden.';
  }
  const name = (id: string) => lower(PERMITS.find((x) => x.id === id)?.name ?? id);
  const ids = [...st.shown.keys()];
  // Nothing is listed for mountains in their own right (see listedAs in stage.ts), and the text says where the list comes from.
  const upland = p.environment === 'mountains';
  const drawn = ids.length
    ? `Shown${upland ? ' sparsely, from the list permitted for lower ground at this time' : ', from the list permitted for this time and setting'}: ${listOf(ids.map(name))}.`
    : upland
      ? 'No plants or animals are shown: nothing on the list permitted for land at this time fits.'
      : 'No plants or animals are shown: nothing on the permitted list fits this time and setting.';
  const local = ids.filter((id) => st.shown.get(id));
  const localText = local.length ? ` Included because fossils are recorded near this place: ${listOf(local.map(name))}.` : '';
  return `${ENV_LABEL[p.environment]} in the ${p.chapter}${where}. ${sun} ${CLIMATE_TEXT[p.climate]} ${drawn}${localText} ${LABEL}.`;
}

/**
 * What a visitor should know before trusting this picture: first the caveats
 * that hold for the whole picture, then those on the plants and animals in it.
 */
export function pictureCaveats(st: Stage): string[] {
  const { p } = st;
  const chapter = CHAPTERS.find((c) => c.name === p.chapter);
  const years = chapter ? chapter.old - chapter.young : 0;
  const lasted = years >= 10 ? `about ${Math.round(years)} million years` : years > 0 ? `about ${Math.round(years * 10) / 10} million years` : 'a very long time';
  const out = [
    'The picture is put together by rule, from a list of plants and animals known from this time, this kind of setting and this part of the world. It is not a reconstruction of this exact spot.',
    `The ${p.chapter} lasted ${lasted}. Everything shown lived at some time within it, but not necessarily at the same time or in the same region: two animals in one picture may never have met.`,
  ];
  if (p.climate === 'neutral') {
    out.push('The rocks here give no evidence of the climate at this time, so the picture does not take climate into account. Plants and animals of warm country and of cold country can appear together, and the colors are a neutral choice.');
  }
  if (p.paleolatitude === null) out.push('The ancient latitude of this spot is not known for this time, so the height of the sun and the light are a neutral choice.');
  if (p.environment === 'mountains') {
    out.push(
      "Mountains are shown because published work places this spot in a region where mountains were being built at this time, and the evidence listed with this chapter ties the spot to them. Nothing records their height, their shape or whether they carried snow: all of that in the picture is the artist's choice.",
    );
    if (p.worn) {
      out.push('By this time the mountains here were no longer being built and were wearing down. This site has one picture for mountains, so the peaks shown are probably higher and sharper than the worn range was.');
    }
    if (['Precambrian', 'Cambrian', 'Ordovician', 'Silurian'].includes(p.chapter)) {
      out.push(
        `Before plants spread over the land, rivers commonly ran in many shifting channels over loose gravel and sand, with nothing to hold their banks. The ${p.climate === 'dry' ? 'dry stream bed' : 'stream'} in this picture is drawn that way, and its course is imagined.`,
      );
    }
    if (st.shown.size > 0) {
      out.push('Life in mountains leaves almost no fossils, because high ground wears away instead of being buried. The few plants and animals shown are ones known from lower ground at the time.');
    }
  }
  out.push(GENERAL_CAVEATS.colors, GENERAL_CAVEATS.motion);
  if (p.environment === 'desert' && p.climate === 'cold') out.push(GENERAL_CAVEATS.frost);
  // Caveats on a part in the picture, then those on the whole of a group that has a part in the picture.
  const shown = new Set(st.shown.keys());
  const groups = GROUPS.filter((g) => g.permits.some((x) => shown.has(x.id)));
  for (const g of groups) for (const c of g.caveats) if (c.parts.some((id) => shown.has(id))) out.push(c.text);
  for (const g of groups) for (const c of g.caveats) if (c.parts.length === 0) out.push(c.text);
  return out;
}

export interface Rendered {
  /** The scene as one still picture: SVG markup, complete with its own title and description. */
  svg: string;
  /** The same picture as a stack of layers for the page, which motion.css can set gently moving. */
  html: string;
  description: string;
  /** What a visitor should know before trusting the picture. */
  caveats: string[];
  /** Ids of the parts drawn; true where a part was included because of a local fossil record. */
  shown: Map<string, boolean>;
}

/** Assemble one scene as markup. The same parameters always give the same picture. */
export function composeScene(params: SceneParams): Rendered {
  // Ice is its own evidence of a cold climate.
  const p = params.environment === 'ice' ? { ...params, climate: 'cold' as const } : params;
  const uid = `s${token}${++counter}`;
  const st = new Stage(p, uid);
  const body = COMPOSE[p.environment](st);
  const mirror = makeRng(subSeed(p.seed, 'mirror')).chance(0.5);
  const description = describe(st);
  const label =
    `<rect x="10" y="${H - 30}" width="356" height="21" rx="10.5" fill="#0f181c" opacity=".55"/>` +
    `<text x="22" y="${H - 15.5}" font-family="system-ui, -apple-system, 'Segoe UI', sans-serif" font-size="12.5" fill="#ffffff">${LABEL}</text>`;
  const inner =
    `<title id="${uid}t">${esc(`${ENV_LABEL[p.environment]}, ${p.chapter}`)}</title><desc id="${uid}d">${esc(description)}</desc>` +
    `<clipPath id="${uid}frame"><rect width="${W}" height="${H}"/></clipPath>` +
    `<g clip-path="url(#${uid}frame)">` +
    (mirror ? `<g transform="translate(${W} 0) scale(-1 1)">${body}</g>` : body) +
    label +
    `</g>`;
  return {
    svg: `<svg xmlns="${SVG_NS}" viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="${uid}t ${uid}d">${inner}</svg>`,
    html: layered(body, st, mirror, label, description),
    description,
    caveats: pictureCaveats(st),
    shown: st.shown,
  };
}

/** Assemble one scene as an element for the page. */
export function renderScene(p: SceneParams): SVGSVGElement {
  const holder = document.createElement('div');
  holder.innerHTML = composeScene(p).svg;
  return holder.firstElementChild as SVGSVGElement;
}
