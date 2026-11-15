// The texts of the events listed in tectonic-events-mountains.ts, by id. Fetched when a visitor first opens one of them.
import type { TectonicText } from './tectonics';

const REVIEWS = 'The dates come from the summaries of published reviews, not from a reading of the full papers.';

export const TEXT: Record<string, TectonicText> = {
  'himalayan': {
    plain:
      'About 59 million years ago India began to collide with Asia, and it is still pushing north today. The collision raised the Himalaya and the Tibetan Plateau and brought rock from deep in the crust up to the surface.',
    caveats: [
      'Geologists date the first contact between India and Asia anywhere from about 70 to 50 million years ago, depending on how the collision is defined.',
      'The mountain building came in phases: the main thrusting in the central range is dated at about 20 to 15 million years ago, and the two ends of the range were pushed up fastest within the last 10 million years.',
      'Much of the rock on the Tibetan Plateau and in the lower ranges is far older than the collision and was only lifted by it.',
      'The starting date comes from the title of one study and the rest from the summaries of published reviews, not from a reading of the full papers.',
    ],
    sources: [
      'Hu, X., Garzanti, E., Moore, T. and Raffi, I. (2015) Direct stratigraphic dating of India-Asia collision onset at the Selandian (middle Paleocene, 59 +/- 1 Ma). Geology 43, 859-862.',
      'Najman, Y. et al. (2010) Timing of India-Asia collision: geological, biostratigraphic, and palaeomagnetic constraints. Journal of Geophysical Research: Solid Earth 115(B12), article 2010JB007673.',
      'Kohn, M.J. (2014) Himalayan metamorphism and its tectonic implications. Annual Review of Earth and Planetary Sciences 42, 381-419.',
      'Hu, X., Garzanti, E., Wang, J., Huang, W., An, W. and Webb, A. (2016) The timing of India-Asia collision onset - facts, theories, controversies. Earth-Science Reviews 160, 264-299.',
    ],
    vetted: false,
  },
  'alpine': {
    plain:
      'About 35 million years ago a northern outlier of Africa collided with Europe, and the squeezing that followed raised the Alps. Rock that was buried deep during the collision is now exposed in the heart of the range.',
    caveats: [
      'The eastern Alps record an earlier phase of mountain building, about 130 to 85 million years ago, and oceans were closing here for tens of millions of years before the final collision.',
      'Much of the granite and gneiss in the Alps is older than this collision and was only reworked and lifted by it.',
      'The date of 35 million years comes from a second-hand summary of a published review, and whether the collision itself began then was not confirmed in the paper.',
    ],
    sources: [
      'Handy, M.R., Schmid, S.M., Bousquet, R., Kissling, E. and Bernoulli, D. (2010) Reconciling plate-tectonic reconstructions of Alpine Tethys with the geological-geophysical record of spreading and subduction in the Alps. Earth-Science Reviews 102, 121-158.',
      'Schmid, S.M., Fügenschuh, B., Kissling, E. and Schuster, R. (2004) Tectonic map and overall architecture of the Alpine orogen. Eclogae Geologicae Helvetiae 97, 93-117.',
      'Schlunegger, F. and Kissling, E. (2015) Slab rollback orogeny in the Alps and evolution of the Swiss Molasse basin. Nature Communications 6, 8605.',
    ],
    vetted: false,
  },
  'pyrenean': {
    plain:
      'From about 84 to 20 million years ago the block of crust that carries Spain and Portugal was pressed against France, raising the Pyrenees. The granite in the high central range is much older and was lifted up from below.',
    caveats: [
      'Some researchers end the convergence earlier, about 30 million years ago.',
      'The granite and metamorphic rock in the core of the range formed in a far earlier mountain-building episode; this event lifted them and did not make them.',
      'The Cantabrian Mountains to the west are included as the milder continuation of the same belt.',
      'Both dates are commonly quoted figures that were not traced to the papers behind them.',
    ],
    sources: [
      'Mouthereau, F. et al. (2014) Placing limits to shortening evolution in the Pyrenees: role of margin architecture and implications for the Iberia/Europe convergence. Tectonics 33, 2283-2314.',
      'Muñoz, J.A. (1992) Evolution of a continental collision belt: ECORS-Pyrenees crustal balanced cross-section. In: Thrust Tectonics, 235-246.',
    ],
    vetted: false,
  },
  'zagros': {
    plain:
      'About 30 million years ago Arabia began to collide with Asia, and the collision continues today. It has folded the rock layers into the long parallel ridges of the Zagros, the youngest of them within the last five million years.',
    caveats: [
      'Estimates of when the collision began range from about 35 to 20 million years ago.',
      'The folding moved southwest with time: the inner zone rose about 20 to 15 million years ago, the High Zagros about 12 to 8 million years ago, and the outer folds within the last 5 million years.',
      'The ridges are layers of sedimentary rock laid down long before the collision, and the metamorphic rock and granite of the inner zone are mostly older too; the collision folded and lifted them.',
      'The dates come from the summary of a published review, not from a reading of the full paper.',
    ],
    sources: [
      'Agard, P. et al. (2011) Zagros orogeny: a subduction-dominated process. Geological Magazine 148, 692-725.',
      'McQuarrie, N. and van Hinsbergen, D.J.J. (2013) Retrodeforming the Arabia-Eurasia collision zone: age of collision versus magnitude of continental subduction. Geology 41, 315-318.',
      'Mouthereau, F., Lacombe, O. and Vergés, J. (2012) Building the Zagros collisional orogen: timing, strain distribution and the dynamics of Arabia/Eurasia plate convergence. Tectonophysics 532-535, 27-60.',
    ],
    vetted: false,
  },
  'andean': {
    plain:
      'For about 100 million years the floor of the Pacific Ocean has been sinking beneath the edge of South America, squeezing and thickening the crust and feeding volcanoes. The Andes rose in pulses, and in the central Andes much of that rise came within about the last 20 million years.',
    caveats: [
      'Mountain building here came in bursts separated by quiet spells, and its timing differs along the length of the range; in the northern Andes, collisions with island chains and ocean plateaus also played a part.',
      'The figure of 100 million years for the start of the squeezing is a commonly quoted one that was not traced to the paper behind it; the published summaries say only that it began late in the Early Cretaceous or in the Late Cretaceous.',
      'Most of the metamorphic rock in the range is older than this event, and the region shown takes in the coastal strip and some lowland valleys beside the mountains.',
      REVIEWS,
    ],
    sources: [
      'Ramos, V.A. (2009) Anatomy and global context of the Andes: main geologic features and the Andean orogenic cycle. In: Backbone of the Americas, Geological Society of America Memoir 204, 31-65.',
      'Garzione, C.N. et al. (2008) Rise of the Andes. Science 320, 1304-1307.',
      'Garzione, C.N. et al. (2017) Tectonic evolution of the Central Andean Plateau and implications for the growth of plateaus. Annual Review of Earth and Planetary Sciences 45, 529-559.',
      'Horton, B.K. (2018) Sedimentary record of Andean mountain building. Earth-Science Reviews 178, 279-309.',
    ],
    vetted: false,
  },
  'sevier': {
    plain:
      'From about 125 to 50 million years ago, pressure from an ocean plate sinking beneath western North America pushed great sheets of rock eastward over one another here. The stacked and folded layers still form many of the ranges.',
    caveats: [
      'Thrusting moved eastward with time, so it happened earlier in the west of the belt than in the east.',
      'Some researchers start the thrusting earlier, in the Late Jurassic, about 155 million years ago.',
      'The rock in these ranges is mostly sedimentary rock laid down long before the thrusting, which stacked and folded it and did not make it.',
      'The dates come from a second-hand summary of a published review, not from a reading of the full paper; in the United States the region is drawn partly as rough rectangles.',
    ],
    sources: [
      'Yonkee, W.A. and Weil, A.B. (2015) Tectonic evolution of the Sevier and Laramide belts within the North American Cordillera orogenic system. Earth-Science Reviews 150, 531-593.',
      'DeCelles, P.G. (2004) Late Jurassic to Eocene evolution of the Cordilleran thrust belt and foreland basin system, western U.S.A. American Journal of Science 304, 105-168.',
    ],
    vetted: false,
  },
  'laramide': {
    plain:
      'About 70 to 50 million years ago, blocks of very old rock were pushed up through the younger layers above them to form the ranges of the Rocky Mountains. The rock in the cores of these ranges is far older than the mountains themselves.',
    caveats: [
      'The timing differed from place to place: mountain building began about 90 million years ago in the southwest, reached South Dakota about 60 million years ago, and ended in the southwest about 30 million years ago.',
      'The granite and gneiss in the cores of these ranges formed more than a billion years earlier; this event lifted them and did not make or change them.',
      'The western edge of the region shown also takes in ranges built by the earlier thrusting of the Sevier belt, and the gentle folds of the Colorado Plateau are left out.',
      'The dates of 70 to 50 million years come from a second-hand summary of a published review; the wider span comes from the summary of a published study.',
    ],
    sources: [
      'Copeland, P., Currie, C.A., Lawton, T.F. and Murphy, M.A. (2017) Location, location, location: the variable lifespan of the Laramide orogeny. Geology 45, 223-226.',
      'Yonkee, W.A. and Weil, A.B. (2015) Tectonic evolution of the Sevier and Laramide belts within the North American Cordillera orogenic system. Earth-Science Reviews 150, 531-593.',
    ],
    vetted: false,
  },
  'ancestral-rockies': {
    plain:
      "About 320 to 290 million years ago, long before today's Rockies, blocks of very old rock were pushed up here into a range of mountains. Rivers carried their rubble into the low ground alongside, where it hardened into red sandstone. Geologists still debate what pushed them up so far from the edge of the continent: a collision with South America and Africa to the south-east, plates grinding past the south-west coast, or both at once.",
    caveats: [
      'These mountains were worn down and buried by younger rock. The mountains here today were raised much later, on some of the same ground.',
      'Published dates for the start run from about 330 to 315 million years ago, and for the end from about 299 to 270 million, depending on whether the end is taken as the last movement on the faults or the burial of the highlands.',
      'The region is drawn as rough boxes around ground where the old rock of the uplifts lies at the surface today. The uplifts were larger than the boxes, and others in New Mexico, Oklahoma and Texas are left out.',
      'The dates and the debate come from the summaries of published papers, not from a reading of the full papers.',
    ],
    sources: [
      'Kluth, C.F. and Coney, P.J. (1981) Plate tectonics of the Ancestral Rocky Mountains. Geology 9, 10-15.',
      'Ye, H., Royden, L., Burchfiel, C. and Schuepbach, M. (1996) Late Paleozoic deformation of interior North America: the greater Ancestral Rocky Mountains. AAPG Bulletin 80, 1397-1432.',
      'Sweet, D.E., Brotherton, J.L., Chowdhury, N.U.M.K. and Ramsey, C.E. (2021) Tectonic subsidence analysis of the Ancestral Rocky Mountains from the interior to the southern margin. Palaeogeography, Palaeoclimatology, Palaeoecology 576, 110508.',
      'Leary, R.J., Umhoefer, P., Smith, M.E. and Riggs, N. (2017) A three-sided orogen: a new tectonic model for Ancestral Rocky Mountain uplift and basin development. Geology 45, 735-738.',
    ],
    vetted: false,
  },
  'alleghanian': {
    plain:
      'About 335 to 280 million years ago Africa collided with North America as the supercontinent Pangaea came together, pushing up a mountain range along what is now the Appalachians. Today\'s mountains are the worn remains of that range.',
    caveats: [
      'The collision began in the north and closed southward, so the dates differ along the range.',
      'Thrusting in the central Appalachians may have lasted until about 265 million years ago.',
      'In the Blue Ridge and the inner Piedmont this event mostly pushed and reheated rock that had already been changed by the two earlier episodes of mountain building.',
      'The starting date comes from the summary of a published study of dated minerals; the end date is from second-hand reports.',
    ],
    sources: [
      'Merschat, A.J., Bream, B.R., Huebner, M.T., Hatcher, R.D. and Miller, C.F. (2017) Temporal and spatial distribution of Paleozoic metamorphism in the southern Appalachian Blue Ridge and Inner Piedmont delimited by ion microprobe U-Pb ages of metamorphic zircon. In: Linkages and Feedbacks in Orogenic Systems, Geological Society of America Memoir 213, 199-254.',
      'Hatcher, R.D. (2002) Alleghanian (Appalachian) orogeny, a product of zipper tectonics: rotational transpressive continent-continent collision and closing of ancient oceans along irregular margins. In: Variscan-Appalachian Dynamics: The Building of the Late Paleozoic Basement, Geological Society of America Special Paper 364.',
      'Hatcher, R.D. (2010) The Appalachian orogen: a brief summary. In: From Rodinia to Pangea: The Lithotectonic Record of the Appalachian Region, Geological Society of America Memoir 206.',
    ],
    vetted: false,
  },
  'acadian': {
    plain:
      'About 420 to 350 million years ago small continents collided one after another with the edge of ancient North America, building mountains and melting rock into granite deep below. That granite and the surrounding metamorphic rock now lie at the surface.',
    caveats: [
      'The mountain building moved across the region over tens of millions of years, and geologists divide it into separate pulses with different names.',
      'In the southern Appalachians the dated rock of this episode spans about 395 to 340 million years ago.',
      'From Vermont to the Gaspé Peninsula, and in the southern Piedmont, this episode overprinted ground first deformed in the earlier Taconic episode, and the map cannot separate the two there.',
      REVIEWS,
    ],
    sources: [
      'van Staal, C.R., Whalen, J.B., Valverde-Vaquero, P., Zagorevski, A. and Rogers, N. (2009) Pre-Carboniferous, episodic accretion-related, orogenesis along the Laurentian margin of the northern Appalachians. Geological Society, London, Special Publications 327, 271-316.',
      'Merschat, A.J., Bream, B.R., Huebner, M.T., Hatcher, R.D. and Miller, C.F. (2017) Temporal and spatial distribution of Paleozoic metamorphism in the southern Appalachian Blue Ridge and Inner Piedmont delimited by ion microprobe U-Pb ages of metamorphic zircon. In: Linkages and Feedbacks in Orogenic Systems, Geological Society of America Memoir 213, 199-254.',
      'Hibbard, J.P., van Staal, C.R. and Rankin, D.W. (2010) Comparative analysis of the geological evolution of the northern and southern Appalachian orogen: Late Ordovician-Permian. In: From Rodinia to Pangea: The Lithotectonic Record of the Appalachian Region, Geological Society of America Memoir 206.',
    ],
    vetted: false,
  },
  'taconic': {
    plain:
      'About 475 to 450 million years ago chains of volcanic islands collided with the edge of ancient North America, folding and heating the rocks along what is now the Appalachians. It was the first of three mountain-building episodes here.',
    caveats: [
      'Later mountain building reheated many of these rocks, so the rock at a given spot may record more than one event.',
      'It came in three phases, the last of them a collision between two island chains about 460 to 450 million years ago; in the southern Appalachians the dated rock spans about 462 to 448 million years ago.',
      'The start is the less certain date: it is set by comparison with rocks of the same kind in Scotland and Ireland, and the first movements in Newfoundland are commonly put earlier still.',
      REVIEWS,
    ],
    sources: [
      'van Staal, C.R., Whalen, J.B., Valverde-Vaquero, P., Zagorevski, A. and Rogers, N. (2009) Pre-Carboniferous, episodic accretion-related, orogenesis along the Laurentian margin of the northern Appalachians. Geological Society, London, Special Publications 327, 271-316.',
      'Merschat, A.J., Bream, B.R., Huebner, M.T., Hatcher, R.D. and Miller, C.F. (2017) Temporal and spatial distribution of Paleozoic metamorphism in the southern Appalachian Blue Ridge and Inner Piedmont delimited by ion microprobe U-Pb ages of metamorphic zircon. In: Linkages and Feedbacks in Orogenic Systems, Geological Society of America Memoir 213, 199-254.',
      'Karabinos, P., Macdonald, F.A. and Crowley, J.L. (2017) Bridging the gap between the foreland and hinterland I: geochronology and plate tectonic geometry of Ordovician magmatism and terrane accretion on the Laurentian margin of New England. American Journal of Science 317, 515-554.',
      'Macdonald, F.A., Ryan-Davis, J., Coish, R.A., Crowley, J.L. and Karabinos, P. (2014) A newly identified Gondwanan terrane in the northern Appalachian Mountains: implications for the Taconic orogeny and closure of the Iapetus Ocean. Geology 42, 539-542.',
    ],
    vetted: false,
  },
  'grampian': {
    plain:
      'About 475 to 465 million years ago a chain of volcanic islands collided with the edge of an ancient continent here, folding and heating the rocks of the Highlands.',
    caveats: [
      'The Caledonian mountains were built in several separate episodes over about 80 million years, and the dates differ between Scotland, Ireland and Scandinavia.',
      'The region is drawn as rough rectangles around the Scottish Highlands, Shetland, Donegal, Mayo and Connemara, so it is only approximate at its edges.',
      'The dates come from the summary of a published review, not from a reading of the full paper.',
    ],
    sources: [
      'Chew, D.M. and Strachan, R.A. (2014) The Laurentian Caledonides of Scotland and Ireland. Geological Society, London, Special Publications 390, 45-91.',
      'Gee, D.G., Fossen, H., Henriksen, N. and Higgins, A.K. (2008) From the Early Paleozoic platforms of Baltica and Laurentia to the Caledonide orogen of Scandinavia and Greenland. Episodes 31, 44-51.',
    ],
    vetted: false,
  },
  'scandian': {
    plain:
      'About 430 to 400 million years ago the continent that is now Scandinavia collided with the one that is now Greenland and North America, raising a mountain range along the join. The mountains of Norway and Scotland today are its deeply worn roots, lifted again much later.',
    caveats: [
      'The Caledonian mountains were built in several separate episodes over about 80 million years, and the dates differ between Scotland, Ireland and Scandinavia.',
      'In Scotland this phase is dated at about 435 to 425 million years ago and is confined to the Highlands north of the Great Glen; the region shown also takes in the rest of Scotland, the Hebrides and the north of Ireland, where the main mountain building came earlier.',
      'The dates of 430 and 400 million years for Scandinavia are commonly quoted figures that were not traced to the papers behind them.',
    ],
    sources: [
      'Chew, D.M. and Strachan, R.A. (2014) The Laurentian Caledonides of Scotland and Ireland. Geological Society, London, Special Publications 390, 45-91.',
      'Corfu, F., Andersen, T.B. and Gasser, D. (2014) The Scandinavian Caledonides: main features, conceptual advances and critical questions. Geological Society, London, Special Publications 390, 9-43.',
      'Gee, D.G., Fossen, H., Henriksen, N. and Higgins, A.K. (2008) From the Early Paleozoic platforms of Baltica and Laurentia to the Caledonide orogen of Scandinavia and Greenland. Episodes 31, 44-51.',
    ],
    vetted: false,
  },
  'variscan': {
    plain:
      'About 360 to 290 million years ago the continents that are now Africa and Europe collided, raising a wide mountain belt across what is now Spain, France, Germany and Czechia and along the northwest edge of Africa. Those mountains have long since worn away; the granite and gneiss at the surface today formed deep in their roots.',
    caveats: [
      'The dates are for the main collision. Earlier collisions of smaller landmasses began about 400 million years ago, and the timing differs from one part of Europe to another.',
      'Under the Paris Basin and other lowlands the rock of this belt lies buried beneath younger layers, and the region shown includes them.',
      'In the Anti-Atlas of Morocco the event only gently folded rock that is far older.',
      'The dates come from the title and summaries of published reviews, not from a reading of the full papers.',
    ],
    sources: [
      'Matte, P. (2001) The Variscan collage and orogeny (480-290 Ma) and the tectonic definition of the Armorica microplate: a review. Terra Nova 13, 122-128.',
      'Franke, W. (2000) The mid-European segment of the Variscides: tectonostratigraphic units, terrane boundaries and plate tectonic evolution. Geological Society, London, Special Publications 179, 35-61.',
      'Kroner, U. and Romer, R.L. (2013) Two plates - many subduction zones: the Variscan orogeny reconsidered. Gondwana Research 24, 298-329.',
    ],
    vetted: false,
  },
  'uralian': {
    plain:
      'About 380 to 250 million years ago an ocean closed here and two continents collided, building the Ural Mountains along the join. The range has been worn down since, and was lifted a little again in recent geological time.',
    caveats: [
      'The collision began earlier in the south than in the north: first a chain of volcanic islands met the edge of the continent, and the continents themselves collided from about 325 million years ago.',
      'The far northern continuation through Novaya Zemlya, which the region shown includes, is thought to have been folded somewhat later.',
      'The review behind this entry gives the timing as Late Devonian to Late Permian; the figures in millions of years are the usual ones for those periods.',
    ],
    sources: [
      'Puchkov, V.N. (2009) The evolution of the Uralian orogen. Geological Society, London, Special Publications 327, 161-195.',
      'Brown, D. et al. (2008) Mountain building processes during continent-continent collision in the Uralides. Earth-Science Reviews 89, 177-195.',
    ],
    vetted: false,
  },
  'central-asian': {
    plain:
      'Central Asia was put together piece by piece: over hundreds of millions of years, chains of volcanic islands and small continents were swept together here, and the last ocean between them closed about 300 to 250 million years ago. The high ranges of today, such as the Tian Shan and the Altai, are made of that old rock and were raised much later.',
    caveats: [
      'This was not a single event. Different parts of Central Asia were assembled at very different times, and the date shown is only for the final closing.',
      'The whole build-up ran from about 1,000 to 250 million years ago, and researchers place the final closing either in the Permian or as late as the Triassic.',
      'The figure of 300 million years for the start of the final closing is a rounding of the Permian period and is not given in the published summaries.',
    ],
    sources: [
      'Windley, B.F., Alexeiev, D., Xiao, W., Kröner, A. and Badarch, G. (2007) Tectonic models for accretion of the Central Asian Orogenic Belt. Journal of the Geological Society 164, 31-47.',
      'Xiao, W. et al. (2015) A tale of amalgamation of three Permo-Triassic collage systems in Central Asia: oroclines, sutures, and terminal accretion. Annual Review of Earth and Planetary Sciences 43, 477-507.',
    ],
    vetted: false,
  },
  'qinling-dabie': {
    plain:
      'About 250 to 200 million years ago the two blocks that make up northern and southern China collided along this line, raising a mountain belt. Some of the rock here was dragged very deep during the collision before returning to the surface.',
    caveats: [
      'This mountain belt was built in several stages; the dates given are for the last major collision.',
      'Dated rock from the deepest part of the collision clusters between about 240 and 210 million years ago.',
      'The Qinling part of the region is drawn as a rough rectangle, so it is only approximate at its edges.',
      'The dates are commonly quoted figures that were not traced to the papers behind them.',
    ],
    sources: [
      'Dong, Y. and Santosh, M. (2016) Tectonic architecture and multiple orogeny of the Qinling Orogenic Belt, Central China. Gondwana Research 29, 1-40.',
      'Hacker, B.R., Ratschbacher, L., Webb, L., Ireland, T., Walker, D. and Dong, S. (1998) U/Pb zircon ages constrain the architecture of the ultrahigh-pressure Qinling-Dabie Orogen, China. Earth and Planetary Science Letters 161, 215-230.',
      'Liu, F.L. and Liou, J.G. (2011) Zircon as the best mineral for P-T-time history of UHP metamorphism: a review on mineral inclusions and U-Pb SHRIMP ages of zircons from the Dabie-Sulu UHP rocks. Journal of Asian Earth Sciences 40, 1-39.',
    ],
    vetted: false,
  },
  'cape': {
    plain:
      'About 275 to 250 million years ago, when Africa was part of the supercontinent Gondwana, the layered sandstones here were squeezed into great folds. Those folds, since carved by erosion, form the Cape mountains; the rock itself is older than the folding.',
    caveats: [
      'Why these folds formed so far from the edge of the ancient continent is still debated.',
      'The dated minerals fall into two groups, about 276 to 261 and about 255 to 248 million years old, read either as folding followed by cooling or as two separate events.',
      'The sandstone and shale were laid down long before and were folded here, not made or deeply changed; the granite at Cape Town is far older than the folds.',
      'The dates come from second-hand summaries of two dating studies in South Africa; the folds of the Sierra de la Ventana in Argentina and of the Falkland Islands are linked to them by a commonly stated correlation.',
    ],
    sources: [
      'Hansma, J., Tohver, E., Schrank, C., Jourdan, F. and Adams, D. (2016) The timing of the Cape Orogeny: new 40Ar/39Ar age constraints on deformation and cooling of the Cape Fold Belt, South Africa. Gondwana Research 32, 122-137.',
      'Blewett, S.C.J., Phillips, D. and Matchan, E.L. (2019) Provenance of Cape Supergroup sediments and timing of Cape Fold Belt orogenesis: constraints from high-precision 40Ar/39Ar dating of muscovite. Gondwana Research 70, 201-221.',
      'Ramos, V.A. (2009) Anatomy and global context of the Andes: main geologic features and the Andean orogenic cycle. In: Backbone of the Americas, Geological Society of America Memoir 204, 31-65.',
    ],
    vetted: false,
  },
  'east-african': {
    plain:
      'About 650 to 550 million years ago an ocean closed here and landmasses collided to form the supercontinent Gondwana, raising a mountain belt that ran from Arabia through East Africa to Madagascar, southern India and Sri Lanka. The mountains are long gone; the rock at the surface comes from deep inside them.',
    caveats: [
      'The north of this belt was assembled earlier, from about 850 million years ago, and the south was affected by a second collision that lasted until about 500 million years ago.',
      'Whether the earlier and later collisions were two separate events or stages of one is not settled.',
      'Along the Nile, under the lava plateaus of Ethiopia and Yemen and beneath the coastal plains, the rock of this belt is buried under younger rock, and the region shown includes those places.',
      'The dates come from a second-hand summary of a published review, not from a reading of the full paper.',
    ],
    sources: [
      'Fritz, H. et al. (2013) Orogen styles in the East African Orogen: a review of the Neoproterozoic to Cambrian tectonic evolution. Journal of African Earth Sciences 86, 65-106.',
      'Stern, R.J. (1994) Arc assembly and continental collision in the Neoproterozoic East African Orogen: implications for the consolidation of Gondwanaland. Annual Review of Earth and Planetary Sciences 22, 319-351.',
      'Collins, A.S. and Pisarevsky, S.A. (2005) Amalgamating eastern Gondwana: the evolution of the Circum-Indian Orogens. Earth-Science Reviews 71, 229-270.',
    ],
    vetted: false,
  },
  'grenville': {
    plain:
      'About 1,090 to 980 million years ago two continents collided here, building a great mountain belt along what is now eastern Canada. Erosion has removed the mountains entirely; the rock at the surface was once many kilometers down in their roots.',
    caveats: [
      'The dates are for the final collision, which came in two phases; the same ground had been through earlier upheavals over the previous 150 million years or more.',
      'In the lowlands along the St. Lawrence River and in upstate New York the rock of this belt is buried beneath younger flat-lying layers, and the region shown includes them.',
      'The dates come from the summary of a published review, not from a reading of the full paper.',
    ],
    sources: [
      'Rivers, T. (2009) The Grenville Province as a large hot long-duration collisional orogen - insights from the spatial and thermal evolution of its orogenic fronts. Geological Society, London, Special Publications 327, 405-444.',
      'Rivers, T. (2008) Assembly and preservation of lower, mid, and upper orogenic crust in the Grenville Province - Implications for the evolution of large hot long-duration orogens. Precambrian Research 167, 237-259.',
      'Hynes, A. and Rivers, T. (2010) Protracted continental collision - evidence from the Grenville Orogen. Canadian Journal of Earth Sciences 47, 591-620.',
    ],
    vetted: false,
  },
  'trans-hudson': {
    plain:
      'About 1.9 to 1.8 billion years ago an ocean closed here and ancient continents collided, welding together the core of North America. The mountains themselves vanished long ago, and only their deep roots remain.',
    caveats: [
      'Rocks this old have been through later events too, and most of this ancient belt is hidden under younger rock; south of central Saskatchewan and Manitoba it lies buried beneath the prairies.',
      'Researchers compare the scale, duration and character of this collision with the one between India and Asia today; that comparison rests on the structure of the rocks, not on any measurement of how the land once stood.',
      'The collision came in stages, with the final meeting of the continents dated at about 1.83 to 1.80 billion years ago.',
      'The dates come from the summary of a published review, not from a reading of the full paper.',
    ],
    sources: [
      'Corrigan, D., Pehrsson, S., Wodicka, N. and de Kemp, E. (2009) The Palaeoproterozoic Trans-Hudson Orogen: a prototype of modern accretionary processes. Geological Society, London, Special Publications 327, 457-479.',
      'St-Onge, M.R., Searle, M.P. and Wodicka, N. (2006) Trans-Hudson Orogen of North America and Himalaya-Karakoram-Tibetan Orogen of Asia: structural and thermal characteristics of the lower and upper plates. Tectonics 25(4), article 2005TC001907.',
      'Weller, O.M. and St-Onge, M.R. (2017) Record of modern-style plate tectonics in the Palaeoproterozoic Trans-Hudson orogen. Nature Geoscience 10, 305-311.',
    ],
    vetted: false,
  },
  'svecofennian': {
    plain:
      'About 1.9 to 1.8 billion years ago chains of volcanic islands and small continents were pressed together here, building a mountain belt across what is now Finland and Sweden. Only the deep roots remain, exposed as the hard granite and gneiss of the Nordic bedrock.',
    caveats: [
      'The belt was built in several stages that overlapped, and geologists place the stage boundaries a little differently; ranges of about 1.92 to 1.76 and about 1.88 to 1.79 billion years ago are also in use.',
      'South and east of the Gulf of Finland the belt continues beneath younger rock, and the region shown includes that buried part.',
      'The dates come from the summary of a published review, not from a reading of the full paper.',
    ],
    sources: [
      'Korja, A., Lahtinen, R. and Nironen, M. (2006) The Svecofennian orogen: a collage of microcontinents and island arcs. Geological Society, London, Memoirs 32, 561-578.',
      'Lahtinen, R., Korja, A., Nironen, M. and Heikkinen, P. (2009) Palaeoproterozoic accretionary processes in Fennoscandia. Geological Society, London, Special Publications 318, 237-256.',
      'Nironen, M. (1997) The Svecofennian Orogen: a tectonic model. Precambrian Research 86, 21-44.',
    ],
    vetted: false,
  },
  'delamerian': {
    plain:
      'About 514 to 490 million years ago this was the edge of the supercontinent Gondwana, and the rocks along it were squeezed, folded and heated. Rock folded at that time is found from the Mount Lofty and Flinders Ranges of South Australia through western Victoria to western Tasmania.',
    caveats: [
      'This was the first of a long series of short squeezing episodes, separated by quieter times, that built eastern Australia; it was not a single collision.',
      'The same event is traced into Antarctica, which then lay alongside.',
      'The dates come from one dating study, known here at second hand, which gives the squeezing as lasting from about 514 to 490 million years ago with an uncertainty of about 3 million years on each figure.',
    ],
    sources: [
      'Foden, J., Elburg, M.A., Dougherty-Page, J. and Burtt, A. (2006) The timing and duration of the Delamerian Orogeny: correlation with the Ross Orogen and implications for Gondwana assembly. The Journal of Geology 114, 189-210.',
      'Glen, R.A. (2005) The Tasmanides of eastern Australia. Geological Society, London, Special Publications 246, 23-96.',
      'Rosenbaum, G. (2018) The Tasmanides: Phanerozoic tectonic evolution of eastern Australia. Annual Review of Earth and Planetary Sciences 46, 291-325.',
    ],
    vetted: false,
  },
  'lachlan': {
    plain:
      'From about 450 to 340 million years ago this was the edge of the supercontinent Gondwana, where deep-sea sediment and volcanic islands were squeezed against the continent in several bursts and large bodies of granite formed below. Eastern Australia was built up in this way, belt by belt.',
    caveats: [
      'This was a long series of short squeezing episodes separated by quieter times, not a single collision; the strongest came at about 440 to 430 and about 400 to 380 million years ago.',
      'In the west the belt is hidden beneath the plains of the Murray Basin, and the region shown includes part of them.',
      'The dates come from the summary of a published review, which ends the episodes in early Carboniferous times; the figure of 340 million years stands for that.',
    ],
    sources: [
      'Foster, D.A. and Gray, D.R. (2000) Evolution and structure of the Lachlan Fold Belt (Orogen) of eastern Australia. Annual Review of Earth and Planetary Sciences 28, 47-80.',
      'Glen, R.A. (2005) The Tasmanides of eastern Australia. Geological Society, London, Special Publications 246, 23-96.',
      'Gray, D.R. and Foster, D.A. (2004) Tectonic evolution of the Lachlan Orogen, southeast Australia: historical review, data synthesis and modern perspectives. Australian Journal of Earth Sciences 51, 773-817.',
    ],
    vetted: false,
  },
  'new-england': {
    plain:
      'About 265 to 230 million years ago the eastern edge of the supercontinent Gondwana was squeezed again as ocean floor sank beneath it, folding the rocks of what is now northeastern New South Wales and coastal Queensland. It was the last of the squeezing episodes that built eastern Australia belt by belt.',
    caveats: [
      'This was one of a long series of short squeezing episodes separated by quieter times, not a single collision.',
      'Published work places the end of the episode between about 235 and 230 million years ago.',
      'The dates are known here at second hand from two published studies, not from a reading of the full papers.',
    ],
    sources: [
      'Jessop, K., Daczko, N.R. and Piazolo, S. (2019) Tectonic cycles of the New England Orogen, eastern Australia: a review. Australian Journal of Earth Sciences 66, 459-496.',
      'Li, P.-F., Rosenbaum, G. and Rubatto, D. (2012) Triassic asymmetric subduction rollback in the southern New England Orogen (eastern Australia): the end of the Hunter-Bowen Orogeny. Australian Journal of Earth Sciences 59, 965-981.',
      'Rosenbaum, G. (2018) The Tasmanides: Phanerozoic tectonic evolution of eastern Australia. Annual Review of Earth and Planetary Sciences 46, 291-325.',
    ],
    vetted: false,
  },
  'kaikoura': {
    plain:
      'For about the last 8 million years two plates have been grinding together here, pushing up the Southern Alps along the Alpine Fault. The rock is still being pushed up, by several millimeters a year in places, and erosion wears the mountains down almost as fast.',
    caveats: [
      'The rock itself is much older than the mountains: it formed during an earlier mountain-building episode more than 100 million years ago, and this event only lifted it.',
      'The rise began about 8 million years ago in the south of the range, about 5 million years ago in the north and about 3 million years ago along its southeastern edge.',
      'The plate boundary itself is older, and this episode is often said to have begun about 25 million years ago; that is a commonly quoted figure that was not traced to the paper behind it.',
      'The dates come from the summaries of two dating studies; the region is drawn as rough rectangles around Fiordland, the Southern Alps and the Kaikōura ranges, and the ranges of the North Island are left out.',
    ],
    sources: [
      'Tippett, J.M. and Kamp, P.J.J. (1993) Fission track analysis of the Late Cenozoic vertical kinematics of continental Pacific crust, South Island, New Zealand. Journal of Geophysical Research: Solid Earth 98, 16119-16148.',
      'Kamp, P.J.J., Green, P.F. and White, S.H. (1989) Fission track analysis reveals character of collisional tectonics in New Zealand. Tectonics 8, 169-195.',
      'Sutherland, R. (1999) Cenozoic bending of New Zealand basement terranes and Alpine Fault displacement: a brief review. New Zealand Journal of Geology and Geophysics 42, 295-301.',
    ],
    vetted: false,
  },
  'taiwan': {
    plain:
      'About 6.5 million years ago a chain of volcanic islands began to collide with the edge of Asia, pushing up the mountains of Taiwan. The collision continues, and the island is still rising.',
    caveats: [
      'Estimates of when the collision began range from about 6.5 to 3 million years ago.',
      'Researchers also disagree on whether the collision spread southward along the island or began along its whole length at once.',
      'The figure of 6.5 million years is widely repeated in research papers but was not traced to the paper behind it; the region is drawn as rough rectangles around the mountains.',
    ],
    sources: [
      'Huang, C.-Y., Yuan, P.B. and Tsao, S.-J. (2006) Temporal and spatial records of active arc-continent collision in Taiwan: a synthesis. Geological Society of America Bulletin 118, 274-288.',
      'Teng, L.S. (1990) Geotectonic evolution of late Cenozoic arc-continent collision in Taiwan. Tectonophysics 183, 57-76.',
    ],
    vetted: false,
  },
  'new-guinea': {
    plain:
      'About 12 million years ago the northern edge of the Australian continent began colliding with volcanic island chains to its north, raising the central mountains of New Guinea. Mountain building continues along the north coast today.',
    caveats: [
      'Geologists disagree about how many separate collisions built this island and when each took place.',
      'The main belt was built from about 12 to 4 million years ago; that mountain building continues on the north coast is a commonly made statement that was not traced to the paper behind it.',
      'The eastern tail of the island, part of which lies in the region shown, was raised in an earlier event about 35 to 30 million years ago.',
      'The dates come from the summaries of published studies, not from a reading of the full papers.',
    ],
    sources: [
      'Hill, K.C. and Raza, A. (1999) Arc-continent collision in Papua Guinea: constraints from fission track thermochronology. Tectonics 18, 950-966.',
      'van Ufford, A.Q. and Cloos, M. (2005) Cenozoic tectonics of New Guinea. AAPG Bulletin 89, 119-140.',
      'Baldwin, S.L., Fitzgerald, P.G. and Webb, L.E. (2012) Tectonics of the New Guinea region. Annual Review of Earth and Planetary Sciences 40, 495-520.',
    ],
    vetted: false,
  },
  'cordilleran-arc': {
    plain:
      'Between about 170 and 50 million years ago a long chain of volcanoes stood here above a sinking ocean plate. The volcanoes have eroded away, and the granite that cooled in their roots now forms the mountains.',
    caveats: [
      'The granite formed in many separate pulses over this long span; most of the granite of the Sierra Nevada is commonly dated at about 120 to 85 million years old.',
      'The ranges of today are later relief cut into the granite, not the volcanic chain itself.',
      'Both dates are commonly quoted figures that were not traced to the papers behind them.',
    ],
    sources: [
      'Dickinson, W.R. (2004) Evolution of the North American Cordillera. Annual Review of Earth and Planetary Sciences 32, 13-45.',
      'Ducea, M. (2001) The California arc: thick granitic batholiths, eclogitic residues, lithospheric-scale thrusting, and magmatic flare-ups. GSA Today 11(11), 4.',
      'Gehrels, G. et al. (2009) U-Th-Pb geochronology of the Coast Mountains batholith in north-coastal British Columbia: constraints on age and tectonic evolution. Geological Society of America Bulletin 121, 1341-1361.',
    ],
    vetted: false,
  },
};
