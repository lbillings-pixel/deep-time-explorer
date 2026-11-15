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

const RESTS = 'The dates here come from the summaries of published papers, not from a reading of the full papers.';

export const RIFTS_AND_OCEANS: TectonicEvent[] = [
  {
    id: 'midcontinent-rift',
    name: 'Midcontinent Rift',
    kind: 'rift',
    old: 1109,
    young: 1083,
    provinces: [563],
    boxes: [],
    plain:
      'About 1.1 billion years ago North America began to split in two along a great curved rift through what is now Lake Superior. Lava poured out for about 25 million years, then the rifting stopped, and the continent stayed whole.',
    caveats: [
      'Away from Lake Superior the rift is buried under younger rock and is known from drilling and from measurements of gravity and magnetism.',
      'The dates are those of the dated rift lavas. Why the rifting stopped is debated.',
      RESTS,
    ],
    sources: [
      "Swanson-Hysell, N.L. et al. (2019) Failed rifting and fast drifting: Midcontinent Rift development, Laurentia's rapid motion and the driver of Grenvillian orogenesis. GSA Bulletin 131, 913-940.",
      'Fairchild, L.M. et al. (2017) The end of Midcontinent Rift magmatism and the paleogeography of Laurentia. Lithosphere 9, 117-133.',
    ],
    vetted: false,
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
    plain:
      'Between about 615 and 535 million years ago an older supercontinent broke up here and a vanished ocean, the Iapetus, opened along this edge of ancient North America. The ocean closed again long ago, and the rocks of its old shore were folded into the Appalachians.',
    caveats: [
      'The ocean no longer exists. The dates are for the rifting recorded in rocks along the old edge of the continent, and those rocks were later folded into the Appalachians.',
      'Researchers disagree on whether one ocean opened or two, and on whether the continent finally broke about 570 or about 540 million years ago.',
      'The dated rift rocks behind these figures are in western Newfoundland. The region is a set of rough boxes drawn there and around rift lavas in Quebec, Vermont and the Blue Ridge, so the link is weakest outside Newfoundland and near the edges.',
      RESTS,
    ],
    sources: [
      'Robert, B., Domeier, M. and Jakob, J. (2020) Iapetan Oceans: an analog of Tethys? Geology 48, 929-933.',
      'Cawood, P.A., McCausland, P.J.A. and Dunning, G.R. (2001) Opening Iapetus: constraints from the Laurentian margin in Newfoundland. Geological Society of America Bulletin 113, 443-453.',
    ],
    vetted: false,
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
    plain:
      'From about 230 million years ago the supercontinent Pangaea began to tear apart here, opening long valleys that filled with red mud and sand and, about 201 million years ago, with floods of lava. The tear became the Atlantic Ocean. Its first sea floor formed bit by bit, between about 200 and 185 million years ago by most published estimates.',
    caveats: [
      'The rifting took tens of millions of years, and the ocean seems to have opened earlier in the south than in the north. Published estimates of the first sea floor range from about 200 to about 185 million years ago, and some older work put it later still.',
      'The older date given for this event is the age of the oldest sediments in the rift valleys. The younger date is the latest estimate of the first sea floor, off eastern Canada.',
      'In the eastern United States and Morocco the region is a set of rough boxes drawn around the rift valleys, so the link is weakest near their edges. Rift valleys buried under the coastal plain are not drawn.',
      RESTS,
    ],
    sources: [
      'Schettino, A. and Turco, E. (2009) Breakup of Pangaea and plate kinematics of the central Atlantic and Atlas regions. Geophysical Journal International 178, 1078-1097.',
      'Withjack, M.O. et al. (1998) Diachronous rifting, drifting, and inversion on the passive margin of central eastern North America: an analog for other passive margins. AAPG Bulletin 82, 817-835.',
      'Marzoli, A. et al. (1999) Extensive 200-million-year-old continental flood basalts of the Central Atlantic Magmatic Province. Science 284, 616-618.',
      'Blackburn, T.J. et al. (2013) Zircon U-Pb geochronology links the end-Triassic extinction with the Central Atlantic Magmatic Province. Science 340, 941-945.',
    ],
    vetted: false,
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
    plain:
      'The Gulf of Mexico opened in the Jurassic, when a block of crust that is now the Yucatán swung away from the rest of North America. New sea floor formed from about 165 to about 142 million years ago; then the Gulf stopped widening.',
    caveats: [
      'The evidence is buried under kilometers of younger sediment and comes from drilling and geophysical surveys. The dates come from fitting the plates back together and could shift by several million years.',
      'One published paper holds that the Gulf opened as a sea behind a chain of volcanoes in Mexico; others treat it as part of the breakup of the supercontinent Pangaea.',
      'Over the buried salt basins inland and along the coasts of Florida and eastern Mexico the region is a set of rough boxes, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Stern, R.J. and Dickinson, W.R. (2010) The Gulf of Mexico is a Jurassic backarc basin. Geosphere 6, 739-754.',
      'Pindell, J. et al. (2020) A revised synthesis of the rift and drift history of the Gulf of Mexico and surrounding regions in the light of improved age dating of the Middle Jurassic salt. Geological Society, London, Special Publications 504, 29-76.',
      'Sandwell, D.T. et al. (2014) New global marine gravity model from CryoSat-2 and Jason-1 reveals buried tectonic structure. Science 346, 65-67.',
    ],
    vetted: false,
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
    plain:
      'India once lay against Antarctica and the west coast of Australia. It broke away between about 136 and 126 million years ago, the split running from north to south, and the eastern Indian Ocean opened behind it.',
    caveats: [
      'The dates are for the first sea floor: about 136 million years ago off north-western Australia and about 126 million years ago at the southern tip of India. The land along these coasts had been stretching and sinking, on and off, long before that.',
      'On parts of the Indian coast the region is a set of rough boxes drawn around the river deltas, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Gibbons, A.D., Whittaker, J.M. and Müller, R.D. (2013) The breakup of East Gondwana: assimilating constraints from Cretaceous ocean basins around India into a best-fit tectonic model. Journal of Geophysical Research: Solid Earth 118, 808-822.',
      'Gaina, C. et al. (2007) Breakup and early seafloor spreading between India and Antarctica. Geophysical Journal International 170, 151-169.',
    ],
    vetted: false,
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
    plain:
      'South America and Africa were one land until the Early Cretaceous. They began to pull apart about 140 million years ago, and the South Atlantic opened like a zipper from south to north. Sea floor had formed in the far south by about 138 million years ago, between Brazil and Angola by about 112 million years ago, and along the equator by about 103 million years ago.',
    caveats: [
      'The ocean opened from south to north over about 35 million years, so the date depends on where along the coast a place lies. The older date given for this event is the start of the stretching; the younger is the first sea floor along the equatorial coasts, the last part to break.',
      'Some researchers dispute how the two continents fitted together and how much the land inside them was deformed, which would shift these dates.',
      'Along most of both coasts the region is a chain of rough boxes drawn by hand, so the link is weakest near their inland edges.',
      RESTS,
    ],
    sources: [
      'Heine, C., Zoethout, J. and Müller, R.D. (2013) Kinematics of the South Atlantic rift. Solid Earth 4, 215-253.',
      'Torsvik, T.H. et al. (2009) A new scheme for the opening of the South Atlantic Ocean and the dissection of an Aptian salt basin. Geophysical Journal International 177, 1315-1333.',
      'Pérez-Díaz, L. and Eagles, G. (2014) Constraining South Atlantic growth with seafloor spreading data. Tectonics 33, 1848-1873.',
    ],
    vetted: false,
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
    plain:
      'In the Early Cretaceous the crust between Spain and France was stretched until it broke, and Spain swung away to open the Bay of Biscay. West of Portugal the same rifting became part of the North Atlantic. The Bay stopped widening about 80 million years ago, and the movement later reversed to raise the Pyrenees.',
    caveats: [
      'How and exactly when Spain moved is still argued over; the dates could shift by ten million years.',
      'The older date stands for the start of the Early Cretaceous stretching, and the younger for the end of sea-floor spreading in the Bay. That spreading is put at about 118 to 80 million years ago, and the evidence for the older figure has been questioned.',
      'In northern Spain and the Pyrenees the rift basins were later squeezed into the mountains, so the region there is the mountain belt that holds them. In south-western France it is two rough boxes, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Tugend, J. et al. (2014) Formation and deformation of hyperextended rift systems: insights from rift domain mapping in the Bay of Biscay-Pyrenees. Tectonics 33, 1239-1276.',
      'Sibuet, J.-C., Srivastava, S.P. and Spakman, W. (2004) Pyrenean orogeny and plate kinematics. Journal of Geophysical Research: Solid Earth 109, article 2003JB002514.',
      'Nirrengarten, M. et al. (2018) Kinematic evolution of the southern North Atlantic: implications for the formation of hyperextended rift systems. Tectonics 37, 89-118.',
    ],
    vetted: false,
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
    plain:
      'In the Paleocene, from about 62 million years ago, lava flooded this region as Greenland and north-western Europe began to tear apart. By about 54 million years ago the tear had become sea floor, and the north-eastern Atlantic has been widening ever since.',
    caveats: [
      'The figure of about 62 million years for the start of the lavas is a commonly quoted one that was not traced to the paper behind it. The summaries read say only that the volcanic rifting began in the Paleocene.',
      'The first sea floor formed in separate stretches at different times in the Early Eocene; about 54 million years ago is one published figure for it.',
      'Only the European side is drawn: the Faroe Islands, and rough boxes around the lava fields and old volcanoes of western Scotland and the north of Ireland, where the link is weakest near the edges.',
      RESTS,
    ],
    sources: [
      'Gernigon, L. et al. (2020) Crustal fragmentation, magmatism, and the diachronous opening of the Norwegian-Greenland Sea. Earth-Science Reviews 206, 102839.',
      'Gaina, C., Gernigon, L. and Ball, P. (2009) Palaeocene-Recent plate boundaries in the NE Atlantic and the formation of the Jan Mayen microcontinent. Journal of the Geological Society 166, 601-616.',
    ],
    vetted: false,
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
    plain:
      'Australia and Antarctica were the last large pieces of the southern supercontinent to part. A rift valley ran along this coast in the age of dinosaurs. The sea floor between the two continents grew very slowly at first and has widened quickly only since about 43 million years ago.',
    caveats: [
      'The separation was slow and its early dates are uncertain: published work calls the early history not well established. Sea floor was forming, very slowly, by about 69 million years ago.',
      'The start of about 160 million years ago is a commonly quoted figure for the oldest rift sediments that was not traced to the paper behind it. The end, about 43 million years ago, is when fast spreading began, not when the continents first parted.',
      'Only the rift basins of Victoria and Bass Strait are drawn, partly as a rough box on the Otway coast, so the link is weakest near the edges. The long southern coast farther west is not drawn.',
      RESTS,
    ],
    sources: [
      'Whittaker, J.M., Williams, S.E. and Müller, R.D. (2013) Revised tectonic evolution of the Eastern Indian Ocean. Geochemistry, Geophysics, Geosystems 14, 1891-1909.',
      'Tikku, A.A. and Cande, S.C. (1999) The oldest magnetic anomalies in the Australian-Antarctic Basin: are they isochrons? Journal of Geophysical Research: Solid Earth 104, 661-677.',
      'Williams, S.E., Whittaker, J.M. and Müller, R.D. (2011) Full-fit, palinspastic reconstruction of the conjugate Australian-Antarctic margins. Tectonics 30, article 2011TC002912.',
    ],
    vetted: false,
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
    plain:
      "New Zealand's continent, Zealandia, was once joined to eastern Australia. It began to stretch and break away about 90 million years ago, and the Tasman Sea widened between them until about 52 million years ago, when it stopped.",
    caveats: [
      'The sea opened from south to north. On the Australian side there is little on land to show for it.',
      'The older date is when blocks of the continent began to move apart; sea-floor spreading itself is modeled from about 74 to about 52 million years ago.',
      'The region is a narrow strip of rough boxes along the coast of south-eastern Australia and two boxes in western New Zealand, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Gaina, C. et al. (1998) The tectonic history of the Tasman Sea: a puzzle with 13 pieces. Journal of Geophysical Research: Solid Earth 103, 12413-12433.',
      "Mortimer, N. et al. (2017) Zealandia: Earth's hidden continent. GSA Today, 27-35, doi:10.1130/gsatg321a.1.",
    ],
    vetted: false,
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
    plain:
      'From about 45 million years ago the crust of western Europe was stretched along a chain of troughs running from eastern France to the Netherlands and Bohemia. Here a strip of land dropped between faults to make a rift valley, and movement on those faults has gone on into the most recent geological period.',
    caveats: [
      'The dates given are for the Upper Rhine valley; the other troughs in the chain differ by some millions of years.',
      'The published summary supports fault movement in the last few million years. That the valley is still moving today is widely said but was not traced to a source.',
      'The province map does not outline these troughs, so the region is a set of rough boxes drawn around them and the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Schumacher, M.E. (2002) Upper Rhine Graben: role of preexisting structures during rift evolution. Tectonics 21, doi:10.1029/2001tc900022.',
      'Dèzes, P., Schmid, S.M. and Ziegler, P.A. (2004) Evolution of the European Cenozoic Rift System: interaction of the Alpine and Pyrenean orogens with their foreland lithosphere. Tectonophysics 389, 1-33.',
    ],
    vetted: false,
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
    plain:
      'The South China Sea opened beside this coast. New sea floor formed from about 33 million years ago, first in the north-east, until about 15 million years ago; then the sea stopped widening.',
    caveats: [
      'The dates are for the sea floor. The stretching of the land that came before it is not dated here, and why the sea opened is disputed.',
      'Only the Chinese side is drawn, as rough boxes along the coast of Guangdong and around Hainan, so the link is weakest near their edges. The coasts of Vietnam, Palawan and Borneo are not drawn.',
      RESTS,
    ],
    sources: [
      'Li, C.-F. et al. (2014) Ages and magnetic structures of the South China Sea constrained by deep tow magnetic surveys and IODP Expedition 349. Geochemistry, Geophysics, Geosystems 15, 4958-4983.',
      'Briais, A., Patriat, P. and Tapponnier, P. (1993) Updated interpretation of magnetic anomalies and seafloor spreading stages in the South China Sea: implications for the Tertiary tectonics of Southeast Asia. Journal of Geophysical Research: Solid Earth 98, 6299-6328.',
    ],
    vetted: false,
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
    plain:
      'Japan was once part of the edge of mainland Asia. In the early Miocene, about 23 to 15 million years ago, the islands were pulled away and the Sea of Japan opened behind them.',
    caveats: [
      'How fast the sea opened is still debated; estimates of the start range from about 30 to about 20 million years ago.',
      'Most of the sea is floored by stretched crust of the continent; true sea floor lies only in one part of it, the Japan Basin.',
      'Along parts of the coasts of Japan and Korea the region is a set of rough boxes, so the link is weakest near their edges. The Russian coast is not drawn.',
      RESTS,
    ],
    sources: [
      'Jolivet, L., Tamaki, K. and Fournier, M. (1994) Japan Sea, opening history and mechanism: a synthesis. Journal of Geophysical Research: Solid Earth 99, 22237-22259.',
      'Van Horne, A., Sato, H. and Ishiyama, T. (2017) Evolution of the Sea of Japan back-arc and some unsolved issues. Tectonophysics 710-711, 6-20.',
    ],
    vetted: false,
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
    plain:
      'The western Mediterranean is young. From about 30 million years ago the land here was stretched and pulled apart as a sinking slab of sea floor retreated, swinging Corsica and Sardinia away from France and later opening the Tyrrhenian Sea west of Italy.',
    caveats: [
      'Several small seas opened one after another, the oldest in the north-west and the youngest, the Tyrrhenian, in the south-east, so the full span of dates does not apply to any one coast.',
      'Only the start, about 30 million years ago, comes from the summaries read; the dates of the separate basins were not traced to their sources.',
      'Along the coasts of France and Spain and in Sicily the region is a set of rough boxes, so the link is weakest near their edges. The African coast is not drawn.',
      RESTS,
    ],
    sources: [
      'Romagny, A. et al. (2020) Detailed tectonic reconstructions of the Western Mediterranean region for the last 35 Ma, insights on driving mechanisms. BSGF - Earth Sciences Bulletin 191, 37.',
      'Faccenna, C. et al. (2004) Lateral slab deformation and the origin of the western Mediterranean arcs. Tectonics 23, article 2002TC001488.',
    ],
    vetted: false,
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
    plain:
      'Arabia was part of Africa until the land between them began to split. The split became the Gulf of Aden, with sea floor from about 20 million years ago, and the Red Sea, and Arabia is still moving away from Africa.',
    caveats: [
      'Whether the whole Red Sea is floored by new sea floor, or only its southern part, is disputed; so is the age of that sea floor, about 13 or about 5 million years.',
      'The start of about 28 million years ago is a commonly quoted figure that was not traced to the paper behind it. The summaries read say that Arabia began to move away in the early Miocene, and that the sea floor of the Gulf of Aden grew westward from about 20 to about 16 million years ago.',
      'Along the Gulf of Aden, in Afar and on parts of the African shore of the Red Sea the region is a chain of rough boxes, so the link is weakest near their inland edges.',
      RESTS,
    ],
    sources: [
      'Fournier, M. et al. (2010) Arabia-Somalia plate kinematics, evolution of the Aden-Owen-Carlsberg triple junction, and opening of the Gulf of Aden. Journal of Geophysical Research: Solid Earth 115, article 2008JB006257.',
      'Augustin, N. et al. (2021) 13 million years of seafloor spreading throughout the Red Sea Basin. Nature Communications 12, 2427.',
      'ArRajehi, A. et al. (2010) Geodetic constraints on present-day motion of the Arabian Plate: implications for Red Sea and Gulf of Aden rifting. Tectonics 29, article 2009TC002482.',
    ],
    vetted: false,
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
    plain:
      'Eastern Africa is being pulled apart along this valley. The rifting began about 25 million years ago, most of the stretching that shaped today\'s valleys came within the last 12 million years, and the land is still moving apart.',
    caveats: [
      'Different parts of the rift started at different times, and the age of the western valleys is disputed (about 25 or about 12 million years).',
      'Around Addis Ababa, Lake Turkana, Nairobi and Arusha the region is a set of rough boxes drawn along the rift and its shoulders, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Michon, L., Famin, V. and Quidelleur, X. (2022) Evolution of the East African Rift System from trap-scale to plate-scale rifting. Earth-Science Reviews 231, 104089.',
      'Roberts, E.M. et al. (2012) Initiation of the western branch of the East African Rift coeval with the eastern branch. Nature Geoscience 5, 289-294.',
    ],
    vetted: false,
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
    plain:
      'The land between the Sierra Nevada and the Rocky Mountains is being stretched from east to west. Over about the last 17 million years it has broken into long blocks that tilted to form today\'s parallel ranges and valleys, and it is still stretching.',
    caveats: [
      'The stretching came in several episodes over about 50 million years and at different times in different places; the date given is for the episode that made the present ranges of Nevada and Utah.',
      'In the southern part of the region much of the stretching is older than the date given.',
      RESTS,
    ],
    sources: [
      'Dickinson, W.R. (2002) The Basin and Range Province as a composite extensional domain. International Geology Review 44, 1-38.',
      'Colgan, J.P. and Henry, C.D. (2009) Rapid middle Miocene collapse of the Mesozoic orogenic plateau in north-central Nevada. International Geology Review 51, 920-961.',
      'Bahadori, A., Holt, W.E. and Rasbury, E.T. (2018) Reconstruction modeling of crustal thickness and paleotopography of western North America since 36 Ma. Geosphere 14, 1207-1231.',
    ],
    vetted: false,
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
    plain:
      'The valley of the Rio Grande is a rift, a strip of crust that dropped as the land on either side pulled apart. Most of the movement happened between about 25 and 10 million years ago. In Colorado it began about 28 million years ago and has gone on to recent times.',
    caveats: [
      'The dates come from one study of how the rocks of the shoulders of the rift cooled as faulting lifted them, not from dated sediments in the valley.',
      'Whether the rift opened along its whole length at once or opened step by step northward is debated.',
      'Around Taos and in the upper Arkansas valley of Colorado the region is two rough boxes, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Ricketts, J.W. et al. (2016) Synchronous opening of the Rio Grande rift along its entire length at 25-10 Ma supported by apatite (U-Th)/He and fission-track thermochronology, and evaluation of possible driving mechanisms. Geological Society of America Bulletin 128, 397-424.',
      'Dickinson, W.R. (2002) The Basin and Range Province as a composite extensional domain. International Geology Review 44, 1-38.',
    ],
    vetted: false,
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
    plain:
      'Baja California was once joined to mainland Mexico. It began to pull away about 12 million years ago, the sea flooded in between about 8 and 6 million years ago, and the Gulf is still widening as Baja slides north-west.',
    caveats: [
      'The two sides are sliding past each other as much as pulling apart.',
      'The older date is when the stretching began; the boundary between the two plates settled into the Gulf only about 6 million years ago.',
      'On the Baja California side the region is a chain of rough boxes along the Gulf shore, so the link is weakest near their edges.',
      RESTS,
    ],
    sources: [
      'Oskin, M., Stock, J. and Martín-Barajas, A. (2001) Rapid localization of Pacific-North America plate motion in the Gulf of California. Geology 29, 459.',
      'Umhoefer, P.J. et al. (2018) Breaching of strike-slip faults and successive flooding of pull-apart basins to form the Gulf of California seaway from ca. 8-6 Ma. Geology 46, 695-698.',
      'Bennett, S.E.K. and Oskin, M.E. (2014) Oblique rifting ruptures continents: example from the Gulf of California shear zone. Geology 42, 215-218.',
    ],
    vetted: false,
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
    plain:
      'Lake Baikal fills a rift, a place where the crust of Asia is being pulled apart. The rift began to form about 30 million years ago, though most of its deep basins seem to have begun later, within the last several million years.',
    caveats: [
      'One group of researchers argues that the rift began far earlier, more than 66 million years ago.',
      'In the Barguzin valley, east of the lake, the region is a rough box, so the link is weakest near its edges.',
      RESTS,
    ],
    sources: [
      'Petit, C. and Déverchère, J. (2006) Structure and evolution of the Baikal rift: a synthesis. Geochemistry, Geophysics, Geosystems 7, article 2006GC001265.',
      'Mats, V.D. and Perepelova, T.I. (2011) A new perspective on evolution of the Baikal Rift. Geoscience Frontiers 2, 349-365.',
    ],
    vetted: false,
  },
];
