// The texts of the events listed in tectonic-events-rifts.ts, by id. Fetched when a visitor first opens one of them.
import type { TectonicText } from './tectonics';

const RESTS = 'The dates here come from the summaries of published papers, not from a reading of the full papers.';

export const TEXT: Record<string, TectonicText> = {
  'midcontinent-rift': {
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
  'iapetus-opening': {
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
  'central-atlantic': {
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
  'gulf-of-mexico': {
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
  'india-leaves-antarctica-australia': {
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
  'south-atlantic': {
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
  'bay-of-biscay': {
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
  'north-east-atlantic': {
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
  'australia-leaves-antarctica': {
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
  'tasman-sea': {
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
  'european-cenozoic-rift': {
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
  'south-china-sea': {
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
  'sea-of-japan': {
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
  'western-mediterranean': {
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
  'red-sea-gulf-of-aden': {
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
  'east-african-rift': {
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
  'basin-and-range': {
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
  'rio-grande-rift': {
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
  'gulf-of-california': {
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
  'baikal-rift': {
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
};
