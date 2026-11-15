import { describe, expect, it } from 'vitest';
import { provinceAt } from '../src/data/provinces';
import { RIFTS_AND_OCEANS } from '../src/match/events-all';
import { tectonicsAt } from '../src/match/tectonics';
import { nodeRead } from './helpers';

// The same rules as tests/caveats.test.ts: text for visitors, not notes to an editor.
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

// Real places, with the events each must and must not be given. The "must not" places
// lie well inland of a margin, on a different margin, or just outside a rift.
const PLACES: [name: string, lat: number, lng: number, has: string[], not: string[]][] = [
  ['Duluth, USA', 46.79, -92.1, ['midcontinent-rift'], []],
  ['Thunder Bay, Canada', 48.38, -89.25, ['midcontinent-rift'], []],
  ['Houghton, USA', 47.12, -88.57, ['midcontinent-rift'], []],
  ['Chicago, USA', 41.88, -87.63, [], ['midcontinent-rift']],
  ['Winnipeg, Canada', 49.9, -97.14, [], ['midcontinent-rift']],
  ['Corner Brook, Canada', 48.95, -57.95, ['iapetus-opening'], ['central-atlantic']],
  ['Burlington, USA', 44.48, -73.21, ['iapetus-opening'], []],
  ['Luray, USA', 38.66, -78.46, ['iapetus-opening'], ['central-atlantic']],
  ['Boston, USA', 42.36, -71.06, [], ['iapetus-opening', 'central-atlantic']],
  ['Pittsburgh, USA', 40.44, -80.0, [], ['iapetus-opening', 'central-atlantic']],
  ['Newark, USA', 40.73, -74.17, ['central-atlantic'], ['iapetus-opening']],
  ['Hartford, USA', 41.76, -72.68, ['central-atlantic'], ['iapetus-opening']],
  ['Gettysburg, USA', 39.83, -77.23, ['central-atlantic'], ['iapetus-opening']],
  ['Durham, USA', 35.99, -78.9, ['central-atlantic'], []],
  ['Halifax, Canada', 44.65, -63.57, ['central-atlantic'], []],
  ['Dakar, Senegal', 14.7, -17.45, ['central-atlantic'], ['south-atlantic']],
  ['Argana, Morocco', 30.78, -9.12, ['central-atlantic'], []],
  ['Marrakech, Morocco', 31.63, -8.0, [], ['central-atlantic']],
  ['Philadelphia, USA', 39.95, -75.17, [], ['central-atlantic']],
  ['Albany, USA', 42.65, -73.75, [], ['central-atlantic', 'iapetus-opening']],
  ['Houston, USA', 29.76, -95.37, ['gulf-of-mexico'], []],
  ['New Orleans, USA', 29.95, -90.07, ['gulf-of-mexico'], []],
  ['Shreveport, USA', 32.5, -93.75, ['gulf-of-mexico'], []],
  ['Tampa, USA', 27.95, -82.46, ['gulf-of-mexico'], ['central-atlantic']],
  ['Mérida, Mexico', 20.97, -89.62, ['gulf-of-mexico'], []],
  ['Tampico, Mexico', 22.25, -97.87, ['gulf-of-mexico'], []],
  ['Dallas, USA', 32.78, -96.8, [], ['gulf-of-mexico']],
  ['Atlanta, USA', 33.75, -84.39, [], ['gulf-of-mexico', 'central-atlantic']],
  ['Jacksonville, USA', 30.33, -81.66, [], ['gulf-of-mexico']],
  ['Mexico City, Mexico', 19.43, -99.13, [], ['gulf-of-mexico', 'gulf-of-california']],
  ['Perth, Australia', -31.95, 115.86, ['india-leaves-antarctica-australia'], ['australia-leaves-antarctica']],
  ['Geraldton, Australia', -28.77, 114.61, ['india-leaves-antarctica-australia'], []],
  ['Visakhapatnam, India', 17.69, 83.22, ['india-leaves-antarctica-australia'], []],
  ['Chennai, India', 13.08, 80.27, ['india-leaves-antarctica-australia'], []],
  ['Cuttack, India', 20.46, 85.88, ['india-leaves-antarctica-australia'], []],
  ['Hyderabad, India', 17.38, 78.49, [], ['india-leaves-antarctica-australia']],
  ['Kalgoorlie, Australia', -30.75, 121.47, [], ['india-leaves-antarctica-australia', 'australia-leaves-antarctica']],
  ['Northam, Australia', -31.65, 116.67, [], ['india-leaves-antarctica-australia']],
  ['Montevideo, Uruguay', -34.9, -56.16, ['south-atlantic'], []],
  ['Rio de Janeiro, Brazil', -22.9, -43.2, ['south-atlantic'], []],
  ['Santos, Brazil', -23.96, -46.33, ['south-atlantic'], []],
  ['Salvador, Brazil', -12.97, -38.5, ['south-atlantic'], []],
  ['Recife, Brazil', -8.05, -34.9, ['south-atlantic'], []],
  ['Fortaleza, Brazil', -3.73, -38.52, ['south-atlantic'], []],
  ['Luanda, Angola', -8.84, 13.23, ['south-atlantic'], []],
  ['Libreville, Gabon', 0.39, 9.45, ['south-atlantic'], []],
  ['Lagos, Nigeria', 6.45, 3.39, ['south-atlantic'], []],
  ['Walvis Bay, Namibia', -22.96, 14.5, ['south-atlantic'], []],
  ['Cape Town, South Africa', -33.92, 18.42, ['south-atlantic'], []],
  ['São Paulo, Brazil', -23.55, -46.63, [], ['south-atlantic']],
  ['Brasília, Brazil', -15.79, -47.88, [], ['south-atlantic']],
  ['Windhoek, Namibia', -22.56, 17.08, [], ['south-atlantic']],
  ['Kinshasa, DR Congo', -4.32, 15.31, [], ['south-atlantic', 'east-african-rift']],
  ['Bilbao, Spain', 43.26, -2.93, ['bay-of-biscay'], ['western-mediterranean']],
  ['Lisbon, Portugal', 38.72, -9.14, ['bay-of-biscay'], []],
  ['Pau, France', 43.3, -0.37, ['bay-of-biscay'], []],
  ['Madrid, Spain', 40.42, -3.7, [], ['bay-of-biscay', 'western-mediterranean']],
  ['Toulouse, France', 43.6, 1.44, [], ['bay-of-biscay', 'western-mediterranean']],
  ['Bordeaux, France', 44.84, -0.58, [], ['bay-of-biscay']],
  ['Portree, UK', 57.41, -6.19, ['north-east-atlantic'], []],
  ['Tobermory, UK', 56.62, -6.07, ['north-east-atlantic'], []],
  ['Belfast, UK', 54.6, -5.93, ['north-east-atlantic'], []],
  ['Tórshavn, Faroe Islands', 62.01, -6.77, ['north-east-atlantic'], []],
  ['Edinburgh, UK', 55.95, -3.19, [], ['north-east-atlantic']],
  ['Dublin, Ireland', 53.35, -6.26, [], ['north-east-atlantic']],
  ['Bergen, Norway', 60.39, 5.32, [], ['north-east-atlantic']],
  ['Apollo Bay, Australia', -38.76, 143.67, ['australia-leaves-antarctica'], ['tasman-sea']],
  ['Warrnambool, Australia', -38.38, 142.48, ['australia-leaves-antarctica'], []],
  ['Sale, Australia', -38.1, 147.07, ['australia-leaves-antarctica'], []],
  ['Ballarat, Australia', -37.56, 143.85, [], ['australia-leaves-antarctica']],
  ['Canberra, Australia', -35.28, 149.13, [], ['australia-leaves-antarctica', 'tasman-sea']],
  ['Sydney, Australia', -33.87, 151.21, ['tasman-sea'], []],
  ['Brisbane, Australia', -27.47, 153.03, ['tasman-sea'], []],
  ['Greymouth, New Zealand', -42.45, 171.21, ['tasman-sea'], []],
  ['Christchurch, New Zealand', -43.53, 172.64, [], ['tasman-sea']],
  ['Freiburg, Germany', 47.99, 7.85, ['european-cenozoic-rift'], []],
  ['Strasbourg, France', 48.57, 7.75, ['european-cenozoic-rift'], []],
  ['Frankfurt, Germany', 50.11, 8.68, ['european-cenozoic-rift'], []],
  ['Cologne, Germany', 50.94, 6.96, ['european-cenozoic-rift'], []],
  ['Clermont-Ferrand, France', 45.78, 3.09, ['european-cenozoic-rift'], []],
  ['Stuttgart, Germany', 48.78, 9.18, [], ['european-cenozoic-rift']],
  ['Munich, Germany', 48.14, 11.58, [], ['european-cenozoic-rift']],
  ['Paris, France', 48.86, 2.35, [], ['european-cenozoic-rift']],
  ['Prague, Czechia', 50.08, 14.44, [], ['european-cenozoic-rift']],
  ['Hong Kong, China', 22.32, 114.17, ['south-china-sea'], []],
  ['Haikou, China', 20.04, 110.34, ['south-china-sea'], []],
  ['Shantou, China', 23.35, 116.68, ['south-china-sea'], []],
  ['Guilin, China', 25.27, 110.29, [], ['south-china-sea']],
  ['Nanning, China', 22.82, 108.32, [], ['south-china-sea']],
  ['Niigata, Japan', 37.92, 139.04, ['sea-of-japan'], []],
  ['Akita, Japan', 39.72, 140.1, ['sea-of-japan'], []],
  ['Kanazawa, Japan', 36.56, 136.65, ['sea-of-japan'], []],
  ['Pohang, South Korea', 36.02, 129.34, ['sea-of-japan'], []],
  ['Tokyo, Japan', 35.68, 139.69, [], ['sea-of-japan']],
  ['Sendai, Japan', 38.27, 140.87, [], ['sea-of-japan']],
  ['Seoul, South Korea', 37.57, 126.98, [], ['sea-of-japan']],
  ['Marseille, France', 43.3, 5.37, ['western-mediterranean'], []],
  ['Barcelona, Spain', 41.39, 2.17, ['western-mediterranean'], ['bay-of-biscay']],
  ['Cagliari, Italy', 39.22, 9.12, ['western-mediterranean'], []],
  ['Rome, Italy', 41.9, 12.5, ['western-mediterranean'], []],
  ['Palma, Spain', 39.57, 2.65, ['western-mediterranean'], []],
  ['Málaga, Spain', 36.72, -4.42, ['western-mediterranean'], []],
  ['Milan, Italy', 45.46, 9.19, [], ['western-mediterranean']],
  ['Bari, Italy', 41.12, 16.87, [], ['western-mediterranean']],
  ['Lyon, France', 45.76, 4.84, [], ['western-mediterranean', 'european-cenozoic-rift']],
  ['Jeddah, Saudi Arabia', 21.49, 39.19, ['red-sea-gulf-of-aden'], []],
  ['Hurghada, Egypt', 27.26, 33.81, ['red-sea-gulf-of-aden'], []],
  ['Port Sudan, Sudan', 19.62, 37.22, ['red-sea-gulf-of-aden'], []],
  ['Aden, Yemen', 12.79, 45.02, ['red-sea-gulf-of-aden'], []],
  ['Berbera, Somalia', 10.44, 45.01, ['red-sea-gulf-of-aden'], []],
  ['Salalah, Oman', 17.02, 54.09, ['red-sea-gulf-of-aden'], []],
  ['Djibouti, Djibouti', 11.59, 43.15, ['red-sea-gulf-of-aden', 'east-african-rift'], []],
  ['Riyadh, Saudi Arabia', 24.71, 46.68, [], ['red-sea-gulf-of-aden']],
  ['Cairo, Egypt', 30.04, 31.24, [], ['red-sea-gulf-of-aden']],
  ['Khartoum, Sudan', 15.5, 32.56, [], ['red-sea-gulf-of-aden', 'east-african-rift']],
  ['Nairobi, Kenya', -1.29, 36.82, ['east-african-rift'], []],
  ['Addis Ababa, Ethiopia', 9.03, 38.74, ['east-african-rift'], ['red-sea-gulf-of-aden']],
  ['Naivasha, Kenya', -0.72, 36.43, ['east-african-rift'], []],
  ['Arusha, Tanzania', -3.37, 36.68, ['east-african-rift'], []],
  ['Goma, DR Congo', -1.68, 29.22, ['east-african-rift'], []],
  ['Mangochi, Malawi', -14.48, 35.26, ['east-african-rift'], []],
  ['Kampala, Uganda', 0.35, 32.58, [], ['east-african-rift']],
  ['Dar es Salaam, Tanzania', -6.79, 39.21, [], ['east-african-rift']],
  ['Lusaka, Zambia', -15.39, 28.32, [], ['east-african-rift']],
  ['Reno, USA', 39.53, -119.81, ['basin-and-range'], []],
  ['Las Vegas, USA', 36.17, -115.14, ['basin-and-range'], []],
  ['Salt Lake City, USA', 40.76, -111.89, ['basin-and-range'], []],
  ['Tucson, USA', 32.22, -110.97, ['basin-and-range'], ['gulf-of-california']],
  ['Denver, USA', 39.74, -104.99, [], ['basin-and-range', 'rio-grande-rift']],
  ['Flagstaff, USA', 35.2, -111.65, [], ['basin-and-range', 'rio-grande-rift']],
  ['Sacramento, USA', 38.58, -121.49, [], ['basin-and-range']],
  ['Albuquerque, USA', 35.08, -106.65, ['rio-grande-rift'], ['basin-and-range']],
  ['El Paso, USA', 31.76, -106.49, ['rio-grande-rift'], []],
  ['Taos, USA', 36.41, -105.57, ['rio-grande-rift'], []],
  ['Leadville, USA', 39.25, -106.29, ['rio-grande-rift'], []],
  ['Amarillo, USA', 35.22, -101.83, [], ['rio-grande-rift']],
  ['Gallup, USA', 35.53, -108.74, [], ['rio-grande-rift']],
  ['La Paz, Mexico', 24.14, -110.31, ['gulf-of-california'], []],
  ['Loreto, Mexico', 26.01, -111.35, ['gulf-of-california'], []],
  ['Mexicali, Mexico', 32.62, -115.45, ['gulf-of-california'], []],
  ['Guaymas, Mexico', 27.92, -110.9, ['gulf-of-california'], []],
  ['San Diego, USA', 32.72, -117.16, [], ['gulf-of-california', 'basin-and-range']],
  ['Ensenada, Mexico', 31.87, -116.6, [], ['gulf-of-california']],
  ['Durango, Mexico', 24.03, -104.65, [], ['gulf-of-california']],
  ['Listvyanka, Russia', 51.85, 104.87, ['baikal-rift'], []],
  ['Severobaikalsk, Russia', 55.63, 109.32, ['baikal-rift'], []],
  ['Barguzin, Russia', 53.62, 109.63, ['baikal-rift'], []],
  ['Irkutsk, Russia', 52.29, 104.3, [], ['baikal-rift']],
  ['Chita, Russia', 52.03, 113.5, [], ['baikal-rift']],
  ['Ulaanbaatar, Mongolia', 47.92, 106.92, [], ['baikal-rift']],
  // Iceland is young ocean crust, not rifted continent: no event.
  ['Reykjavík, Iceland', 64.15, -21.94, [], ['north-east-atlantic']],
];

describe('rifts and the opening of oceans', () => {
  it('every entry is complete, dated, sourced and written for visitors', () => {
    const bad: string[] = [];
    const ids = RIFTS_AND_OCEANS.map((e) => e.id);
    for (const e of RIFTS_AND_OCEANS) {
      if (!/^[a-z]+(-[a-z]+)*$/.test(e.id)) bad.push(`${e.id}: id is not kebab case`);
      if (ids.filter((id) => id === e.id).length !== 1) bad.push(`${e.id}: id is not unique`);
      if (e.kind !== 'rift' && e.kind !== 'ocean') bad.push(`${e.id}: kind ${e.kind}`);
      if (!(e.old > e.young && e.young >= 0)) bad.push(`${e.id}: dates ${e.old} to ${e.young}`);
      if (e.caveats.length < 2 || e.caveats.length > 4) bad.push(`${e.id}: ${e.caveats.length} caveats`);
      if (e.sources.length < 2 || e.sources.length > 4) bad.push(`${e.id}: ${e.sources.length} sources`);
      if (e.provinces.length + e.boxes.length === 0) bad.push(`${e.id}: no region`);
      for (const n of e.provinces) if (!Number.isInteger(n) || n < 1 || n > 921) bad.push(`${e.id}: province ${n}`);
      for (const [south, west, north, east] of e.boxes) {
        if (!(south < north && west < east && south >= -90 && north <= 90 && west >= -180 && east <= 180)) bad.push(`${e.id}: box ${[south, west, north, east]}`);
        // A box is a strip along a coast or a rift, never a block of a continent.
        const sides = [north - south, east - west];
        if (Math.min(...sides) > 2.8 || Math.max(...sides) > 5.2) bad.push(`${e.id}: box too large ${[south, west, north, east]}`);
      }
      // An entry that uses boxes says so.
      if (e.boxes.length > 0 && !e.caveats.some((c) => /rough box/.test(c))) bad.push(`${e.id}: has boxes but no caveat about them`);
      if (e.vetted) bad.push(`${e.id}: marked as reviewed`);
      for (const text of [e.plain, ...e.caveats]) for (const p of problems(text)) bad.push(`${e.id}: ${p}: ${text.slice(0, 70)}`);
      if (/\d\s?Ma\b/.test(e.plain)) bad.push(`${e.id}: shorthand for a date`);
      for (const s of e.sources) if (!/\(\d{4}\)/.test(s) || /UNVERIFIED|from memory/i.test(s)) bad.push(`${e.id}: source ${s.slice(0, 50)}`);
    }
    expect(bad).toEqual([]);
  });

  it('gives real places the events of their region, and no others', async () => {
    const ids = new Set(RIFTS_AND_OCEANS.map((e) => e.id));
    const bad: string[] = [];
    const seen = new Set<string>();
    for (const [name, lat, lng, has, not] of PLACES) {
      const p = { lat, lng };
      const province = await provinceAt(nodeRead, p);
      const found = tectonicsAt(RIFTS_AND_OCEANS, p, province?.number ?? null).map((e) => e.id);
      for (const id of [...has, ...not]) if (!ids.has(id)) bad.push(`${name}: unknown event ${id}`);
      for (const id of has) {
        seen.add(id);
        if (!found.includes(id)) bad.push(`${name}: should have ${id} (province ${province?.number ?? 'none'} ${province?.name ?? ''})`);
      }
      for (const id of not) if (found.includes(id)) bad.push(`${name}: should not have ${id} (province ${province?.number ?? 'none'} ${province?.name ?? ''})`);
      // Nothing beyond what the row lists: a place with an empty list gets no event at all.
      for (const id of found) if (!has.includes(id)) bad.push(`${name}: unexpected ${id}`);
    }
    // Every event is probed from inside at least three times.
    for (const id of ids) {
      const inside = PLACES.filter(([, , , has]) => has.includes(id)).length;
      if (inside < 3) bad.push(`${id}: only ${inside} places inside`);
      const outside = PLACES.filter(([, , , , not]) => not.includes(id)).length;
      if (outside < 2) bad.push(`${id}: only ${outside} places outside`);
    }
    expect(bad).toEqual([]);
  });
});
