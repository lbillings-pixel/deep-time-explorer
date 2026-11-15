// Rifts and the opening of oceans. Source dossier: docs/research/tectonic-rifts-and-oceans.md.
//
// HELD BACK (in the dossier, not here):
// - 5, Africa parts from Madagascar, India and Antarctica (Somali and Mozambique
//   basins): every date in the dossier is from memory.
// - 9, North Sea rift: the rift is almost wholly offshore, and the province map has
//   no province for it, so no honest region on land exists.
//
// DRAWN IN PART ONLY, because the rest has no honest region on land:
// - Central Atlantic: not the buried South Georgia rift, nor the High Atlas.
// - India leaves Antarctica and Australia: not Bengal, nor Sri Lanka.
// - South Atlantic: not the Benue Trough, nor the coast west of Fortaleza.
// - North-East Atlantic: the European side only (Hebrides, Antrim, Faroes). The
//   Labrador Sea has other, disputed dates and is left out.
// - Australia leaves Antarctica: the Otway, Bass and Gippsland basins only.
// - South China Sea: the Chinese coast only. Sea of Japan: not the Russian coast.
// - Western Mediterranean: the European side only.
//
// REGIONS. `provinces` are record numbers (not map ids), each checked by probing towns
// with tools/province-lookup.mjs. Three are used for their outline although the map
// types them by their older basement: 361 "Darling Orogen" is the strip west of the
// Darling Fault that holds the Perth and Carnarvon basins; 450 "Cantabrian-Pyrenean
// Belt" holds the squeezed Biscay rift basins; 489 "Campanian Arc" is the stretched
// Tyrrhenian side of Italy. Boxes are hand-drawn and tight, and every entry with
// boxes says so in a caveat. tests/tectonics-rifts.test.ts holds the probes.
import type { TectonicEvent } from './tectonics';


export const RIFTS_AND_OCEANS: TectonicEvent[] = [
  {
    id: 'midcontinent-rift',
    name: 'Midcontinent Rift',
    kind: 'rift',
    old: 1109,
    young: 1083,
    provinces: [563],
    boxes: [],
  },
  {
    id: 'iapetus-opening',
    name: 'Opening of the Iapetus Ocean',
    kind: 'ocean',
    old: 615,
    young: 535,
    provinces: [],
    boxes: [
      [47.6, -59.5, 51.6, -56.8], // western Newfoundland
      [44.0, -73.25, 45.5, -72.6], // Green and Sutton Mountains, Vermont and Quebec
      [38.0, -79.0, 38.8, -78.1], // Blue Ridge, Virginia
      [38.8, -78.5, 39.9, -77.3], // Blue Ridge and South Mountain, Virginia to Pennsylvania
    ],
  },
  {
    id: 'central-atlantic',
    name: 'Opening of the Central Atlantic',
    kind: 'ocean',
    old: 230,
    young: 185,
    // Meguma Terrane (Nova Scotia), West African Rifted Margin, Bahama Platform.
    provinces: [665, 39, 648],
    boxes: [
      [41.25, -73.0, 42.75, -72.4], // Connecticut Valley: Hartford and Deerfield basins
      [40.45, -74.75, 41.2, -73.9], // Newark basin, north-east
      [40.15, -75.9, 40.65, -74.6], // Newark basin, south-west
      [39.65, -77.35, 40.25, -76.4], // Gettysburg basin
      [38.3, -78.1, 39.5, -77.35], // Culpeper basin
      [37.3, -77.85, 37.9, -77.5], // Richmond and Taylorsville basins
      [36.2, -80.2, 36.8, -79.2], // Dan River basin
      [35.6, -79.2, 36.2, -78.7], // Deep River basin, Durham
      [34.9, -80.2, 35.6, -79.0], // Deep River basin, Sanford to Wadesboro
      [30.3, -9.75, 31.1, -8.8], // Argana valley, Morocco
    ],
  },
  {
    id: 'gulf-of-mexico',
    name: 'Opening of the Gulf of Mexico',
    kind: 'ocean',
    old: 165,
    young: 142,
    // Northern Gulf of Mexico Margin, Maya Terrane (the Yucatán block).
    provinces: [667, 578],
    boxes: [
      [31.3, -96.2, 33.0, -91.9], // East Texas and North Louisiana salt basins
      [31.2, -91.9, 32.6, -88.3], // Mississippi interior salt basin
      [29.6, -88.4, 30.9, -83.3], // Mobile and the Florida panhandle
      [28.2, -83.3, 30.0, -82.5], // Florida, Big Bend coast
      [27.0, -82.9, 28.2, -82.2], // Florida, Tampa Bay
      [25.9, -82.3, 27.0, -81.7], // Florida, Fort Myers and Naples
      [21.9, -98.2, 23.0, -97.5], // Tampico
      [20.0, -97.8, 21.9, -96.9], // Tuxpan and Poza Rica
      [18.6, -96.6, 20.0, -95.6], // Veracruz
    ],
  },
  {
    id: 'india-leaves-antarctica-australia',
    name: 'India leaves Antarctica and Australia',
    kind: 'ocean',
    old: 136,
    young: 126,
    // East Indian Margin; Darling Orogen (the Perth and Carnarvon basins, see the note at the top).
    provinces: [790, 361],
    boxes: [
      [10.2, 79.0, 12.2, 79.9], // Cauvery basin
      [12.4, 79.9, 13.5, 80.4], // Chennai coast
      [19.7, 85.6, 20.6, 86.8], // Mahanadi delta
    ],
  },
  {
    id: 'south-atlantic',
    name: 'Opening of the South Atlantic',
    kind: 'ocean',
    old: 140,
    young: 103,
    // Brazil Rifted Margin, Central African Margin.
    provinces: [766, 37],
    boxes: [
      // South America, south to north
      [-40.2, -62.9, -38.6, -61.9], // Colorado basin, Bahía Blanca
      [-36.6, -58.5, -35.4, -56.9], // Salado basin
      [-35.0, -57.0, -34.3, -54.8], // Montevideo to Punta del Este
      [-33.8, -53.6, -32.3, -52.0], // Pelotas basin coast
      [-32.3, -52.6, -30.9, -50.6],
      [-30.9, -51.4, -29.2, -49.9], // Porto Alegre
      [-29.2, -49.6, -27.0, -48.4], // Florianópolis
      [-27.0, -49.1, -25.3, -48.3],
      [-25.3, -48.3, -23.7, -46.0], // Santos
      [-24.1, -46.0, -23.2, -44.5],
      [-23.2, -44.8, -22.6, -41.8], // Rio de Janeiro
      [-22.6, -42.1, -20.9, -40.8], // Campos
      [-20.9, -40.9, -18.0, -39.6], // Vitória
      [-13.1, -38.9, -11.5, -38.0], // Recôncavo rift
      [-11.5, -39.0, -9.3, -38.0], // Tucano rift
      [-11.5, -37.6, -10.3, -36.6], // Sergipe coast
      [-10.3, -36.9, -9.0, -35.3], // Alagoas coast
      [-9.0, -35.4, -6.9, -34.75], // Recife to João Pessoa
      [-5.9, -37.8, -4.8, -35.1], // Potiguar basin
      [-4.9, -38.6, -3.4, -37.2], // Ceará coast, Fortaleza
      // Africa, north to south
      [5.0, -5.2, 5.5, -3.1], // Abidjan
      [4.7, -3.1, 5.2, -1.5], // Takoradi
      [-0.9, 9.2, 1.0, 10.0], // Libreville
      [-2.4, 9.2, -0.9, 10.1], // Gabon coastal basin
      [-4.0, 10.0, -2.4, 11.2],
      [-5.1, 11.1, -4.0, 12.2], // Pointe-Noire
      [-8.0, 12.3, -6.2, 13.6], // northern Angola
      [-10.9, 12.9, -8.0, 14.1], // Kwanza basin, Luanda
      [-13.0, 13.0, -10.9, 14.0], // Benguela
      [-14.5, 12.2, -13.0, 13.1],
      [-16.2, 11.7, -14.5, 12.6], // Namibe
      [-21.5, 13.0, -19.5, 14.4], // Etendeka coast
      [-23.6, 14.2, -21.5, 15.1], // Swakopmund and Walvis Bay
      [-27.0, 14.4, -23.6, 15.6], // Lüderitz
      [-29.0, 15.2, -27.0, 16.8], // Oranjemund
      [-31.5, 16.8, -29.0, 17.6],
      [-33.2, 17.8, -31.5, 18.6],
      [-34.4, 18.2, -33.2, 18.9], // Cape Town
    ],
  },
  {
    id: 'bay-of-biscay',
    name: 'Opening of the Bay of Biscay',
    kind: 'ocean',
    old: 145,
    young: 80,
    // Cantabrian-Pyrenean Belt (see the note at the top), Iberian Rifted Margin.
    provinces: [450, 498],
    boxes: [
      [44.0, -1.4, 44.7, -0.6], // Parentis basin
      [43.2, -1.6, 43.8, 0.0], // Adour: Bayonne to Pau
    ],
  },
  {
    id: 'north-east-atlantic',
    name: 'Opening of the North-East Atlantic',
    kind: 'ocean',
    old: 62,
    young: 54,
    // North European Rifted Margin: on land, the Faroe Islands.
    provinces: [504],
    boxes: [
      [56.9, -6.8, 57.75, -5.9], // Skye and the Small Isles
      [56.25, -6.45, 56.8, -5.6], // Mull, Morvern and Ardnamurchan
      [55.4, -5.45, 55.75, -5.0], // Arran
      [54.5, -6.75, 55.3, -5.65], // Antrim
      [54.0, -6.55, 54.3, -5.8], // Mourne, Slieve Gullion and Carlingford
    ],
  },
  {
    id: 'australia-leaves-antarctica',
    name: 'Australia leaves Antarctica',
    kind: 'ocean',
    old: 160,
    young: 43,
    // Bass Strait rift ("Bass Straight" on the map): the eastern Otway, Bass and Gippsland basins.
    provinces: [367],
    boxes: [
      [-38.5, 140.5, -37.5, 142.9], // western Otway basin, Mount Gambier to Warrnambool
    ],
  },
  {
    id: 'tasman-sea',
    name: 'Opening of the Tasman Sea',
    kind: 'ocean',
    old: 90,
    young: 52,
    provinces: [],
    boxes: [
      // South-eastern Australia, a strip along the coast
      [-37.6, 149.5, -35.5, 150.3],
      [-35.5, 150.2, -34.0, 151.2], // Wollongong
      [-34.0, 150.8, -32.6, 152.3], // Sydney and Newcastle
      [-32.6, 152.0, -30.8, 153.1],
      [-30.8, 152.6, -28.9, 153.4],
      [-28.9, 152.9, -26.9, 153.6], // Gold Coast and Brisbane
      // New Zealand
      [-43.0, 170.6, -41.2, 172.2], // West Coast of the South Island
      [-39.7, 173.7, -38.9, 174.5], // Taranaki
    ],
  },
  {
    id: 'european-cenozoic-rift',
    name: 'European Cenozoic rift system',
    kind: 'rift',
    old: 45,
    young: 0,
    provinces: [],
    boxes: [
      [47.5, 7.0, 48.4, 8.2], // Upper Rhine Graben: Basel to Freiburg
      [48.4, 7.3, 49.3, 8.6], // Strasbourg to Karlsruhe
      [49.3, 7.9, 50.2, 8.9], // Mannheim to Frankfurt
      [50.6, 6.2, 51.1, 7.15], // Lower Rhine Embayment: Bonn and Cologne
      [51.0, 5.3, 51.6, 6.4], // Roer Valley Graben
      [45.4, 3.0, 46.3, 3.6], // Limagne
      [46.0, 4.8, 47.1, 5.5], // Bresse
      [50.0, 12.3, 50.75, 14.2], // Eger Graben
    ],
  },
  {
    id: 'south-china-sea',
    name: 'Opening of the South China Sea',
    kind: 'ocean',
    old: 33,
    young: 15,
    // Pearl River Mouth Basin: on land, the south of Hainan.
    provinces: [274],
    boxes: [
      [22.6, 115.0, 23.6, 117.2], // Shantou and Shanwei
      [22.0, 113.0, 23.3, 115.0], // Pearl River delta
      [21.4, 110.8, 22.4, 113.0], // Yangjiang and Maoming
      [20.2, 109.6, 21.7, 110.8], // Leizhou Peninsula
      [18.1, 108.6, 20.2, 111.1], // Hainan
    ],
  },
  {
    id: 'sea-of-japan',
    name: 'Opening of the Sea of Japan',
    kind: 'ocean',
    old: 23,
    young: 15,
    // Sea of Japan (continental back-arc basin): on land, Niigata, Noto, Fukui, north-west Hokkaido.
    provinces: [341],
    boxes: [
      [38.5, 139.6, 40.6, 140.4], // Sakata to Noshiro
      [36.5, 136.9, 37.0, 137.7], // Toyama
      [35.3, 132.6, 35.7, 134.5], // Izumo to Tottori
      [35.45, 129.2, 36.2, 129.6], // Ulsan and Pohang, Korea
    ],
  },
  {
    id: 'western-mediterranean',
    name: 'Opening of the western Mediterranean basins',
    kind: 'ocean',
    old: 30,
    young: 0,
    // Sardinia-Corsica Block, Tyrrhenian Basin, Campanian Arc (see the note at the top).
    provinces: [458, 481, 489],
    boxes: [
      [43.4, 6.2, 43.9, 7.6], // Côte d'Azur
      [43.0, 4.9, 43.6, 6.2], // Marseille and Toulon
      [43.0, 2.9, 43.9, 4.9], // Languedoc
      [42.4, 2.6, 43.0, 3.2], // Roussillon
      [41.7, 2.5, 42.4, 3.3], // Girona coast
      [41.0, 0.9, 41.7, 2.5], // Barcelona and Tarragona
      [40.0, -0.2, 41.0, 0.9], // Castellón
      [39.0, -0.6, 40.0, 0.0], // Valencia
      [38.6, 1.1, 40.1, 4.4], // Balearic Islands
      [36.5, -5.3, 36.95, -1.9], // Alboran coast of Spain
      [37.95, 12.9, 38.3, 15.65], // north coast of Sicily
      [38.35, 14.3, 38.85, 15.3], // Aeolian Islands
    ],
  },
  {
    id: 'red-sea-gulf-of-aden',
    name: 'Opening of the Red Sea and the Gulf of Aden',
    kind: 'ocean',
    old: 28,
    young: 0,
    // Red Sea (narrow rift): both shores, the Gulf of Suez and Aden.
    provinces: [34],
    boxes: [
      [25.6, 34.0, 26.5, 34.5], // Quseer, Egypt
      [18.9, 36.9, 21.3, 37.5], // Port Sudan
      [10.9, 40.3, 14.6, 41.9], // Afar
      [10.9, 41.9, 13.3, 43.6], // Djibouti and Assab
      [10.2, 43.6, 11.6, 45.5], // Berbera
      [10.4, 45.5, 11.5, 48.5],
      [10.7, 48.5, 12.0, 51.3], // Bosaso
      [12.7, 45.0, 13.9, 47.0], // Yemen, east of Aden
      [13.4, 47.0, 14.6, 48.6],
      [14.1, 48.6, 15.3, 50.5], // Al Mukalla
      [14.9, 50.5, 16.5, 52.3],
      [16.3, 52.3, 17.4, 55.0], // Dhofar, Oman
    ],
  },
  {
    id: 'east-african-rift',
    name: 'East African Rift',
    kind: 'rift',
    old: 25,
    young: 0,
    // Ethiopian Rift, East African Rift-west, East African Rift-east.
    provinces: [21, 22, 23],
    boxes: [
      [7.7, 38.5, 9.2, 39.5], // Addis Ababa and the northern Main Ethiopian Rift
      [6.0, 37.9, 7.7, 38.9], // Hawassa and the lakes
      [2.3, 35.4, 4.6, 36.8], // Lake Turkana
      [-2.0, 35.9, 0.6, 36.95], // Kenya Rift and its eastern shoulder, with Nairobi
      [-3.6, 35.3, -2.0, 37.5], // Natron, Ngorongoro, Arusha and Kilimanjaro
    ],
  },
  {
    id: 'basin-and-range',
    name: 'Basin and Range',
    kind: 'rift',
    old: 17,
    young: 0,
    // Northern and Southern Basin and Range.
    provinces: [645, 660],
    boxes: [],
  },
  {
    id: 'rio-grande-rift',
    name: 'Rio Grande Rift',
    kind: 'rift',
    old: 28,
    young: 0,
    provinces: [569],
    boxes: [
      [36.2, -105.9, 37.0, -105.4], // Taos
      [38.2, -106.5, 39.4, -105.9], // upper Arkansas valley: Salida to Leadville
    ],
  },
  {
    id: 'gulf-of-california',
    name: 'Opening of the Gulf of California',
    kind: 'ocean',
    old: 12.5,
    young: 0,
    // Gulf of California Coast (wide rift): the mainland side and the Salton Trough.
    provinces: [672],
    boxes: [
      // The Gulf side of the Baja California peninsula, north to south
      [29.6, -114.8, 30.6, -114.0],
      [28.6, -114.0, 29.6, -113.2],
      [27.8, -113.3, 28.6, -112.6],
      [26.7, -112.6, 27.8, -111.8], // Santa Rosalía
      [25.5, -111.7, 26.7, -111.0], // Loreto
      [24.0, -110.8, 25.5, -110.2], // La Paz
      [23.0, -109.9, 24.0, -109.4], // East Cape
    ],
  },
  {
    id: 'baikal-rift',
    name: 'Baikal Rift',
    kind: 'rift',
    old: 30,
    young: 0,
    provinces: [134],
    boxes: [
      [53.4, 109.3, 54.6, 110.6], // Barguzin valley
    ],
  },
];
