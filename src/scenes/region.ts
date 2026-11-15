// Which present-day landmass a place is on. Used to keep plants and animals to
// the continents they are known from (no kangaroos in Europe). The boundaries
// are rough boxes, a stopgap that is good enough away from the edges.

import type { Region } from './permit';

export const REGION_NAME: Record<Region, string> = {
  'north-america': 'North America',
  'south-america': 'South America',
  europe: 'Europe',
  africa: 'Africa and Arabia',
  asia: 'Asia',
  india: 'India',
  australia: 'Australia and New Guinea',
  'new-zealand': 'New Zealand',
  antarctica: 'Antarctica',
};

export function regionOf(lat: number, lng: number): Region {
  if (lat < -60) return 'antarctica';
  // New Zealand had no land mammals but bats, and birds found nowhere else, so it stands apart from Australia.
  if (lat < -33 && lat > -53 && lng > 165) return 'new-zealand';
  // Australia and New Guinea. Java, Borneo and the islands as far east as Timor count as Asia.
  if ((lat < -10 && lng > 110) || (lat < 0 && lng > 129)) return 'australia';
  if (lng < -25 || (lat > 67 && lng < -12)) {
    // The Americas, with Greenland. Central America and the Caribbean count as north.
    const south = lat < 12.5 && lng > -81.5 && !(lat > 7 && lng < -77);
    return south ? 'south-america' : 'north-america';
  }
  // The Indian subcontinent, south of the Himalaya
  if (lat > 5 && lat < 30 && lng > 68 && lng < 92) return 'india';
  // Africa with Madagascar, and Arabia south of 30° north
  if (lng < 35 && lat < 35.5) return 'africa';
  if (lng >= 35 && lng < 60 && lat < 30) return 'africa';
  if (lng < 60 && lat >= 35.5) return 'europe';
  return 'asia';
}
