// Mountain-building events. Source dossier: docs/research/tectonic-orogenies.md.
//
// Each entry is one numbered entry of the dossier, with the dossier's "use" dates.
// The Caledonian entry is split into its Grampian and Scandian phases and the
// Tasmanides entry into the Delamerian, Lachlan and New England events.
//
// HELD BACK:
// - Brasiliano (dossier entry 18): its dates could not be confirmed. Only two of
//   the four pulses were seen in the review's abstract, and the figures for the
//   later two are from memory. It is not in the list.
// - Sveconorwegian (noted under dossier entry 19): its dates were not verified,
//   so southern Norway and south-west Sweden have no entry.
//
// REGIONS: `provinces` are record numbers of the province map (not the map's own
// ids, which the dossier quotes), each checked by looking up real places with
// tools/province-lookup.mjs; tests/tectonics-mountains.test.ts keeps a table of
// those places. Provinces the dossier lists but that are left out here, because
// the outline takes in ground well outside the belt: Qilian Shan and
// Kunlun/South Qilian (they run east to Lanzhou and the Qinling), Indo-Burmese
// Ranges, Molasse Basin, Northern Basin and Range (Reno to Salt Lake City),
// Colorado Plateau, Charleston Arc (buried), "Armorican Basin" (it is the
// Aquitaine Basin), West Asturian-Leonese Zone (it runs east to Barcelona and
// Valencia), Atlas Mountains, Scythian Platform, Ar Rayn Terrane (Riyadh), the
// basins inside the Central Asian belt, North Delamerian and Hay-Booligal
// (buried), Mossman Orogen, the Papuan Peninsula and Bismarck arc, and the
// accreted terranes of British Columbia. Boxes are used where no province
// outlines the event, and are drawn tighter than the dossier's.
import type { TectonicEvent } from './tectonics';


export const MOUNTAIN_BUILDING: TectonicEvent[] = [
  {
    id: 'himalayan',
    name: 'Himalayan and Tibetan mountain building',
    kind: 'mountains',
    old: 59,
    young: 0,
    // Himalayan belt, Kohistan, Ladakh, Karakoram, Lhasa, Qiangtang, Songpan-Ganzi, the three Pamir provinces, Pakistan fold belt.
    provinces: [344, 161, 162, 125, 160, 126, 243, 242, 352, 353, 532],
    boxes: [],
  },
  {
    id: 'alpine',
    name: 'Alpine mountain building',
    kind: 'mountains',
    old: 35,
    young: 0,
    // Alps, Jura Mountains. The map gives the Southern Alps to its "Dinarides" and the eastern end to its "Pannonian Basin", hence the boxes.
    provinces: [505, 462],
    boxes: [
      [45.9, 8.7, 46.8, 11.6],
      [46.15, 11.6, 46.8, 13.5],
      [46.4, 13.5, 47.75, 15.5],
    ],
  },
  {
    id: 'pyrenean',
    name: 'Pyrenean mountain building',
    kind: 'mountains',
    old: 84,
    young: 20,
    // Cantabrian-Pyrenean Belt.
    provinces: [450],
    boxes: [],
  },
  {
    id: 'zagros',
    name: 'Zagros mountain building',
    kind: 'mountains',
    old: 30,
    young: 0,
    // Zagros Orogen, Sanandaj-Sirjan Zone, Urumieh-Dokhtar Magmatic Arc.
    provinces: [555, 523, 528],
    boxes: [],
  },
  {
    id: 'andean',
    name: 'Andean mountain building',
    kind: 'mountains',
    old: 100,
    young: 0,
    // North Andean Orogen, North Central Andes, Colombian arc, Western Cordillera, Eastern Cordillera, Andean Plateau, Central and Southern
    // Andean arcs, the three Precordilleras, Fuegian Andes, Sierras Pampeanas; and, found by lookup, Chilenia (Santiago), Arequipa Province
    // and Southern Chilean Forearc (Ushuaia).
    provinces: [883, 749, 737, 736, 733, 731, 734, 732, 743, 744, 745, 767, 783, 735, 740, 746],
    boxes: [],
  },
  {
    id: 'sevier',
    name: 'Sevier thrust belt',
    kind: 'mountains',
    old: 125,
    young: 50,
    // Cordillera Front and Thrust, Northern Rocky Mountains. Boxes: central Utah, the Wasatch, the Idaho-Wyoming thrust belt, the Spring Mountains.
    provinces: [714, 567],
    boxes: [
      [38.3, -112.6, 39.6, -111.6],
      [39.6, -112.2, 42.0, -111.2],
      [42.0, -111.6, 43.7, -110.6],
      [35.8, -115.9, 36.5, -115.3],
    ],
  },
  {
    id: 'laramide',
    name: 'Laramide mountain building',
    kind: 'mountains',
    old: 70,
    young: 50,
    // Middle and Southern Rocky Mountains. Box: the Black Hills, which the map puts in its Wyoming Craton.
    provinces: [564, 574],
    boxes: [[43.6, -104.4, 44.6, -103.3]],
    // All sides agree the region has stood high ever since; what is disputed is why (docs/research/tectonic-rockies-additions.md, part 2).
    wornBy: 0,
    wornCaveat:
      'The squeezing that raised these mountains had ended by about 50 million years ago. The ranges were worn down to a high, rolling upland, and the peaks and canyons seen today were carved mostly in the last 10 million years. Geologists disagree about whether the land was also lifted again during that time, or whether a changing climate did the carving.',
  },
  {
    id: 'ancestral-rockies',
    name: 'Ancestral Rocky Mountains',
    kind: 'mountains',
    old: 320,
    young: 290,
    // No province outlines the old uplifts: the map's Southern Rocky Mountains take in the basins between them (Aspen, Vail, Durango),
    // and the Uncompahgre Plateau shares a province with its own basin (Moab). So boxes, drawn tight on ground where the old rock
    // of the uplifts is at the surface today: the northern Front Range, Pikes Peak, the Uncompahgre Plateau in two steps, the Black Canyon.
    // Compared with the map of uplifts and basins in Kluth (1986), as redrawn in course notes of the University of Colorado: all five
    // lie inside its Front Range and Uncompahgre uplifts. The second Uncompahgre box was cut back from 38.3 to 38.5 degrees north,
    // to keep it off the Paradox basin side of the uplift's south-western edge (Nucla, Naturita).
    provinces: [],
    boxes: [
      [39.5, -105.9, 40.8, -105.4],
      [38.7, -105.3, 38.9, -104.98],
      [38.85, -108.9, 39.15, -108.6],
      [38.5, -108.6, 38.85, -108.15],
      [38.4, -107.85, 38.65, -107.2],
    ],
    // The highlands sank and were buried in the Early Permian, directly after the building.
    wornBy: 290,
  },
  {
    id: 'alleghanian',
    name: 'Alleghanian mountain building',
    kind: 'mountains',
    old: 335,
    young: 280,
    // Southern and Central Appalachian, Piedmontia, Carolina Terrane. Box: south-east New England.
    provinces: [637, 643, 641],
    boxes: [[41.2, -72.2, 42.1, -70.9]],
  },
  {
    id: 'acadian',
    name: 'Acadian and Neoacadian mountain building',
    kind: 'mountains',
    old: 420,
    young: 350,
    // Ganderia, Avalonia Terrane, Meguma Terrane, Taconic Arc, Piedmontia, Carolina Terrane.
    provinces: [639, 640, 665, 636, 643, 641],
    boxes: [],
  },
  {
    id: 'taconic',
    name: 'Taconic mountain building',
    kind: 'mountains',
    old: 475,
    young: 450,
    // Taconic Arc, "Laurentides" (the old continental edge, from Newfoundland to Virginia), Piedmontia.
    provinces: [636, 642, 643],
    boxes: [],
  },
  {
    id: 'grampian',
    name: 'Caledonian mountain building, Grampian phase',
    kind: 'mountains',
    old: 475,
    young: 465,
    // The map has one province for the whole Caledonian belt from Ireland to northern Norway, so this phase is drawn as boxes:
    // Northern Highlands, Grampian Highlands (three), Shetland, Donegal, Connemara and Mayo.
    provinces: [],
    boxes: [
      [57.4, -5.0, 58.5, -4.0],
      [56.9, -5.6, 57.7, -2.0],
      [56.45, -6.0, 56.9, -3.5],
      [56.0, -6.2, 56.45, -4.6],
      [59.8, -1.8, 60.9, -0.7],
      [54.6, -8.8, 55.4, -7.0],
      [53.3, -10.3, 54.3, -9.0],
    ],
  },
  {
    // The range collapsed by stretching in the Devonian, by about 380 million years ago (docs/research/tectonic-rockies-additions.md, part 2).
    wornBy: 380,
    id: 'scandian',
    name: 'Caledonian mountain building, Scandian phase',
    kind: 'mountains',
    old: 430,
    young: 400,
    // Caledonides, "Laurentia Province" (the Northern Highlands and Hebrides), Svalbard Caledonides, Caledonian Fold Belt of East Greenland.
    provinces: [503, 483, 491, 891],
    boxes: [],
  },
  {
    id: 'variscan',
    name: 'Variscan mountain building',
    kind: 'mountains',
    old: 360,
    young: 290,
    // Rheno-Hercynian, Saxo-Thuringian and Moldanubian belts, Iberian Massif, Ossa-Morena Zone, South Portuguese Zone,
    // Sardinia-Corsica Block, Anti-Atlas Mountains, Mauritanides.
    provinces: [484, 463, 486, 465, 466, 487, 458, 14, 83],
    boxes: [],
  },
  {
    id: 'uralian',
    name: 'Uralian mountain building',
    kind: 'mountains',
    old: 380,
    young: 250,
    // Uralide Fold Belt, Ural Volcanic Arcs.
    provinces: [515, 357],
    boxes: [],
  },
  {
    id: 'central-asian',
    name: 'Central Asian belt, final closing',
    kind: 'mountains',
    old: 300,
    young: 250,
    // The map's Kazakhstan, Mongolian and Solonker provinces, without the sedimentary basins among them (Ferghana, Teniz, Chu-Sarysu,
    // Kuznetsk, West Siberian) and without the two buried under the West Siberian plain (Chatkal-Valerianov as mapped, Uvat).
    provinces: [
      127, 177, 178, 188, 189, 190, 193, 194, 195, 196, 197, 198, 199, 200, 201, 204, 205, 206, 207, 208, 211, 241, 268,
      135, 180, 181, 182, 183, 185, 186, 187, 216, 217, 218, 234, 235, 237, 238, 239, 240, 269, 270, 271, 272, 301, 346, 359,
      212, 213, 214,
    ],
    boxes: [],
  },
  {
    id: 'qinling-dabie',
    name: 'Qinling-Dabie mountain building',
    kind: 'mountains',
    old: 250,
    young: 200,
    // Dabie Orogen, Su-Lu Belt (the Chinese one of the two records). Box: the Qinling, which the map puts in its Kunlun belt.
    provinces: [165, 336],
    boxes: [[32.9, 105.5, 34.1, 111.8]],
  },
  {
    id: 'cape',
    name: 'Cape folding',
    kind: 'mountains',
    old: 275,
    young: 250,
    // Cape Fold Belt, Falkland Block. Box: Sierra de la Ventana (the map's province of that name runs from Neuquén to the Atlantic).
    provinces: [45, 780],
    boxes: [[-38.5, -62.6, -37.6, -61.3]],
  },
  {
    id: 'east-african',
    name: 'East African mountain building',
    kind: 'mountains',
    old: 650,
    young: 550,
    // Arabian-Nubian Shield terranes (without Ar Rayn, which as mapped reaches Riyadh); Mozambique Belt and Madagascar; southern India and Sri Lanka.
    provinces: [
      9, 47, 48, 50, 51, 52, 53, 54, 58, 55, 56, 79, 76, 90,
      62, 800, 801, 802, 803, 799, 809, 804, 8, 46, 27, 28, 29, 30, 31,
      516, 549, 539, 540, 541,
    ],
    boxes: [],
  },
  {
    id: 'grenville',
    name: 'Grenville mountain building',
    kind: 'mountains',
    old: 1090,
    young: 980,
    // Grenville Orogeny. Boxes: central Ontario between the Grenville Front and the limestone lowlands (the map gives it to its
    // Granite-Rhyolite Province), and the Llano Uplift of Texas.
    provinces: [600],
    boxes: [
      [44.7, -80.3, 46.35, -76.3],
      [30.4, -99.2, 31.0, -98.2],
    ],
  },
  {
    id: 'trans-hudson',
    name: 'Trans-Hudson mountain building',
    kind: 'mountains',
    old: 1920,
    young: 1800,
    // Trans-Hudson Orogen, La Ronge Arc, Meta Incognita, Sugluk, Cumberland Batholith and arcs, Foxe Orogen, Southeast Churchill,
    // Burwell, Snowbird zone, Nagssugtoqidian and Rinkian belts of Greenland. Box: the core of the Black Hills.
    provinces: [576, 589, 613, 621, 622, 595, 592, 593, 627, 582, 650],
    boxes: [[43.7, -104.0, 44.3, -103.35]],
  },
  {
    id: 'svecofennian',
    name: 'Svecofennian mountain building',
    kind: 'mountains',
    old: 1920,
    young: 1790,
    // Central Finland Arc Complex, Central Finland Granitoid Complex, Bergslagen-Livonia, Ljusdal, Bothnia microcontinent.
    provinces: [451, 480, 477, 478, 479],
    boxes: [],
  },
  {
    id: 'delamerian',
    name: 'Delamerian mountain building',
    kind: 'mountains',
    old: 514,
    young: 490,
    // Delamerian Orogen, Adelaide Rift Complex (Mount Lofty and Flinders Ranges), Western Tasmania.
    provinces: [390, 414, 872],
    boxes: [],
  },
  {
    id: 'lachlan',
    name: 'Lachlan mountain building',
    kind: 'mountains',
    old: 450,
    young: 340,
    // Lachlan Fold Belt, Stawell Zone, Wagga-Omeo Metamorphic Complex, Macquarie Arc, Eastern Tasmania.
    provinces: [384, 385, 378, 382, 871],
    boxes: [],
  },
  {
    id: 'new-england',
    name: 'New England mountain building (Hunter-Bowen)',
    kind: 'mountains',
    old: 265,
    young: 230,
    // New England Orogen.
    provinces: [422],
    boxes: [],
  },
  {
    id: 'kaikoura',
    name: 'Kaikōura mountain building',
    kind: 'mountains',
    old: 8,
    young: 0,
    // The map's New Zealand provinces are the old basement terranes and run out across the Canterbury Plains, so boxes:
    // Fiordland, three steps along the Southern Alps, the Kaikōura ranges.
    provinces: [],
    boxes: [
      [-46.2, 166.4, -44.5, 168.0],
      [-45.1, 168.0, -43.9, 170.0],
      [-44.2, 169.6, -43.1, 171.0],
      [-43.4, 170.6, -42.3, 172.0],
      [-42.8, 172.0, -41.6, 174.1],
    ],
  },
  {
    id: 'taiwan',
    name: 'Taiwan mountain building',
    kind: 'mountains',
    old: 6.5,
    young: 0,
    // No province outlines Taiwan's mountains (the island is split between the Luzon arc and the Manila forearc), so boxes that step
    // north-northeast along the ranges and leave out the western plain and the Taipei basin.
    provinces: [],
    boxes: [
      [22.2, 120.65, 23.2, 121.4],
      [23.2, 120.75, 24.3, 121.65],
      [24.3, 121.1, 24.9, 121.95],
    ],
  },
  {
    id: 'new-guinea',
    name: 'New Guinea mountain building',
    kind: 'mountains',
    old: 12,
    young: 0,
    // Papuan Fold and Thrust Belt, Mamberamo Thrust Belt, Papuan Arc. Box: the Finisterre Range and Huon Peninsula.
    provinces: [155, 246, 230],
    boxes: [[-6.6, 145.9, -5.4, 147.9]],
  },
  {
    id: 'cordilleran-arc',
    name: 'Cordilleran volcanic arc and its granite',
    kind: 'mountains',
    old: 170,
    young: 50,
    // Sierra Nevada, Peninsular Ranges and Idaho batholiths, Coast plutonic complex, Klamath Range.
    provinces: [661, 662, 654, 690, 602],
    boxes: [],
  },
];
