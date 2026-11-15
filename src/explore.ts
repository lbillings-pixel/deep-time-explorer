// Gathers every kind of evidence for one location and runs the matching rules.
import type { ReadData } from './lib/data';
import { type LatLng, type PlateModel, crustAppears, loadPlateModel, reconstruct } from './geo/plates';
import { type PaleoDem, type Terrain, loadPaleoDem, terrainAt } from './geo/paleodem';
import { type Layer, markHere } from './column';
import { type ColumnLayer, loadColumn } from './data/columns';
import { loadFossilSites } from './data/fossils';
import { PROVINCE_SOURCE, provinceAt } from './data/provinces';
import { type ApiMapUnit, loadDefs, unitsFromApi, unitsFromGrid } from './data/rock';
import type { Source } from './data/sources';
import { CHAPTERS, RECONSTRUCTION_LIMIT } from './match/chapters';
import { type MajorEvent, eventsAt } from './match/events';
import { CHICXULUB, EVENTS } from './match/extinctions';
import { type ChapterResult, type FossilSite, type Paleo, type RockUnit, matchTimeline } from './match/match';
import { TECTONIC_EVENTS } from './match/tectonic-events';
import { type TectonicEvent, tectonicsAt } from './match/tectonics';

/** PALEOMAP is primary: it is the model the ancient-elevation maps are built on. The others show the spread. */
export const PLATE_MODELS = [
  { id: 'PALEOMAP', label: 'PALEOMAP (Scotese)' },
  { id: 'MERDITH2021', label: 'Merdith et al. (2021)' },
  { id: 'GOLONKA', label: 'Golonka, as updated by Wright et al. (2013)' },
];

/** Where the place lay when an extinction happened, from the first plate model and the ancient maps. */
export interface PlaceThen {
  id: string;
  /** Ancient latitude, degrees. */
  lat: number;
  terrain: Terrain;
  /** End-Cretaceous only: distance from the Chicxulub impact, in km, measured between the two ancient positions. */
  kmFromImpact?: number;
}

function kmBetween(a: LatLng, b: LatLng): number {
  const rad = Math.PI / 180;
  const h = Math.sin(((b.lat - a.lat) * rad) / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - a.lng) * rad) / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

/** The place at each extinction and turning point. An event is left out where the model cannot place the spot at that time. */
function placeAtExtinctions(model: PlateModel, dem: PaleoDem, p: LatLng): PlaceThen[] {
  return EVENTS.flatMap((e) => {
    // The model snaps to its nearest time step, so an event older than its oldest step must be left out by hand.
    const at = e.age > Math.max(...model.times) + 5 ? null : reconstruct(model, p, e.age);
    if (!at) return [];
    const mapAge = dem.ages.reduce((best, t) => (Math.abs(t - e.age) < Math.abs(best - e.age) ? t : best));
    const then: PlaceThen = { id: e.id, lat: at.lat, terrain: terrainAt(dem, mapAge, at).terrain };
    const impact = e.id === 'end-cretaceous' ? reconstruct(model, CHICXULUB, e.age) : null;
    if (impact) then.kmFromImpact = kmBetween(at, impact);
    return [then];
  });
}

export interface Exploration {
  point: LatLng;
  timeline: ChapterResult[];
  sources: Source[];
  /** Plain-language notes about data that could not be loaded. */
  notices: string[];
  /** Name of the regional Macrostrat column, if the point is in one. */
  column: string | null;
  /** The units of that column as layers, youngest first; empty if there is no column. */
  layers: Layer[];
  /** True if the detailed live map lookup succeeded; false if only the shipped coarse grid was used. */
  detailedMap: boolean;
  /** Dated rock units found at the point (any map scale). */
  mapUnits: number;
  fossilSites: number;
  /** Where the place lay at each mass extinction; empty if ancient positions could not be worked out. */
  extinctions: PlaceThen[];
  /** The tectonic events whose published extent covers the place, oldest last. */
  tectonics: TectonicEvent[];
  /** What the globe needs: the ancient maps and the first plate model. Null if they could not be loaded. */
  globe: { dem: PaleoDem; model: PlateModel } | null;
}

function paleoFor(models: PlateModel[], dem: PaleoDem, p: LatLng): (Paleo | null)[] {
  const primary = models[0]!;
  const appears = crustAppears(primary, p);
  return CHAPTERS.map((c) => {
    if (c.old > RECONSTRUCTION_LIMIT) return null;
    if (appears === null) return { status: 'not-reconstructable', lats: [], terrain: [] };
    const middle = (c.old + c.young) / 2;
    let steps = primary.times.filter((t) => t > c.young && t <= c.old);
    if (steps.length === 0) steps = [primary.times.reduce((best, t) => (Math.abs(t - middle) < Math.abs(best - middle) ? t : best))];
    const terrain = steps.flatMap((age) => {
      const at = reconstruct(primary, p, age);
      return at ? [{ age, ...terrainAt(dem, age, at) }] : [];
    });
    if (terrain.length === 0) return { status: 'no-crust-yet', crustAppears: appears, lats: [], terrain: [] };
    const lats = models.flatMap((m) => {
      const at = reconstruct(m, p, middle);
      return at ? [{ model: m.model, lat: at.lat }] : [];
    });
    return { status: 'ok', lats, terrain };
  });
}

/**
 * `liveMapUnits` is the one live call (Macrostrat's detailed map lookup). If it
 * fails, the coarse grid shipped with the site is used instead. `events` is the
 * list of major events to draw on (the caller decides whether drafts are included).
 */
export async function explore(read: ReadData, point: LatLng, liveMapUnits: (p: LatLng) => Promise<ApiMapUnit[]>, events: MajorEvent[]): Promise<Exploration> {
  const notices: string[] = [];
  const sources: Source[] = [];
  const units: RockUnit[] = [];
  let sites: FossilSite[] = [];
  let detailedMap = false;
  let column: string | null = null;
  let columnLayers: ColumnLayer[] = [];

  const [rock, col, fossils, plates, dem, province] = await Promise.allSettled([
    (async () => {
      const defs = await loadDefs(read);
      try {
        const live = unitsFromApi(await liveMapUnits(point), defs);
        detailedMap = true;
        return live;
      } catch {
        notices.push('The detailed geological map service (Macrostrat) could not be reached, so rock units come from coarser world and continental maps.');
        return unitsFromGrid(read, point, defs);
      }
    })(),
    loadColumn(read, point),
    loadFossilSites(read, point),
    Promise.all(PLATE_MODELS.map((m) => loadPlateModel(read, m.id))),
    loadPaleoDem(read),
    provinceAt(read, point),
  ]);

  if (rock.status === 'fulfilled') {
    units.push(...rock.value.units);
    sources.push(...rock.value.sources);
  } else notices.push('Rock units could not be loaded.');

  if (col.status === 'fulfilled') {
    column = col.value.column;
    columnLayers = col.value.layers;
    units.push(...col.value.units);
    sources.push(...col.value.sources);
  } else notices.push('The regional rock column could not be loaded.');

  if (fossils.status === 'fulfilled') {
    sites = fossils.value.sites;
    if (sites.length > 0) {
      sources.push({
        key: 'pbdb',
        text: `The Paleobiology Database: ${sites.length} fossil ${sites.length === 1 ? 'site' : 'sites'} within 100 km (data as of ${fossils.value.built})`,
        url: 'https://paleobiodb.org',
      });
    }
  } else notices.push('Fossil sites could not be loaded.');

  let paleo: (Paleo | null)[] = CHAPTERS.map(() => null);
  let extinctions: PlaceThen[] = [];
  let globe: Exploration['globe'] = null;
  if (plates.status === 'fulfilled' && dem.status === 'fulfilled') {
    paleo = paleoFor(plates.value, dem.value, point);
    extinctions = placeAtExtinctions(plates.value[0]!, dem.value, point);
    globe = { dem: dem.value, model: plates.value[0]! };
    sources.push(
      { key: 'paleodem', text: `${dem.value.source} These maps are reconstructions on a grid of about 100 km and are uneven in places, so the regional picture is approximate.`, url: 'https://doi.org/10.5281/zenodo.5460860' },
      { key: 'plates', text: `Plate models, via the GPlates Web Service: ${PLATE_MODELS.map((m) => m.label).join('; ')}`, url: 'https://gws.gplates.org' },
    );
  } else notices.push('Ancient positions and maps could not be loaded, so there is no regional picture.');

  // Without the province map, the events outlined by hand are still found.
  if (province.status === 'rejected') notices.push('The map of geological provinces could not be loaded, so some mountain-building and rifting events may be missing.');
  const tectonics = tectonicsAt(TECTONIC_EVENTS, point, province.status === 'fulfilled' ? (province.value?.number ?? null) : null).sort((a, b) => a.old - b.old);
  if (tectonics.length > 0) sources.push(PROVINCE_SOURCE);

  const timeline = matchTimeline(units, sites, paleo, eventsAt(events, point), tectonics);
  for (const e of new Set(timeline.flatMap((c) => c.events))) sources.push({ key: `event:${e.name}`, text: `${e.name}: ${e.source}` });
  return { point, timeline, sources, notices, column, layers: markHere(columnLayers, units), detailedMap, mapUnits: units.filter((u) => u.origin === 'here').length, fossilSites: sites.length, extinctions, tectonics, globe };
}
