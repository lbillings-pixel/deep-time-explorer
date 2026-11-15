// A hand-made list of major geological events.
//
// An event never makes a claim on its own. It is used only where the geological
// map already shows matching rock at the point, but dates it so loosely that the
// rock cannot decide a chapter. The event then supplies the date. Example: the
// world map dates the basalt under Pune to "145 to 23 million years ago"; the
// Deccan Traps entry says that basalt erupted about 66 million years ago.
//
// Each event is shown with a caveat beside the evidence saying what its link to the spot rests on.
import type { LatLng } from '../geo/plates';
import type { EnvType } from './taxonomy';

export interface MajorEvent {
  name: string;
  /** Age range of the event, Ma. */
  old: number;
  young: number;
  /** Rough present-day extent: boxes of [south, west, north, east]. Generous on purpose; the rock at the point is the real test. */
  region: [south: number, west: number, north: number, east: number][];
  /** The loosely dated rock this event can date: 'volcanic' matches lava and ash. */
  rock: 'volcanic';
  /** The surface environment while the event lasted. */
  environment: EnvType;
  /** One or two plain sentences, shown to the visitor. */
  summary: string;
  source: string;
  vetted: boolean;
}

export const MAJOR_EVENTS: MajorEvent[] = [
  {
    name: 'Deccan Traps',
    old: 66.5,
    young: 65.5,
    region: [[14, 68, 26, 83]],
    rock: 'volcanic',
    environment: 'volcanic-land',
    summary:
      'One of the largest outpourings of lava on land in Earth history. Most of it erupted within about a million years, around the time of the mass extinction that ended the Cretaceous.',
    source: 'Schoene, B. et al. (2019) U-Pb constraints on pulsed eruption of the Deccan Traps across the end-Cretaceous mass extinction. Science 363, 862-866.',
    vetted: false,
  },
  {
    name: 'Siberian Traps',
    old: 252.5,
    young: 250.5,
    region: [[50, 60, 76, 116]],
    rock: 'volcanic',
    environment: 'volcanic-land',
    summary: 'A vast flood of lava across Siberia, erupted around the time of the mass extinction that ended the Permian, the most severe known.',
    source: "Burgess, S.D. and Bowring, S.A. (2015) High-precision geochronology confirms voluminous magmatism before, during, and after Earth's most severe extinction. Science Advances 1, e1500470.",
    vetted: false,
  },
  {
    name: 'Karoo flood basalts',
    old: 183.5,
    young: 181.5,
    region: [[-35, 14, -15, 36]],
    rock: 'volcanic',
    environment: 'volcanic-land',
    summary: 'Lava flows that buried much of southern Africa in the Early Jurassic, as the southern supercontinent Gondwana began to break apart.',
    source: 'Svensen, H. et al. (2012) Rapid magma emplacement in the Karoo Large Igneous Province. Earth and Planetary Science Letters 325-326, 1-9.',
    vetted: false,
  },
  {
    name: 'Paraná-Etendeka flood basalts',
    old: 135,
    young: 132,
    region: [
      [-34, -60, -16, -45],
      [-23, 11, -17, 17],
    ],
    rock: 'volcanic',
    environment: 'volcanic-land',
    summary: 'Lava flows that covered parts of what are now southern Brazil and Namibia in the Early Cretaceous, shortly before the South Atlantic opened between them.',
    source: 'Thiede, D.S. and Vasconcelos, P.M. (2010) Paraná flood basalts: rapid extrusion hypothesis confirmed by new 40Ar/39Ar results. Geology 38, 747-750.',
    vetted: false,
  },
  {
    name: 'Ethiopian flood basalts',
    old: 31,
    young: 29,
    region: [[4, 34, 17, 47]],
    rock: 'volcanic',
    environment: 'volcanic-land',
    summary: 'Lava flows that built the Ethiopian highlands in the Oligocene, before the Red Sea and the East African Rift opened.',
    source: 'Hofmann, C. et al. (1997) Timing of the Ethiopian flood basalt event and implications for plume birth and global change. Nature 389, 838-841.',
    vetted: false,
  },
  {
    name: 'Columbia River flood basalts',
    old: 16.7,
    young: 15.9,
    region: [[42, -125, 49.5, -114]],
    rock: 'volcanic',
    environment: 'volcanic-land',
    summary: 'Lava flows that flooded the Columbia Plateau in the Miocene. Most of the lava erupted within about 800,000 years.',
    source: 'Kasbohm, J. and Schoene, B. (2018) Rapid eruption of the Columbia River flood basalt and correlation with the mid-Miocene climate optimum. Science Advances 4, eaat8223.',
    vetted: false,
  },
];

/** The events whose rough extent covers this point. */
export function eventsAt(events: MajorEvent[], p: LatLng): MajorEvent[] {
  return events.filter((e) => e.region.some(([south, west, north, east]) => p.lat >= south && p.lat <= north && p.lng >= west && p.lng <= east));
}
