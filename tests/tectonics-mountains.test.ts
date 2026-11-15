import { describe, expect, it } from 'vitest';
import { highestNear } from '../src/data/heights';
import { provinceAt } from '../src/data/provinces';
import { HIGH_GROUND } from '../src/match/match';
import { MOUNTAIN_BUILDING } from '../src/match/events-all';
import { tectonicsAt } from '../src/match/tectonics';
import { nodeRead } from './helpers';

// The same wording rules as tests/caveats.test.ts, applied to everything a visitor reads here.
const NOT_FOR_VISITORS: [RegExp, string][] = [
  [/\b(I|I'm|I've|my|me|we|our|us)\b/, 'first person'],
  [/\b(the table|the brief|the owner|vetting|vetted|whitelist|worth a check|check or cut)\b/i, 'talk about how the text was made'],
  [/(^|[.?!] )(Check|Confirm|Verify)\b/, 'an instruction to an editor'],
  [
    /(colour|grey|armour|centre|metre|favour|behaviour|mould|plough|sulphur|fibre|theatre|defence|travell|programme|catalogue|analyse)|(recognis|fossilis|organis|specialis|characteris|criticis|generalis|civilis|colonis|emphasis)(e|ed|es|ing|ation)\b/i,
    'British spelling',
  ],
  [/—|\bMa\b|\bmya\b|TODO|…/, 'a dash, shorthand or something unfinished'],
  [/as high as|\bsnow|\d\s?(m|km|meters|kilometers|feet) (high|tall)/i, 'a stated height'],
];

function problems(text: string): string[] {
  const found = NOT_FOR_VISITORS.filter(([pattern]) => pattern.test(text)).map(([, what]) => what);
  if (text.length < 25) found.push('too short to stand alone');
  if (!/[.?!"”)]$/.test(text)) found.push('does not end as a sentence');
  return found;
}

// Real places, each looked up on the province map while the regions were drawn.
// `has`: events the place must get. `not`: events it must not get.
const PLACES: [name: string, lat: number, lng: number, has: string[], not: string[]][] = [
  // The Appalachians: three events, told apart where the map allows.
  ['Greenville, South Carolina', 34.85, -82.39, ['taconic', 'acadian', 'alleghanian'], ['grenville']],
  ['Asheville, North Carolina', 35.6, -82.55, ['taconic', 'acadian', 'alleghanian'], []],
  ['Knoxville, Tennessee (folded foreland)', 35.96, -83.92, ['alleghanian'], ['taconic', 'acadian']],
  ['Montpelier, Vermont', 44.26, -72.58, ['taconic', 'acadian'], ['alleghanian']],
  ['Boston, Massachusetts', 42.36, -71.06, ['acadian'], ['taconic', 'alleghanian']],
  ['Providence, Rhode Island', 41.82, -71.41, ['acadian', 'alleghanian'], ['taconic']],
  ['Halifax, Nova Scotia', 44.65, -63.58, ['acadian'], ['taconic', 'alleghanian']],
  ['Corner Brook, Newfoundland', 48.95, -57.95, ['taconic'], ['acadian', 'alleghanian']],
  ['Pittsburgh, Pennsylvania (plateau)', 40.44, -80.0, [], ['taconic', 'acadian', 'alleghanian', 'grenville']],
  ['Charleston, South Carolina (coastal plain)', 32.78, -79.93, [], ['taconic', 'acadian', 'alleghanian']],
  // Grenville, Trans-Hudson.
  ['Ottawa, Ontario', 45.42, -75.7, ['grenville'], ['taconic']],
  ['Huntsville, Ontario', 45.33, -79.22, ['grenville'], []],
  ['Lake Placid, New York', 44.28, -73.98, ['grenville'], ['acadian']],
  ['Llano, Texas', 30.75, -98.68, ['grenville'], []],
  ['Toronto, Ontario', 43.65, -79.38, [], ['grenville']],
  ['Sudbury, Ontario (beyond the Grenville Front)', 46.49, -81.0, [], ['grenville']],
  ['Austin, Texas', 30.27, -97.74, [], ['grenville']],
  ['Flin Flon, Manitoba', 54.77, -101.88, ['trans-hudson'], []],
  ['Iqaluit, Nunavut', 63.75, -68.52, ['trans-hudson'], []],
  ['Winnipeg, Manitoba', 49.9, -97.14, [], ['trans-hudson']],
  ['Yellowknife, Northwest Territories', 62.45, -114.37, [], ['trans-hudson']],
  // The western Cordillera.
  ['Banff, Alberta', 51.18, -115.57, ['sevier'], ['laramide', 'cordilleran-arc']],
  ['Salt Lake City, Utah', 40.76, -111.89, ['sevier'], ['cordilleran-arc']],
  ['Missoula, Montana', 46.87, -113.99, ['sevier'], ['laramide']],
  ['Calgary, Alberta (plains)', 51.05, -114.07, [], ['sevier', 'laramide']],
  ['Las Vegas, Nevada', 36.17, -115.14, [], ['sevier', 'laramide']],
  ['Reno, Nevada', 39.53, -119.81, [], ['sevier', 'cordilleran-arc']],
  ['Lander, Wyoming', 42.83, -108.73, ['laramide'], ['sevier', 'ancestral-rockies']],
  ['Aspen, Colorado', 39.19, -106.82, ['laramide'], ['sevier', 'ancestral-rockies']],
  ['Black Elk Peak, Black Hills', 43.87, -103.53, ['laramide', 'trans-hudson'], []],
  ['Rapid City, South Dakota', 44.08, -103.23, [], ['laramide', 'trans-hudson']],
  ['Denver, Colorado (plains)', 39.74, -104.99, [], ['laramide', 'ancestral-rockies']],
  // The Ancestral Rocky Mountains: the old uplifts, and the basins and plains beside them.
  ['Estes Park, Colorado', 40.38, -105.52, ['ancestral-rockies', 'laramide'], []],
  ['Georgetown, Colorado', 39.71, -105.7, ['ancestral-rockies', 'laramide'], []],
  ['Pikes Peak, Colorado', 38.84, -105.04, ['ancestral-rockies'], []],
  ['Colorado National Monument', 39.04, -108.69, ['ancestral-rockies'], []],
  ['Black Canyon of the Gunnison', 38.57, -107.72, ['ancestral-rockies'], []],
  ['Divide Road, Uncompahgre Plateau', 38.65, -108.4, ['ancestral-rockies'], []],
  ['Nucla, Colorado (basin side)', 38.27, -108.55, [], ['ancestral-rockies']],
  ['Gateway, Colorado (basin side)', 38.68, -108.98, [], ['ancestral-rockies']],
  ['Vail, Colorado (basin)', 39.64, -106.37, [], ['ancestral-rockies']],
  ['Glenwood Springs, Colorado (basin)', 39.55, -107.32, [], ['ancestral-rockies']],
  ['Moab, Utah (basin)', 38.57, -109.55, [], ['ancestral-rockies']],
  ['Manitou Springs, Colorado (basin edge)', 38.86, -104.92, [], ['ancestral-rockies']],
  ['Boulder, Colorado (plains)', 40.01, -105.27, [], ['ancestral-rockies']],
  ['Durango, Colorado (basin)', 37.28, -107.88, [], ['ancestral-rockies']],
  ['Casper, Wyoming', 42.85, -106.31, [], ['laramide']],
  ['Flagstaff, Arizona', 35.2, -111.65, [], ['laramide', 'sevier']],
  ['Yosemite Valley, California', 37.75, -119.59, ['cordilleran-arc'], ['sevier']],
  ['McCall, Idaho', 44.91, -116.1, ['cordilleran-arc'], []],
  ['Sacramento, California', 38.58, -121.49, [], ['cordilleran-arc']],
  ['Seattle, Washington', 47.61, -122.33, [], ['cordilleran-arc']],
  // South America.
  ['Cusco, Peru', -13.53, -71.97, ['andean'], []],
  ['Quito, Ecuador', -0.18, -78.47, ['andean'], []],
  ['Santiago, Chile', -33.45, -70.67, ['andean'], []],
  ['Ushuaia, Argentina', -54.8, -68.3, ['andean'], []],
  ['Buenos Aires, Argentina', -34.6, -58.38, [], ['andean', 'cape']],
  ['Iquitos, Peru', -3.75, -73.25, [], ['andean']],
  ['Santa Cruz de la Sierra, Bolivia', -17.78, -63.18, [], ['andean']],
  ['Sierra de la Ventana, Argentina', -38.14, -61.8, ['cape'], ['andean']],
  ['Bahía Blanca, Argentina', -38.72, -62.27, [], ['cape']],
  ['Neuquén, Argentina', -38.95, -68.06, [], ['cape']],
  // Europe.
  ['Zermatt, Switzerland', 46.02, 7.75, ['alpine'], ['variscan']],
  ['Innsbruck, Austria', 47.27, 11.39, ['alpine'], []],
  ['Bolzano, Italy (Southern Alps)', 46.5, 11.35, ['alpine'], []],
  ['Leoben, Austria', 47.38, 15.09, ['alpine'], []],
  ['Munich, Germany', 48.14, 11.58, [], ['alpine', 'variscan']],
  ['Milan, Italy', 45.46, 9.19, [], ['alpine']],
  ['Zurich, Switzerland', 47.37, 8.54, [], ['alpine']],
  ['Vienna, Austria', 48.21, 16.37, [], ['alpine']],
  ['Andorra la Vella', 42.51, 1.52, ['pyrenean'], ['alpine']],
  ['Oviedo, Spain', 43.36, -5.85, ['pyrenean'], []],
  ['Toulouse, France', 43.6, 1.44, [], ['pyrenean', 'variscan']],
  ['Zaragoza, Spain', 41.65, -0.89, [], ['pyrenean', 'variscan']],
  ['Prague, Czechia', 50.08, 14.44, ['variscan'], ['alpine']],
  ['Limoges, France', 45.83, 1.26, ['variscan'], []],
  ['Salamanca, Spain', 40.97, -5.66, ['variscan'], ['pyrenean']],
  ['Plymouth, England', 50.38, -4.14, ['variscan'], ['scandian']],
  ['Lisbon, Portugal', 38.72, -9.14, [], ['variscan']],
  ['London, England', 51.51, -0.13, [], ['variscan', 'scandian', 'grampian']],
  ['Inverness, Scotland', 57.48, -4.22, ['grampian', 'scandian'], []],
  ['Aberdeen, Scotland', 57.15, -2.09, ['grampian'], []],
  ['Pitlochry, Scotland', 56.7, -3.73, ['grampian'], []],
  ['Westport, Ireland', 53.8, -9.52, ['grampian'], []],
  ['Glasgow, Scotland', 55.86, -4.25, [], ['grampian']],
  ['Stornoway, Scotland (old foreland)', 58.21, -6.39, [], ['grampian']],
  ['Dublin, Ireland', 53.35, -6.26, [], ['grampian', 'scandian']],
  ['Bergen, Norway', 60.39, 5.32, ['scandian'], ['grampian']],
  ['Tromsø, Norway', 69.65, 18.96, ['scandian'], []],
  ['Longyearbyen, Svalbard', 78.22, 15.63, ['scandian'], []],
  ['Oslo, Norway', 59.91, 10.75, [], ['scandian', 'svecofennian']],
  ['Kiruna, Sweden (old shield)', 67.86, 20.23, [], ['scandian', 'svecofennian']],
  ['Stockholm, Sweden', 59.33, 18.07, ['svecofennian'], ['scandian']],
  ['Helsinki, Finland', 60.17, 24.94, ['svecofennian'], []],
  ['Tampere, Finland', 61.5, 23.76, ['svecofennian'], []],
  ['Kuopio, Finland (Karelian craton)', 62.89, 27.68, [], ['svecofennian']],
  // The Urals and Asia.
  ['Yekaterinburg, Russia', 56.84, 60.61, ['uralian'], ['central-asian']],
  ['Magnitogorsk, Russia', 53.41, 58.98, ['uralian'], []],
  ['Mount Narodnaya, Russia', 65.03, 60.12, ['uralian'], []],
  ['Perm, Russia (platform)', 58.01, 56.25, [], ['uralian']],
  ['Tyumen, Russia (West Siberian plain)', 57.15, 65.53, [], ['uralian', 'central-asian']],
  ['Almaty, Kazakhstan', 43.24, 76.89, ['central-asian'], ['himalayan']],
  ['Ulaanbaatar, Mongolia', 47.89, 106.91, ['central-asian'], []],
  ['Karaganda, Kazakhstan', 49.8, 73.1, ['central-asian'], []],
  ['Novosibirsk, Russia', 55.01, 82.93, [], ['central-asian']],
  ['Irkutsk, Russia (Siberian craton)', 52.29, 104.3, [], ['central-asian']],
  ['Beijing, China', 39.9, 116.41, [], ['central-asian', 'qinling-dabie']],
  ['Kathmandu, Nepal', 27.72, 85.32, ['himalayan'], []],
  ['Leh, Ladakh', 34.15, 77.58, ['himalayan'], []],
  ['Lhasa, Tibet', 29.65, 91.12, ['himalayan'], []],
  ['Delhi, India (plains)', 28.61, 77.21, [], ['himalayan']],
  ['Lahore, Pakistan (plains)', 31.55, 74.34, [], ['himalayan']],
  ['Chengdu, China (Sichuan Basin)', 30.57, 104.07, [], ['himalayan', 'qinling-dabie']],
  ['Lanzhou, China', 36.06, 103.83, [], ['himalayan']],
  ['Kashgar, China (Tarim Basin)', 39.47, 75.99, [], ['himalayan', 'central-asian']],
  ['Mount Taibai, Qinling', 33.95, 107.77, ['qinling-dabie'], ['himalayan']],
  ['Qingdao, China', 36.07, 120.38, ['qinling-dabie'], []],
  ['Yuexi, Dabie Mountains', 30.85, 116.36, ['qinling-dabie'], []],
  ["Xi'an, China (Wei plain)", 34.34, 108.94, [], ['qinling-dabie']],
  ['Wuhan, China', 30.59, 114.31, [], ['qinling-dabie']],
  ['Shiraz, Iran', 29.59, 52.58, ['zagros'], []],
  ['Kermanshah, Iran', 34.31, 47.07, ['zagros'], []],
  ['Isfahan, Iran', 32.65, 51.67, ['zagros'], []],
  ['Baghdad, Iraq (plain)', 33.31, 44.37, [], ['zagros', 'east-african']],
  ['Tehran, Iran', 35.69, 51.39, [], ['zagros']],
  ['Yushan, Taiwan', 23.47, 120.96, ['taiwan'], []],
  ['Hualien, Taiwan', 23.99, 121.6, ['taiwan'], []],
  ['Taitung, Taiwan', 22.76, 121.14, ['taiwan'], []],
  ['Taipei, Taiwan (basin)', 25.03, 121.57, [], ['taiwan']],
  ['Taichung, Taiwan (western plain)', 24.15, 120.67, [], ['taiwan']],
  ['Kaohsiung, Taiwan', 22.63, 120.3, [], ['taiwan']],
  // Africa, Arabia, India.
  ['Cape Town, South Africa', -33.92, 18.42, ['cape'], []],
  ['Oudtshoorn, South Africa', -33.59, 22.2, ['cape'], []],
  ['Port Elizabeth, South Africa', -33.96, 25.6, ['cape'], []],
  ['Beaufort West, South Africa (Karoo)', -32.35, 22.58, [], ['cape']],
  ['Kimberley, South Africa', -28.73, 24.76, [], ['cape']],
  ['Mecca, Saudi Arabia', 21.39, 39.86, ['east-african'], []],
  ['Asmara, Eritrea', 15.32, 38.93, ['east-african'], []],
  ['Antananarivo, Madagascar', -18.88, 47.51, ['east-african'], []],
  ['Madurai, India', 9.93, 78.12, ['east-african'], []],
  ['Kandy, Sri Lanka', 7.29, 80.63, ['east-african'], []],
  ['Riyadh, Saudi Arabia (platform)', 24.71, 46.68, [], ['east-african']],
  ['Dodoma, Tanzania (craton)', -6.16, 35.75, [], ['east-african']],
  ['Bengaluru, India (craton)', 12.97, 77.59, [], ['east-african']],
  ['Harare, Zimbabwe (craton)', -17.83, 31.05, [], ['east-african']],
  // Australasia.
  ['Mount Barker, Adelaide Hills', -35.07, 138.86, ['delamerian'], ['lachlan']],
  ['Queenstown, Tasmania', -42.08, 145.56, ['delamerian'], ['lachlan']],
  ['Broken Hill, New South Wales (older block)', -31.95, 141.45, [], ['delamerian', 'lachlan']],
  ['Whyalla, South Australia (Gawler craton)', -33.03, 137.56, [], ['delamerian']],
  ['Melbourne, Victoria', -37.81, 144.96, ['lachlan'], ['delamerian', 'new-england']],
  ['Canberra', -35.28, 149.13, ['lachlan'], ['new-england']],
  ['Hobart, Tasmania', -42.88, 147.33, ['lachlan'], ['delamerian']],
  ['Sydney, New South Wales (Sydney Basin)', -33.87, 151.21, [], ['lachlan', 'new-england']],
  ['Armidale, New South Wales', -30.51, 151.67, ['new-england'], ['lachlan']],
  ['Brisbane, Queensland', -27.47, 153.03, ['new-england'], []],
  ['Cairns, Queensland', -16.92, 145.77, [], ['new-england']],
  ['Aoraki / Mount Cook', -43.59, 170.14, ['kaikoura'], []],
  ['Queenstown, New Zealand', -45.03, 168.66, ['kaikoura'], []],
  ['Kaikōura, New Zealand', -42.4, 173.68, ['kaikoura'], []],
  ['Milford Sound, New Zealand', -44.67, 167.93, ['kaikoura'], []],
  ['Christchurch, New Zealand (plains)', -43.53, 172.64, [], ['kaikoura']],
  ['Dunedin, New Zealand', -45.87, 170.5, [], ['kaikoura']],
  ['Wellington, New Zealand', -41.29, 174.78, [], ['kaikoura']],
  ['Wamena, Papua', -4.1, 138.94, ['new-guinea'], []],
  ['Mount Hagen, Papua New Guinea', -5.86, 144.23, ['new-guinea'], []],
  ['Jayapura, Papua', -2.53, 140.72, ['new-guinea'], []],
  ['Port Moresby, Papua New Guinea', -9.44, 147.18, [], ['new-guinea']],
  ['Merauke, Papua (southern lowland)', -8.49, 140.4, [], ['new-guinea']],
];

describe('the mountain-building events', () => {
  it('each has sound dates, a region, caveats and sources', () => {
    const bad: string[] = [];
    const ids = MOUNTAIN_BUILDING.map((e) => e.id);
    for (const id of ids) if (ids.filter((other) => other === id).length > 1) bad.push(`${id}: id used more than once`);
    for (const e of MOUNTAIN_BUILDING) {
      if (!/^[a-z]+(-[a-z]+)*$/.test(e.id)) bad.push(`${e.id}: id is not kebab case`);
      if (e.kind !== 'mountains') bad.push(`${e.id}: kind is ${e.kind}`);
      if (!(e.old > e.young && e.young >= 0)) bad.push(`${e.id}: dates ${e.old} to ${e.young}`);
      if (e.caveats.length < 2 || e.caveats.length > 4) bad.push(`${e.id}: ${e.caveats.length} caveats`);
      if (e.sources.length < 2 || e.sources.length > 4) bad.push(`${e.id}: ${e.sources.length} sources`);
      if (e.provinces.length + e.boxes.length === 0) bad.push(`${e.id}: no region`);
      if (new Set(e.provinces).size !== e.provinces.length) bad.push(`${e.id}: a province listed twice`);
      for (const n of e.provinces) if (!Number.isInteger(n) || n < 1 || n > 921) bad.push(`${e.id}: province ${n}`);
      for (const [south, west, north, east] of e.boxes) {
        if (!(south < north && west < east && south >= -90 && north <= 90 && west >= -180 && east <= 180)) bad.push(`${e.id}: box [${south}, ${west}, ${north}, ${east}]`);
      }
      if (e.vetted) bad.push(`${e.id}: marked as reviewed`);
    }
    expect(bad).toEqual([]);
    expect(MOUNTAIN_BUILDING.length).toBe(29);
    // Held back until their dates are confirmed.
    expect(ids).not.toContain('brasiliano');
    expect(ids).not.toContain('sveconorwegian');
  });

  it('have names, texts and caveats written for visitors, with no stated height', () => {
    const bad: string[] = [];
    for (const e of MOUNTAIN_BUILDING) {
      for (const text of [e.plain, ...e.caveats]) for (const p of problems(text)) bad.push(`${e.id}: ${p}: ${text.slice(0, 70)}`);
      if (!/\babout\b/i.test(e.plain)) bad.push(`${e.id}: the text gives a date without "about"`);
      if (/—|…|\bMa\b/.test(e.name)) bad.push(`${e.id}: name`);
      for (const s of e.sources) if (!/\(\d{4}\)/.test(s) || /UNVERIFIED/i.test(s)) bad.push(`${e.id}: source: ${s.slice(0, 50)}`);
    }
    expect(bad).toEqual([]);
  });

  it('are shown at real places inside their regions and not at places outside', async () => {
    const known = new Set(MOUNTAIN_BUILDING.map((e) => e.id));
    const bad: string[] = [];
    for (const [name, lat, lng, has, not] of PLACES) {
      for (const id of [...has, ...not]) if (!known.has(id)) bad.push(`${name}: no event "${id}"`);
      const p = { lat, lng };
      const province = await provinceAt(nodeRead, p);
      const got = tectonicsAt(MOUNTAIN_BUILDING, p, province?.number ?? null).map((e) => e.id);
      for (const id of has) if (!got.includes(id)) bad.push(`${name}: should have ${id} (province ${province?.number} ${province?.name}; has ${got.join(', ') || 'none'})`);
      for (const id of not) if (got.includes(id)) bad.push(`${name}: should not have ${id} (province ${province?.number} ${province?.name})`);
    }
    expect(bad).toEqual([]);
    // Every event is probed from inside at least once.
    const probed = new Set(PLACES.flatMap(([, , , has]) => has));
    expect(MOUNTAIN_BUILDING.map((e) => e.id).filter((id) => !probed.has(id))).toEqual([]);
  });
});
describe('high ground near a spot, in the belts that are still rising', () => {
  // Towns in a range, and towns on the lowland that the same event's outline takes in or borders.
  const HIGH: [string, number, number][] = [
    ['Zermatt', 46.02, 7.75],
    ['Kathmandu', 27.7, 85.32],
    ['Cusco', -13.53, -71.97],
    ['Bogotá', 4.71, -74.07],
    ['Shiraz', 29.59, 52.58],
    ['Queenstown, New Zealand', -45.03, 168.66],
    ['Yushan, Taiwan', 23.47, 120.96],
    ['Mount Hagen, New Guinea', -5.86, 144.23],
  ];
  const LOW: [string, number, number][] = [
    ['Lima', -12.05, -77.04],
    ['Barranquilla', 10.97, -74.8],
    ['Maracaibo', 10.65, -71.65],
    ['Antofagasta', -23.65, -70.4],
    ['Delhi', 28.61, 77.21],
  ];

  it('tells the range from the lowland', async () => {
    for (const [name, lat, lng] of HIGH) expect(await highestNear(nodeRead, { lat, lng }), name).toBeGreaterThanOrEqual(HIGH_GROUND);
    for (const [name, lat, lng] of LOW) expect(await highestNear(nodeRead, { lat, lng }), name).toBeLessThan(HIGH_GROUND);
  });

  it('is not known away from those belts', async () => {
    expect(await highestNear(nodeRead, { lat: 39.74, lng: -104.99 })).toBeNull(); // Denver
    expect(await highestNear(nodeRead, { lat: 51.5, lng: -0.12 })).toBeNull(); // London
  });
});
