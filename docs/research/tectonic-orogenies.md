# Dossier: mountain-building events (orogenies) for the timeline

Research notes behind the site's texts and pictures, not text written for visitors, except the lines headed "For visitors" and "Caveat for visitors". Compiled 14 November 2026.

**Status: complete as a first pass.** All 26 entries are written. No full text was read: dates rest on abstracts, on second-hand summaries of abstracts, or on memory, each tagged. All boxes are from memory and unchecked against a map. Entries 3, 15, 18, 22a, 22c and 26 have dates from memory and should not be shown before a reader checks them.

## How to read this

- **Citations.** Every citation was looked up in the Crossref database (api.crossref.org) for authors, year, title, journal, volume, pages and DOI. Anything not found there is marked **UNVERIFIED**. Author lists longer than seven are shortened to the first three plus "et al." with the author count. Where Crossref holds no page numbers (some book chapters) the entry says so.
- **Facts.** Each fact carries a tag:
  - **[abstract]** read in the paper's own abstract (mostly as deposited by the publisher in Crossref; these were read to about 1,200 characters, a few to 3,000, so a fact from the end of a long abstract may have been missed).
  - **[full text]** read in open-access full text. (None in this dossier: no full text was read.)
  - **[secondary]** seen only in a web-search summary of the abstract, a citing paper, a conference abstract or an encyclopedia; check before use.
  - **[memory]** widely repeated, but not confirmed in a source during this work; check before use.
  - **[title]** stated in the title of a paper whose citation was verified (used for a few age ranges that authors put in titles).
- **Dates.** "Start" and "End" are the single figures proposed for the app, in millions of years (Ma). Every orogeny is diachronous (it began and ended at different times along its length), so each pair is a judgement; the entry says what it rests on. Period names follow the International Chronostratigraphic Chart, but **the chart was not re-read during this work**: where a source gives only a period name ("Late Devonian"), the Ma figures beside it are from memory of the 2023–2024 chart, rounded to the nearest million years, and are tagged [memory].
- **Boxes** are `[south, west, north, east]` in decimal degrees. They were drawn by hand from general knowledge of where each belt lies, not traced from a map, and are **[memory]** throughout. They are generous by about half a degree and each entry says what ground they wrongly take in. Treat them as a fallback and have them checked against a map before release.
- **Provinces** are rows of the table made from Hasterok et al. 2022 (`main-provinces.tsv`, 921 rows), given as "id Name". The assignment of provinces to orogenies is mine, made from the province names and their bounding-box corners only; **I did not see the province outlines.** The map's `last_orogeny` classes are broad, and where they clash with the literature the entry says so.
- **"Kind"** in the table: *collision* = two continents; *arc collision* = a volcanic island chain or small continent hitting a continent; *accretion* = long build-up of many such pieces; *subduction* = ocean floor sinking beneath a continent's edge; *intraplate* = folding far from a plate edge.
- **A general limit on what the app may say.** For no orogeny older than about 60 Ma did I find a direct, published measurement of how high the mountains stood. Statements such as "as high as the Himalaya" are analogies drawn from crustal thickness, metamorphic pressure or the volume of eroded sediment. Entries note where authors make such analogies; none should be turned into a stated height.

## Summary table

Confidence is for the two dates: **high** = both figures read in a paper's abstract; **medium** = one figure from an abstract, or both from a second-hand summary of the abstract; **low** = one or both figures from memory.

| # | Name | Start (Ma) | End (Ma) | Kind | Continents | Confidence |
|---|---|---|---|---|---|---|
| 1 | Himalayan–Tibetan | 59 | 0 (active) | collision | Asia | medium (start disputed, 70–50) |
| 2 | Alpine (Alps) | 35 | 0 (active) | collision | Europe | medium |
| 3 | Pyrenean | 84 | 20 | collision | Europe | low |
| 4 | Zagros | 30 | 0 (active) | collision | Asia | high for 30; disputed 35–20 |
| 5 | Andean | 100 | 0 (active) | subduction | South America | medium |
| 6 | Sevier | 125 | 50 | subduction (thrust belt) | North America | medium (start 155 also used) |
| 7 | Laramide | 70 | 50 | subduction (basement uplifts) | North America | medium (whole span 90–30, high) |
| 8 | Alleghanian | 335 | 280 | collision | North America | medium |
| 9 | Acadian with Neoacadian | 420 | 350 | arc collision (small continents) | North America | high |
| 10 | Taconic | 475 | 450 | arc collision | North America | medium (end high, start by correlation) |
| 11a | Caledonian, Grampian phase | 475 | 465 | arc collision | Europe (Scotland, Ireland) | high |
| 11b | Caledonian, Scandian phase | 430 | 400 | collision | Europe, Greenland | low for Scandinavia; 435–425 high for Scotland |
| 12 | Variscan (Hercynian) | 360 | 290 | collision | Europe, north-west Africa | medium |
| 13 | Uralian | 380 | 250 | arc collision, then collision | Europe/Asia | medium (periods from abstract, Ma from memory) |
| 14 | Central Asian Orogenic Belt | 300 (whole: 1000) | 250 | accretion | Asia | high for 1000–250; low for 300 |
| 15 | Qinling–Dabie (Indosinian) | 250 | 200 | collision | Asia | low |
| 16 | Cape (Gondwanide) | 275 | 250 | intraplate | Africa (and South America) | medium |
| 17 | East African Orogen, with Kuunga | 650 | 550 | accretion, then collision | Africa, Arabia, Madagascar, India | medium |
| 18 | Brasiliano | 660 | 500 | several collisions | South America | low |
| 19 | Grenville (Sveconorwegian noted) | 1090 | 980 | collision | North America (Europe) | high |
| 20 | Trans-Hudson | 1920 | 1800 | collision | North America, Greenland | high |
| 21 | Svecofennian | 1920 | 1790 | accretion, then collision | Europe | high |
| 22a | Tasmanides: Delamerian | 514 | 490 | accretion | Australia | low |
| 22b | Tasmanides: Lachlan | 450 | 340 | accretion | Australia | medium |
| 22c | Tasmanides: New England (Hunter–Bowen) | 265 | 230 | accretion | Australia | low |
| 23 | Kaikōura (Southern Alps) | 8 | 0 (active) | oblique plate boundary | Zealandia | high |
| 24 | Taiwan (Penglai) | 6.5 | 0 (active) | arc collision | Asia | medium (disputed 6.5–3) |
| 25 | New Guinea | 12 | 0 (active) | arc collision | Australasia | high for 12–4 |
| 26 | Cordilleran arc and accreted terranes (optional) | 170 | 50 | subduction (volcanic arc) | North America | low |

By continent: North America 8; Europe 6 (with the Urals); Asia 6; South America 2 (plus the Sierra de la Ventana under 16); Africa 2 (plus Morocco under 12); Australasia and Zealandia 3. Africa and South America are the thinnest; see "Gaps" in the notes at the end.

---

## 1. Himalayan–Tibetan orogeny

1. **Names.** Himalayan orogeny; Himalayan–Tibetan (or Himalaya–Karakoram–Tibet) orogen; India–Asia collision. Part of the "Alpine–Himalayan" system.
2. **Age: use 59 Ma to today (still going on).**
   - Start 59: Hu et al. 2015 date the onset at "59 ± 1 Ma" from fossils and detrital zircon in one Tibetan section [title; the method is from a search summary, secondary].
   - Disagreement: Najman et al. 2010 find the youngest marine rock at 50.6–52.8 Ma and "initial contact between the continents in the early Eocene" [abstract]; Yin & Harrison 2000 put the onset "at about 70 Ma" with significant shortening from the Eocene, 50–40 Ma [abstract]. Much of the spread is in what counts as "collision" [abstract: Najman]. A start of 50 is equally defensible for "mountains rising".
   - Phases (Kohn 2014) [abstract]: deeply buried rock brought up at 45 Ma or earlier in the north-west; main thrusting on the Main Central Thrust about 20–15 Ma; rapid exhumation at the two ends of the range at 10 Ma or later.
3. **Cause.** India, moving north, collided with Asia after the ocean between them (Neo-Tethys) closed; at least 1,400 km of shortening has been taken up since [abstract: Yin & Harrison 2000].
4. **Extent.**
   - Boxes, Himalaya: Kashmir, Ladakh, Karakoram `[32.5, 72.5, 37.0, 78.0]`; Himachal and Uttarakhand `[29.5, 77.0, 33.0, 81.5]`; western Nepal `[27.0, 80.0, 30.5, 84.5]`; eastern Nepal and Sikkim `[26.5, 84.5, 29.0, 88.8]`; Bhutan and Arunachal `[26.5, 88.5, 29.6, 97.5]`. Each takes in a strip of the flat Ganges or Brahmaputra plain along its southern edge.
   - Box, Tibetan Plateau (raised by the same collision, but made of older rock): `[28.5, 79.0, 36.0, 103.0]`. Use only for "this ground was lifted", not for "this rock formed then".
   - Zones, south to north: Sub-Himalaya (Siwaliks), Lesser Himalaya, Greater (High) Himalaya, Tethyan Himalaya, Indus–Yarlung suture, Lhasa terrane, Qiangtang terrane, Songpan-Ganzi, Kunlun [memory].
   - Provinces: 348 Himalayan Orogenic Belt; 162 Kohistan Arc; 163 Ladakh Arc; 126 Karakoram Province; 161 Lhasa Terrane; 127 Qiangtang Terrane; 247 Songpan-Ganzi Hoh-Xil Terrane; 248 Kunlun/South Qilian Fold Belt; 213 Qilian Shan; 246 Central Pamir; 356 North Pamir; 357 South Pamir; 536 Pakistan Fold and Thrust Belt; 253 Indo-Burmese Ranges.
   - Poor fits: three different provinces are all named "Himalayan Foreland Basin" (541, 791, 792) and are classed Rayner-Ghats, East African and cratonic; they are the plains in front of the range and should not get this entry. The class "Alpine-Himalayan" runs from Spain to Indonesia and cannot stand for this event alone.
5. **Surface today.** The highest mountains on Earth. The range "exposes a spectacular assemblage of metamorphic rocks from the mid- and deep crust" (Kohn 2014) [abstract], with pale granite of about 20 Ma [memory]. In the Lesser Himalaya and on the plateau much of the rock is far older and was only lifted.
6. **Claims.** Height through time has been measured from oxygen isotopes: central Tibet (Rowley & Currie 2006, late Eocene to Miocene) and the High Himalaya since the Late Miocene (Rowley et al. 2001) [titles; the usual reading, that these areas were already above 4 km, is from memory]. A high "Andean-type" range may have stood on Asia's edge before the collision (Ding et al. 2014) [title]. The app may say the mountains have been high for millions of years; a figure needs these papers read first.
7. **For visitors.** "About 59 million years ago India began to collide with Asia, and it is still pushing north today. The collision raised the Himalaya and the Tibetan Plateau and brought rock from deep in the crust up to the surface."
8. **Sources.**
   - Hu, X., Garzanti, E., Moore, T. & Raffi, I. 2015. Direct stratigraphic dating of India-Asia collision onset at the Selandian (middle Paleocene, 59 ± 1 Ma). *Geology* 43(10): 859–862. doi:10.1130/g36872.1
   - Hu, X., Garzanti, E., Wang, J., Huang, W., An, W. & Webb, A. 2016. The timing of India-Asia collision onset – facts, theories, controversies. *Earth-Science Reviews* 160: 264–299. doi:10.1016/j.earscirev.2016.07.014
   - Najman, Y., Appel, E., Boudagher-Fadel, M., et al. [12 authors] 2010. Timing of India-Asia collision: geological, biostratigraphic, and palaeomagnetic constraints. *Journal of Geophysical Research: Solid Earth* 115(B12): article 2010JB007673. doi:10.1029/2010jb007673
   - Kohn, M.J. 2014. Himalayan metamorphism and its tectonic implications. *Annual Review of Earth and Planetary Sciences* 42(1): 381–419. doi:10.1146/annurev-earth-060313-055005
   - Also checked: Yin, A. & Harrison, T.M. 2000, *Annu. Rev. Earth Planet. Sci.* 28(1): 211–280, doi:10.1146/annurev.earth.28.1.211. Rowley, D.B. & Currie, B.S. 2006, *Nature* 439(7077): 677–681, doi:10.1038/nature04506. Rowley, D.B., Pierrehumbert, R.T. & Currie, B.S. 2001, *Earth and Planetary Science Letters* 188(1–2): 253–268, doi:10.1016/s0012-821x(01)00324-7. Ding, L., Xu, Q., Yue, Y., Wang, H., Cai, F. & Li, S. 2014, *Earth and Planetary Science Letters* 392: 250–264, doi:10.1016/j.epsl.2014.01.045.
9. **Caveat for visitors.** "Geologists date the first contact between India and Asia anywhere from about 60 to 50 million years ago, depending on how the collision is defined."

## 2. Alpine orogeny (the Alps)

1. **Names.** Alpine orogeny. In the wide sense it covers every Cretaceous-to-recent belt from Morocco to Iran; here it means the Alps. An earlier Cretaceous phase in the Eastern Alps is the "Eo-Alpine" [secondary].
2. **Age: use 35 Ma to today.** Handy et al. 2010, as summarised from the abstract [secondary]: Eo-Alpine orogenesis 131–84 Ma; subduction of the Piemont and Valais oceans beneath the Adriatic plate 84–35 Ma; from 35 Ma the continental core of Adria acted as "a rigid indenter within the Alpine collisional zone". Whether "collision" should be dated at 35 Ma was not confirmed in the paper itself.
   - Still going on, slowly [memory]. Paleoaltimetry suggests "the topography has not increased since 20 Ma" (Schlunegger & Kissling 2015) [abstract].
3. **Cause.** The Adriatic plate (a northern promontory of Africa) collided with Europe after the small Alpine Tethys oceans between them were consumed [secondary].
4. **Extent.**
   - Boxes: Western Alps `[43.7, 5.7, 46.5, 8.3]`; Central Alps `[45.6, 6.8, 47.5, 10.5]`; Eastern Alps `[46.2, 10.0, 47.9, 16.3]`; Southern Alps and Dolomites `[45.6, 9.5, 46.8, 14.0]`. The edges take in parts of the Po plain and the Swiss and Bavarian forelands.
   - Units: Helvetic (and external crystalline massifs: Mont Blanc, Aar, Gotthard), Penninic (Lepontine dome, Tauern window), Austroalpine, Southern Alps; Periadriatic line [memory; Schmid et al. 2004 is the standard map, citation checked].
   - Provinces: 509 Alps; 466 Jura Mountains (thin folded cover); foreland 452 Molasse Basin (do not attach).
   - **Decision on neighbouring belts.** The Pyrenees are a separate entry (entry 3): different plates, earlier dates, now inactive. The Carpathians (503 Carpathian Mountains), Apennines (510 Apennine Orogen) and Dinarides (450 Dinarides) are each a separate orogen with its own timing, but they are built mainly of sedimentary rock, so they would seldom be needed for the stated purpose. They are **not covered here**; add them only if wanted, each as its own entry.
5. **Surface today.** High mountains. Metamorphic rock of Alpine age is widely exposed in the Penninic core (Ticino, Valais, Tauern), with small young granites (Bergell, Adamello). **Much of the granite and gneiss in the Alps is older (Variscan, entry 12) and was only reworked and lifted** [memory].
6. **Claims.** Measured Miocene heights exist for the Central Alps (Campani et al. 2012) [title], and heights are thought steady since 20 Ma [abstract, above]. The app may say the Alps have stood as mountains for about 20 million years or more; quote a figure only after reading Campani et al.
7. **For visitors.** "About 35 million years ago a northern outlier of Africa collided with Europe, and the squeezing that followed raised the Alps. Rock that was buried deep during the collision is now exposed in the heart of the range."
8. **Sources.**
   - Handy, M.R., Schmid, S.M., Bousquet, R., Kissling, E. & Bernoulli, D. 2010. Reconciling plate-tectonic reconstructions of Alpine Tethys with the geological–geophysical record of spreading and subduction in the Alps. *Earth-Science Reviews* 102(3–4): 121–158. doi:10.1016/j.earscirev.2010.06.002
   - Schmid, S.M., Fügenschuh, B., Kissling, E. & Schuster, R. 2004. Tectonic map and overall architecture of the Alpine orogen. *Eclogae Geologicae Helvetiae* 97(1): 93–117. doi:10.1007/s00015-004-1113-x
   - Schlunegger, F. & Kissling, E. 2015. Slab rollback orogeny in the Alps and evolution of the Swiss Molasse basin. *Nature Communications* 6: 8605. doi:10.1038/ncomms9605
   - Campani, M., Mulch, A., Kempf, O., Schlunegger, F. & Mancktelow, N. 2012. Miocene paleotopography of the Central Alps. *Earth and Planetary Science Letters* 337–338: 174–185. doi:10.1016/j.epsl.2012.05.017
9. **Caveat for visitors.** "The eastern Alps record an earlier phase of mountain-building, about 130 to 85 million years ago, and oceans were closing here for tens of millions of years before the final collision."

## 3. Pyrenean orogeny

1. **Names.** Pyrenean orogeny. Usually treated as a western branch of the Alpine system; the Cantabrian Mountains are its continuation [memory].
2. **Age: use 84 to 20 Ma. Low confidence: both figures are [memory].** Convergence of Iberia and Europe is generally said to have begun in the Late Cretaceous (Santonian, about 84 Ma) and the main thrusting to have ended in the early Miocene (about 20 Ma) [memory]. Mouthereau et al. 2014 is the paper to read for the shortening history; its citation is verified but Crossref holds no abstract and I did not read it.
3. **Cause.** The small Iberian plate was pushed against Europe; no wide ocean was involved [memory].
4. **Extent.** Boxes: Pyrenees `[42.0, -2.0, 43.4, 3.3]`; Cantabrian Mountains `[42.6, -7.0, 43.6, -2.0]` (milder). Zones: North Pyrenean Zone, Axial Zone, South Pyrenean Zone [memory]. Province: 454 Cantabrian-Pyrenean Belt.
5. **Surface today.** High mountains. **The granite and metamorphic rock of the Axial Zone are Variscan (entry 12), lifted in the Pyrenean event, not made by it** [memory].
6. **Claims.** An isotope study reports Eocene elevation change (Huyghe et al. 2012) [title]. Nothing else on height.
7. **For visitors.** "From about 84 to 20 million years ago the block of crust that carries Spain and Portugal was pressed against France, raising the Pyrenees. The granite in the high central range is much older and was lifted up from below."
8. **Sources.**
   - Mouthereau, F., Filleaudeau, P.-Y., Vacherat, A., et al. [9 authors] 2014. Placing limits to shortening evolution in the Pyrenees: role of margin architecture and implications for the Iberia/Europe convergence. *Tectonics* 33(12): 2283–2314. doi:10.1002/2014tc003663
   - Muñoz, J.A. 1992. Evolution of a continental collision belt: ECORS-Pyrenees crustal balanced cross-section. In *Thrust Tectonics*: 235–246. doi:10.1007/978-94-011-3066-0_21
   - Huyghe, D., Mouthereau, F. & Emmanuel, L. 2012. Oxygen isotopes of marine mollusc shells record Eocene elevation change in the Pyrenees. *Earth and Planetary Science Letters* 345–348: 131–141. doi:10.1016/j.epsl.2012.06.035
9. **Caveat for visitors.** "These dates are approximate and need checking against the research papers."

## 4. Zagros orogeny

1. **Names.** Zagros orogeny; Arabia–Eurasia collision. Continues north-west into the Bitlis belt of Turkey [memory].
2. **Age: use 30 Ma to today (still going on).** Agard et al. 2011: "from the Oligocene onwards (~30–0 Ma), collision develops with a progressive SW migration of deformation and topographic build-up (Sanandaj–Sirjan Zone: 20–15 Ma, High Zagros: ~12–8 Ma; Simply Folded Belt: 5–0 Ma)" [abstract]. Before that, a long history of ocean-floor subduction from about 150 Ma [abstract].
   - Disagreement: the collision age is contested (McQuarrie & van Hinsbergen 2013, "age of collision versus magnitude of continental subduction") [title]; published figures range from about 35 to about 20 Ma [memory].
3. **Cause.** Arabia collided with the Iranian edge of Eurasia after the Neo-Tethys ocean between them closed [abstract].
4. **Extent.** Boxes: north-west Zagros (Iraqi Kurdistan, western Iran) `[33.0, 44.5, 38.0, 49.5]`; central Zagros `[29.5, 48.0, 34.5, 53.0]`; Fars and Bandar Abbas `[26.5, 51.0, 31.0, 57.5]`. The south-west edges take in the Mesopotamian plain and Gulf coast; the north-east edges take in central Iran. Zones: Simply Folded Belt, High Zagros, Sanandaj–Sirjan Zone, Urumieh–Dokhtar magmatic arc [abstract].
   - Provinces: 560 Zagros Orogen; 527 Sanandaj-Sirjan Zone; 532 Urumieh-Dokhtar Magmatic Arc. Poor fit: 26 Zagros Foreland Basin is classed "East African".
5. **Surface today.** High mountains, mostly long folds of **sedimentary** rock. Metamorphic and plutonic rock is confined to the Sanandaj–Sirjan Zone and is mostly older (Mesozoic) [memory].
6. **Claims.** The order in which relief was built is given above [abstract]. No heights.
7. **For visitors.** "About 30 million years ago Arabia began to collide with Asia, and the collision continues today. It has folded the rock layers into the long parallel ridges of the Zagros, the youngest of them within the last five million years."
8. **Sources.**
   - Agard, P., Omrani, J., Jolivet, L., et al. [9 authors] 2011. Zagros orogeny: a subduction-dominated process. *Geological Magazine* 148(5–6): 692–725. doi:10.1017/s001675681100046x
   - McQuarrie, N. & van Hinsbergen, D.J.J. 2013. Retrodeforming the Arabia-Eurasia collision zone: age of collision versus magnitude of continental subduction. *Geology* 41(3): 315–318. doi:10.1130/g33591.1 (abstract not read)
   - Mouthereau, F., Lacombe, O. & Vergés, J. 2012. Building the Zagros collisional orogen: timing, strain distribution and the dynamics of Arabia/Eurasia plate convergence. *Tectonophysics* 532–535: 27–60. doi:10.1016/j.tecto.2012.01.022 (abstract not read)
9. **Caveat for visitors.** "Estimates of when the collision began range from about 35 to 20 million years ago."

## 5. Andean orogeny

1. **Names.** Andean orogeny or Andean cycle. Phase names (Peruvian, Incaic, Quechua) are used in Peru, Bolivia and Chile [memory].
2. **Age: use 100 Ma to today (still going on).** Ramos 2009: a new phase of subduction began in the Early Jurassic and ran "under an extensional regime until late Early Cretaceous times" [abstract], i.e. compression began about 100 Ma [memory for the figure]. Horton places the "inception of Andean shortening" in the "Late Cretaceous–early Paleocene" along the whole margin (conference abstract) [secondary].
   - Not continuous: "periods of orogenesis and mountain building alternating with periods of quiescence" [abstract: Ramos]. The Northern Andes instead record collisions of island arcs and oceanic plateaus "from the Early Cretaceous to the middle Miocene" [abstract].
   - Much of the present height is young: surface rises of "1.5 kilometers or more" in 1–4 million years (Garzione et al. 2008) [abstract]; middle–late Miocene uplift of the Altiplano and Eastern Cordillera (Garzione et al. 2017) [abstract].
3. **Cause.** Ocean floor of the Pacific (Nazca and earlier plates) sinks beneath the western edge of South America; "the largest orogenic system developed by subduction of oceanic crust along a continental margin" [abstract: Ramos]. No continental collision.
4. **Extent.** Boxes: Northern Andes `[-5.0, -80.5, 11.5, -71.0]` (takes in the Pacific lowlands and the Magdalena and Maracaibo basins); Peru `[-16.0, -80.0, -5.0, -72.5]`; Altiplano segment `[-23.0, -72.0, -14.0, -63.5]`; central Chile and Argentina `[-39.0, -73.5, -23.0, -65.0]` (takes in the Sierras Pampeanas); Patagonian and Fuegian Andes `[-55.5, -76.0, -39.0, -69.5]`.
   - Provinces: 900 North Andean Orogen; 754 North Central Andes; 742 Colombian Volcanic Arc; 741 Western Cordillera; 738 Eastern Cordillera; 736 Andean Plateau; 739 Central Andean Arc; 737 Southern Andean Arc; 748 Northern Precordillera; 749 Central Precordillera; 750 Southern Precordillera; 772 Fuegian Andes; 788 Sierras Pampeanas.
   - Poor fit: the map classes all of these "Terra Australis", the name of the Palaeozoic belt underneath; no class in the table marks the Andean event. 788 Sierras Pampeanas are blocks of old basement pushed up in the last few million years, like the Laramide ranges [memory].
5. **Surface today.** High mountains with active volcanoes. Plutonic rock of the event is very widely exposed in the coastal batholiths of Peru and Chile and the Patagonian batholith; metamorphic rock of Andean age is scarce, and most metamorphic rock in the range is older [memory].
6. **Claims.** Measured surface-uplift histories exist for the central Andes (Garzione et al. 2008, 2017) [abstract]. The app may say the central Andes gained much of their height in the last 10–20 million years; it should not give a height for the Cretaceous Andes.
7. **For visitors.** "For about 100 million years the floor of the Pacific Ocean has been sinking beneath the edge of South America, squeezing and thickening the crust and feeding volcanoes. The Andes rose in pulses, and much of their present height was gained in the last 20 million years."
8. **Sources.**
   - Ramos, V.A. 2009. Anatomy and global context of the Andes: main geologic features and the Andean orogenic cycle. In *Backbone of the Americas* (GSA Memoir 204): 31–65. doi:10.1130/2009.1204(02)
   - Horton, B.K. 2018. Sedimentary record of Andean mountain building. *Earth-Science Reviews* 178: 279–309. doi:10.1016/j.earscirev.2017.11.025 (abstract not read)
   - Garzione, C.N., Hoke, G.D., Libarkin, J.C., et al. [8 authors] 2008. Rise of the Andes. *Science* 320(5881): 1304–1307. doi:10.1126/science.1148615
   - Garzione, C.N., McQuarrie, N., Perez, N.D., et al. [16 authors] 2017. Tectonic evolution of the Central Andean Plateau and implications for the growth of plateaus. *Annual Review of Earth and Planetary Sciences* 45(1): 529–559. doi:10.1146/annurev-earth-063016-020612
9. **Caveat for visitors.** "Mountain-building here came in bursts separated by quiet spells, and its timing differs along the length of the range."
## 6. Sevier orogeny (Cordilleran thrust belt)

1. **Names.** Sevier orogeny or Sevier fold-and-thrust belt (USA). The same thrust belt continues into Canada, where it is simply the Rocky Mountain fold-and-thrust belt and its phases are called Columbian and (confusingly) Laramide [memory]. In Canada "Laramide" therefore means thin-skinned thrusting, in the USA basement uplifts (entry 7).
2. **Age: use 125 to 50 Ma.** Thrusts "were emplaced progressively forelandward (W to E) spanning 125–50 Ma" (a review by Yonkee, Weil and Wells, as quoted in a search summary) [secondary]. Rests on dating of sediments shed from each thrust sheet and on thermochronology.
   - Disagreement: DeCelles 2004 treats the thrust belt and its foreland basin as "Late Jurassic to Eocene" [title], i.e. starting about 155 Ma [memory for the figure]. A start of 155 is defensible.
3. **Cause.** Ocean floor of the Farallon plate sank eastward beneath North America; the compression behind the volcanic arc pushed sheets of sedimentary rock eastward over one another [memory; consistent with the abstract fragments of Yonkee & Weil 2015 seen at second hand].
4. **Extent.**
   - Boxes: southern Nevada and south-west Utah `[35.5, -116.0, 38.5, -112.5]`; central Utah `[38.0, -113.5, 41.5, -110.5]`; Idaho–Wyoming–Montana `[41.0, -113.0, 45.5, -109.8]`; Montana disturbed belt `[45.0, -115.5, 49.5, -111.5]`; Canadian Rockies and Foothills `[49.0, -118.0, 54.0, -113.5]` and `[53.0, -124.0, 58.0, -119.0]`. All take in Basin and Range ground on the west that was later stretched, and plains on the east.
   - Provinces: 719 Cordillera Front and Thrust; 572 Northern Rocky Mountains; part of 569 Middle Rocky Mountains; hinterland in 650 Northern Basin and Range.
   - Poor fits: 569 is shared with the Laramide (entry 7). The hinterland provinces were later stretched (Basin and Range), so "last orogeny = Cordilleran" covers three or four separate events there.
5. **Surface today.** High mountains in places (Canadian Rockies, Wasatch, Wyoming Salt River Range), made mostly of folded and stacked **sedimentary** rock. Deep rock of Sevier age is exposed only in small "core complexes" of the hinterland (e.g. Ruby Mountains, Raft River) [memory]. **This entry will seldom help at a metamorphic or plutonic spot.**
6. **Claims.** A high hinterland plateau ("Nevadaplano") is proposed by analogy with the Andes; Yonkee & Weil 2015 tie shortening to "uplift of a hinterland plateau" [secondary]. No height should be stated.
7. **For visitors.** "From about 125 to 50 million years ago, pressure from an ocean plate sinking beneath western North America pushed great sheets of rock eastward over one another here. The stacked and folded layers still form many of the ranges."
8. **Sources.**
   - Yonkee, W.A. & Weil, A.B. 2015. Tectonic evolution of the Sevier and Laramide belts within the North American Cordillera orogenic system. *Earth-Science Reviews* 150: 531–593. doi:10.1016/j.earscirev.2015.08.001 (abstract seen only in fragments)
   - DeCelles, P.G. 2004. Late Jurassic to Eocene evolution of the Cordilleran thrust belt and foreland basin system, western U.S.A. *American Journal of Science* 304(2): 105–168. doi:10.2475/ajs.304.2.105 (abstract not read)
9. **Caveat for visitors.** "Thrusting moved eastward with time, so it happened earlier in the west of the belt than in the east."

## 7. Laramide orogeny

1. **Names.** Laramide orogeny (USA). See entry 6 for the different Canadian use of the word. In Mexico the equivalent is the Mexican fold-and-thrust belt, often also called Laramide or "Hidalgoan" [memory].
2. **Age: use 70 to 50 Ma for the Rocky Mountain uplifts; whole span about 90 to 30 Ma.**
   - "Laramide arches were uplifted from 70 to 50 Ma" (Yonkee, Weil and Wells review) [secondary].
   - Copeland et al. 2017: shortening "began in southeast California at ca. 90 Ma, swept to the northeast to arrive in the Black Hills of South Dakota at ca. 60 Ma, and concluded in South Dakota within ~10 m.y."; the deforming area then shrank back south-west "from ca. 55 to 45 Ma and more slowly from ca. 45 to 40 Ma", ending in the south-west "at ca. 30 Ma" [abstract].
   - Fission-track dating of the Wind River Range, Wyoming: cooling "may have initiated by about 85 Ma but was definitely occurring by 75 Ma", most rapid 60–57 Ma (a 1993 *Tectonics* paper returned by Crossref without author names, doi:10.1029/92tc01567) [abstract].
   - So the lifespan depends on the place; a per-box date would be better than one pair.
3. **Cause.** The sinking Farallon ocean plate flattened and scraped along beneath the continent, carrying compression far inland; when it steepened again the deformation retreated (Copeland et al. 2017) [abstract].
4. **Extent.**
   - Boxes: Wyoming and southern Montana `[41.0, -111.0, 46.0, -104.0]`; Black Hills `[43.3, -104.8, 45.0, -103.0]`; Colorado and northern New Mexico `[35.0, -108.5, 41.5, -104.5]` (east edge takes in the High Plains); Colorado Plateau monoclines and uplifts `[35.0, -112.5, 39.5, -108.0]` (gentle folds only); southern Arizona and south-west New Mexico `[31.0, -114.0, 34.0, -107.0]` (later stretched).
   - Named uplifts: Wind River, Bighorn, Beartooth, Owl Creek, Laramie, Front Range, Sawatch, Sangre de Cristo, Uinta, Black Hills, Kaibab, San Rafael Swell [memory].
   - Provinces: 569 Middle Rocky Mountains; 579 Southern Rocky Mountains; 566 Colorado Plateau; and Laramide ranges standing inside 582 Wyoming Craton (classed "cratonic") and inside the bounding box of 581 Trans-Hudson Orogen (the Black Hills).
   - Poor fits: the Wyoming ranges are Laramide mountains made of Archean rock, so the map classes them as craton. A province match on "Cordilleran" will miss them.
5. **Surface today.** High mountains. **The granite and gneiss in the cores of these ranges are Precambrian (roughly 1.4 to more than 2.7 billion years old) [memory]; the Laramide event lifted them but did not make or metamorphose them.** The Wind River study above found the rock had not been hotter than about 200 °C since the Precambrian [abstract]. Laramide-age granite is confined to the Colorado Mineral Belt and the south-west [memory].
6. **Claims.** The app may say blocks of old basement were pushed up to form ranges. It should not say today's summits are Laramide in height: later regional uplift and erosion shaped the present Rockies [memory]. No palaeo-height source was read.
7. **For visitors.** "About 70 to 50 million years ago, blocks of very old rock were pushed up through the younger layers above them to form the ranges of the Rocky Mountains. The rock in the cores of these ranges is far older than the mountains themselves."
8. **Sources.**
   - Copeland, P., Currie, C.A., Lawton, T.F. & Murphy, M.A. 2017. Location, location, location: the variable lifespan of the Laramide orogeny. *Geology* 45(3): 223–226. doi:10.1130/g38810.1
   - Yonkee & Weil 2015 (entry 6).
   - Fission track thermochronology of the Wind River Range, Wyoming: evidence for timing and magnitude of Laramide exhumation. 1993. *Tectonics* 12(1): 77–91. doi:10.1029/92tc01567 (authors not given by Crossref; **author names UNVERIFIED**)
9. **Caveat for visitors.** "The timing differed from place to place: mountain-building began about 90 million years ago in the south-west and reached South Dakota about 60 million years ago."

## 8–10. The three Appalachian orogenies: shared notes

- **Provinces (all three entries).** 641 Taconic Arc; 642 Southern and Central Applachian; 648 Pedmontia; 646 Carolina Terrane; 645 Avalonia Terrane; 604 Charleston Arc. The older basement inside the belt is 605 Grenville Orogeny (entry 19).
- **Poor fits.** One province, 642, covers ground hit by all three orogenies, so the province map cannot tell them apart; the boxes below, or better the rock's own mapped age, must do that. The map classes 641, 642, 645, 646 and 648 as "Caledonian" and 604 as "Variscan-Hercynian". In the literature the *last* orogeny over the whole southern and central Appalachians is the Alleghanian, which is the North American counterpart of the Variscan; so "Variscan-Hercynian" would be the apter class for 642, 646 and 648 as well as 604, and "Caledonian" is apt only as a loose label for the earlier Taconic and Acadian events. I did not see where 604 Charleston Arc lies; from its name and corner it is the buried belt under the south-eastern coastal plain.
- **The example of Greenville, South Carolina.** Greenville lies in the Inner Piedmont. Dating of metamorphic zircon there and in the adjacent Blue Ridge gives three clusters: 462–448 Ma (Taconic), 395–340 Ma (Acadian and Neoacadian) and 335–322 Ma (early Alleghanian) (Merschat et al. 2017) [abstract]. All three tiles are therefore defensible there; the Inner Piedmont's main metamorphism is the middle one [memory].
- **Shared sources.** Hatcher, R.D. 2010. The Appalachian orogen: a brief summary. In *From Rodinia to Pangea* (GSA Memoir 206). doi:10.1130/2010.1206(01) (no pages in Crossref; pp. 1–19 [secondary]; abstract not read). Hibbard, J.P., van Staal, C.R. & Rankin, D.W. 2010. Comparative analysis of the geological evolution of the northern and southern Appalachian orogen: Late Ordovician-Permian. Same volume. doi:10.1130/2010.1206(03) (abstract not read). Merschat, A.J., Bream, B.R., Huebner, M.T., Hatcher, R.D. & Miller, C.F. 2017. Temporal and spatial distribution of Paleozoic metamorphism in the southern Appalachian Blue Ridge and Inner Piedmont delimited by ion microprobe U-Pb ages of metamorphic zircon. In *Linkages and Feedbacks in Orogenic Systems* (GSA Memoir 213): 199–254. doi:10.1130/2017.1213(10). van Staal, C.R., Whalen, J.B., Valverde-Vaquero, P., Zagorevski, A. & Rogers, N. 2009. Pre-Carboniferous, episodic accretion-related, orogenesis along the Laurentian margin of the northern Appalachians. *Geological Society, London, Special Publications* 327(1): 271–316. doi:10.1144/sp327.13

## 8. Alleghanian orogeny

1. **Names.** Alleghanian (also spelled Alleghenian) orogeny; "Appalachian orogeny" in older usage. Its continuation to the south-west is the Ouachita orogeny; in Europe and Africa the Variscan and Mauritanide belts (entry 12).
2. **Age: use 335 to 280 Ma.**
   - Start 335: metamorphic zircon of 335–322 Ma "related to the early phase of the Alleghanian orogeny" (Merschat et al. 2017) [abstract].
   - End 280: the orogeny is described as spanning roughly 330–280 Ma (conference abstract) [secondary]; a major fault zone in Georgia–Alabama moved at 297–278 Ma (argon dating of hornblende and muscovite) [secondary]; the youngest folded strata of the central Appalachian foreland are dated 285–265 Ma, so thrusting there may have lasted to about 265 Ma [secondary].
   - Hatcher describes it as late Mississippian to Early Permian, closing like a zipper from north to south (Hatcher 2002) [title for "zipper"; secondary for the periods].
3. **Cause.** Africa (the Gondwana side) collided with North America, completing the supercontinent Pangaea; a "rotational transpressive continent-continent collision" [title: Hatcher 2002].
4. **Extent.** Boxes, folded sedimentary foreland (Valley and Ridge, Appalachian Plateau): `[32.5, -88.0, 36.5, -83.0]`; `[35.0, -84.0, 39.5, -78.0]`; `[39.0, -80.5, 41.8, -75.0]`. Boxes, metamorphic and granite belt: Piedmont from Alabama to Virginia `[32.5, -85.5, 38.0, -77.0]` (the south-east edge takes in the coastal plain); south-east New England `[41.2, -72.5, 42.2, -70.8]`.
   - Belts: Appalachian Plateau, Valley and Ridge, Blue Ridge, Inner Piedmont, Carolina terrane (Charlotte and Carolina slate belts), Kiokee and Raleigh belts, Brevard zone [memory].
5. **Surface today.** Low, old mountains and rolling Piedmont; the present ridges are erosional and partly the result of later uplift [memory]. Alleghanian granite bodies and metamorphic rock are widespread in the eastern Piedmont; in the Blue Ridge and Inner Piedmont the Alleghanian mostly thrust and heated rock that had been metamorphosed earlier [abstract: Merschat, "superposed metamorphism"].
6. **Claims.** "As high as the Himalaya" is commonly said of the Alleghanian Appalachians [memory]; I found no source for a height. Do not state one.
7. **For visitors.** "About 335 to 280 million years ago Africa collided with North America as the supercontinent Pangaea came together, pushing up a mountain range along what is now the Appalachians. Today's mountains are the worn remains of that range."
8. **Sources.** Merschat et al. 2017 (above). Hatcher, R.D. 2002. Alleghanian (Appalachian) orogeny, a product of zipper tectonics: rotational transpressive continent-continent collision and closing of ancient oceans along irregular margins. In *Variscan-Appalachian Dynamics: The Building of the Late Paleozoic Basement* (GSA Special Paper 364). doi:10.1130/0-8137-2364-7.199 (no pages in Crossref; abstract not read). Hatcher 2010 (above).
9. **Caveat for visitors.** "The collision began in the north and closed southward, so the dates differ along the range."
10. **Tie to rifting.** The same join was pulled apart again from about 230 Ma, opening the Atlantic (see the rifts dossier).

## 9. Acadian orogeny (with the Neoacadian; the Salinic noted)

1. **Names.** Acadian orogeny (New England, Maritime Canada, Newfoundland). A later pulse is the Neoacadian; an earlier one in Canada is the Salinic. In Britain "Acadian" is used for an Early Devonian event of about 395 Ma (entry 11) [abstract: Chew & Strachan 2014].
2. **Age: use 420 to 350 Ma.** van Staal et al. 2009 [abstract]: Salinic 450–423 Ma; "Late Silurian–Early Devonian accretion of Avalonia (421–400 Ma)" = Acadian, with final Acadian magmatism 395 to about 375 Ma; "Middle Devonian–Early Carboniferous accretion of Meguma (395–350 Ma)" = Neoacadian.
   - Southern Appalachians: metamorphic zircon of 395–340 Ma, "Acadian and Neoacadian" (Merschat et al. 2017) [abstract]. There, the cause is usually given as the docking of the Carolina terrane [secondary].
   - If two rows are wanted: Acadian 420–375, Neoacadian 395–340.
3. **Cause.** Small continents that had broken from Gondwana (Avalonia, then Meguma; in the south, Carolina) collided one after another with the edge of North America [abstract].
4. **Extent.** Boxes: New England `[41.0, -74.0, 47.5, -66.5]` (the west edge takes in Taconic ground and the Hudson valley); New Brunswick, Nova Scotia and Gaspé `[43.3, -68.0, 49.3, -59.5]`; central Newfoundland `[46.5, -59.5, 51.7, -52.6]`; southern Appalachian eastern Blue Ridge and Inner Piedmont `[33.0, -85.5, 37.0, -79.0]`.
   - Terranes: Ganderia, Avalonia, Meguma; Central Maine belt, Bronson Hill, Merrimack; in the south the Inner Piedmont, Cat Square and Tugaloo terranes, Carolina superterrane [abstract for the first three; memory for the rest].
5. **Surface today.** Worn-down mountains (White Mountains, Maine highlands) and coastal lowlands. Acadian metamorphic rock and granite are very widely exposed across New England and Maritime Canada [memory].
6. **Claims.** The huge wedge of Devonian sediment shed westward (the "Catskill delta") is the usual evidence that high ground existed [memory]; no height was found.
7. **For visitors.** "About 420 to 350 million years ago small continents collided one after another with the edge of ancient North America, building mountains and melting rock into granite deep below. That granite and the surrounding metamorphic rock now lie at the surface."
8. **Sources.** van Staal et al. 2009; Merschat et al. 2017; Hibbard et al. 2010 (all above). Also checked: Bradley, D.C., Tucker, R.D., Lux, D.R., Harris, A.G. & McGregor, D.C. 2000. Migration of the Acadian Orogen and foreland basin across the Northern Appalachians of Maine and adjacent areas. *U.S. Geological Survey Professional Paper* 1624. doi:10.3133/pp1624 (not read).
9. **Caveat for visitors.** "The mountain-building moved across the region over tens of millions of years, and geologists divide it into separate pulses with different names."

## 10. Taconic orogeny

1. **Names.** Taconic (Taconian) orogeny. Same age and kind as the Grampian of Scotland and Ireland (entry 11).
2. **Age: use 475 to 450 Ma.**
   - End 450: "The Ordovician Taconic orogeny was a composite event comprising three different phases"; it ended with an arc–arc collision "during the Late Ordovician (460–450 Ma)" (van Staal et al. 2009) [abstract].
   - Southern Appalachians: metamorphic zircon 462–448 Ma (Merschat et al. 2017) [abstract].
   - Start 475: by correlation with the Grampian phase, 475–465 Ma (Chew & Strachan 2014) [abstract]; the earliest of van Staal's three phases is older still, about 495 Ma, in Newfoundland [memory]. Start is the weaker figure.
   - Karabinos et al. 2017 and Macdonald et al. 2014 revise the plate geometry in New England (citations checked; abstracts not read).
3. **Cause.** Chains of volcanic islands and slivers of continent collided with the edge of ancient North America (Laurentia) as part of the Iapetus Ocean closed [abstract].
4. **Extent.** Boxes: western New England and eastern New York `[41.0, -74.5, 45.2, -72.0]`; southern Quebec and Gaspé `[45.0, -73.0, 49.3, -64.5]`; western Newfoundland `[47.5, -59.5, 51.7, -55.5]`; Blue Ridge from Virginia to Georgia `[34.0, -85.0, 38.5, -78.0]`; Alabama–Georgia Piedmont `[32.5, -87.0, 35.0, -83.0]`.
   - Units: Taconic allochthons, Green Mountains, Berkshires, Bronson Hill arc, Humber and Dunnage zones (Canada), western and central Blue Ridge [memory].
5. **Surface today.** Worn-down mountains. Taconic metamorphic rock is widely exposed in western New England and the southern Blue Ridge, commonly overprinted by the later events [abstract: Merschat].
6. **Claims.** None on height.
7. **For visitors.** "About 475 to 450 million years ago chains of volcanic islands collided with the edge of ancient North America, folding and heating the rocks along what is now the Appalachians. It was the first of three mountain-building episodes here."
8. **Sources.** van Staal et al. 2009; Merschat et al. 2017 (above). Karabinos, P., Macdonald, F.A. & Crowley, J.L. 2017. Bridging the gap between the foreland and hinterland I: geochronology and plate tectonic geometry of Ordovician magmatism and terrane accretion on the Laurentian margin of New England. *American Journal of Science* 317(5): 515–554. doi:10.2475/05.2017.01. Macdonald, F.A., Ryan-Davis, J., Coish, R.A., Crowley, J.L. & Karabinos, P. 2014. A newly identified Gondwanan terrane in the northern Appalachian Mountains: implications for the Taconic orogeny and closure of the Iapetus Ocean. *Geology* 42(6): 539–542. doi:10.1130/g35659.1
9. **Caveat for visitors.** "Later mountain-building reheated many of these rocks, so the rock at a given spot may record more than one event."

## 11. Caledonian orogeny (Grampian and Scandian phases)

1. **Names.** Caledonian orogeny; the belt is the Caledonides. Phase names differ by country: Grampian (Scotland, Ireland), Scandian (Scandinavia, Greenland, northern Scotland), and in Britain a last phase called Acadian. The Grampian phase is the same age and kind as the Taconic of North America (entry 10), and the Scandian overlaps the Salinic and Acadian (entry 9); they were one mountain system later split by the Atlantic [memory for the correlation; abstract for the phase names].
2. **Age: two rows are better than one.**
   - **Grampian phase: 475 to 465 Ma** (Scotland and Ireland): "an Early–Middle Ordovician (475–465 Ma) phase termed the Grampian Orogeny" (Chew & Strachan 2014) [abstract].
   - **Scandian phase: use 430 to 400 Ma** (Scandinavia, East Greenland). In Scotland it is "Silurian (435–425 Ma) tectonism restricted to the Northern Highland Terrane" [abstract]. In Scandinavia the main thrusting is taken to have "commenced in the Mid-Silurian" and the collision is called Silurian–Devonian [secondary]; the figures 430 and 400 for Scandinavia are [memory] and no abstract read gave them.
   - Acadian phase in Britain: "Early Devonian (395 Ma)" [abstract].
   - If one row is wanted: 475 to 395 Ma, with a quiet gap between phases.
3. **Cause.** The Iapetus Ocean closed. First a volcanic island arc collided with the edge of Laurentia (Grampian) [abstract]; later the continent Baltica (Scandinavia) collided with Laurentia (Greenland, Scotland), with Baltica's edge pushed beneath Laurentia (Scandian) [secondary].
4. **Extent.**
   - Boxes, Scandian: western Norway `[58.5, 4.5, 63.0, 9.5]` (its south-east part takes in older Sveconorwegian basement); Trøndelag and Jämtland `[62.0, 8.0, 66.0, 15.5]`; Nordland to Finnmark `[65.5, 12.0, 71.3, 27.0]` (east edge takes in older shield); East Greenland `[70.0, -30.0, 82.0, -18.0]`; Svalbard `[76.5, 10.0, 80.5, 22.0]`; Scottish Northern Highlands `[56.8, -6.5, 58.8, -3.8]`.
   - Boxes, Grampian: Scottish Highlands `[55.8, -7.8, 58.8, -1.7]` (the south-east edge takes in a strip of the Midland Valley; the far north-west coast and Outer Hebrides are the much older foreland); Shetland `[59.8, -1.8, 60.9, -0.7]`; north and west Ireland `[53.2, -10.3, 55.4, -5.5]` (takes in limestone lowlands).
   - Lower-grade slate belts closed in the last phase: Southern Uplands and Lake District `[54.2, -5.2, 55.9, -2.0]`; Wales `[52.0, -5.4, 53.4, -2.9]`; Leinster `[52.1, -7.2, 53.4, -6.0]`.
   - Constituent units: Scandinavia: Lower, Middle, Upper and Uppermost Allochthons, and the Western Gneiss Region [memory; Corfu et al. 2014 describe "a sequence of allochthons", abstract]. Britain and Ireland: Hebridean, Northern Highland, Grampian (Moine and Dalradian rocks), Midland Valley and Southern Uplands terranes; Connemara [memory].
   - Provinces: 507 Caldeonides; 487 Laurentia Province; 489 Avalonia; 495 Svalbard Caldeonides; 908 Caledonian Fold Belt (Greenland).
   - Poor fits: the map's "Caledonian" class also holds the whole Appalachians (641, 642, 645, 646, 648) and 631 Innuitian Orogen (Arctic Canada; a later, Devonian–Carboniferous event [memory]) and 477 Kara Block. 507 and 487 have the same bounding-box corner, so I cannot tell which holds the Scottish Highlands. One province (507) covers ground hit by both phases.
5. **Surface today.** Mountains of moderate height in Norway and Scotland, but the present relief is not the original range: the Caledonian mountains were worn down and the land was lifted again much later [memory]. Metamorphic and plutonic rock of the event is very widely exposed, including rock that was carried to great depth (the Western Gneiss Region) [memory].
6. **Claims.** Often called "Himalayan-scale". No abstract read gives a height; treat the comparison as analogy from the size of the collision and the depth of burial.
7. **For visitors.** (Scandian) "About 430 to 400 million years ago the continent that is now Scandinavia collided with the one that is now Greenland and North America, raising a great mountain range. The mountains of Norway and Scotland today are its deeply worn roots, lifted again much later." (Grampian) "About 475 to 465 million years ago a chain of volcanic islands collided with the edge of an ancient continent here, folding and heating the rocks of the Highlands."
8. **Sources.**
   - Chew, D.M. & Strachan, R.A. 2014. The Laurentian Caledonides of Scotland and Ireland. *Geological Society, London, Special Publications* 390(1): 45–91. doi:10.1144/sp390.16
   - Corfu, F., Andersen, T.B. & Gasser, D. 2014. The Scandinavian Caledonides: main features, conceptual advances and critical questions. *Geological Society, London, Special Publications* 390(1): 9–43. doi:10.1144/sp390.25 (abstract read; it gives no dates)
   - Gee, D.G., Fossen, H., Henriksen, N. & Higgins, A.K. 2008. From the Early Paleozoic platforms of Baltica and Laurentia to the Caledonide orogen of Scandinavia and Greenland. *Episodes* 31(1): 44–51. doi:10.18814/epiiugs/2008/v31i1/007 (abstract not read)
9. **Caveat for visitors.** "The Caledonian mountains were built in several separate episodes over about 80 million years, and the dates differ between Scotland, Ireland and Scandinavia."

## 12. Variscan (Hercynian) orogeny

1. **Names.** Variscan and Hercynian are the same event; "Hercynian" is the older French and Iberian usage, "Variscan" the German and now the general one [memory]. Its continuation in North America is the Alleghanian (entry 8) and Ouachita; in north-west Africa the Mauritanide belt [abstract: Matte 2001 describes one Palaeozoic system "from the Caucasus to the Appalachian and Ouachita mountains"].
2. **Age: use 360 to 290 Ma.**
   - Start 360: in central Europe the Rheno-Hercynian Ocean closed "in earliest Carboniferous time", followed by deformation of the foreland (Franke 2000) [abstract]. The Devonian–Carboniferous boundary is about 359 Ma [memory].
   - End 290: Matte 2001 gives the Variscan "collage and orogeny" as 480–290 Ma [title]; his abstract says the wider system was "built between 480 and 250 Ma" [abstract]. The 480 figure includes the rifting and drifting of the small continents before any collision.
   - Disagreement: Kroner and co-workers describe prolonged convergence of Gondwana and Laurussia from 400 to 300 Ma, with subduction ending about 340 Ma [secondary]. Early high-pressure metamorphism of Devonian age (about 400–380 Ma) is reported in the Bohemian, Armorican and Iberian massifs [memory]. A start of 380 or 400 is therefore defensible; 360 marks the main continental collision.
   - Authors also disagree on the number of plates: several small plates (Avalonia, Armorica) between two large ones (Matte 2001; Franke 2000) [abstract] or two plates only (Kroner & Romer 2013) [secondary].
3. **Cause.** The southern continent Gondwana (with Africa) collided with the northern continent Laurussia (North America plus northern Europe), closing the Rheic Ocean and smaller seas and helping to assemble Pangaea [abstract: Matte 2001].
4. **Extent.** Matte 2001 gives the whole system as about 1,000 km broad and 8,000 km long [abstract].
   - Boxes: Iberian Massif `[36.8, -9.6, 43.9, -3.0]` (takes in the Lisbon coastal strip and the Duero basin, which are younger cover); Armorican Massif `[46.3, -5.2, 49.8, 0.3]`; Cornwall and Devon `[49.9, -6.0, 51.3, -3.0]`; southern Ireland and south Wales `[51.3, -10.5, 52.3, -2.8]` (folded sedimentary rock only); Massif Central `[43.3, 0.8, 47.0, 4.9]`; Vosges and Black Forest `[47.4, 6.5, 49.0, 8.6]` (takes in the Rhine Graben floor between them); Rhenish Massif and Ardennes `[49.6, 4.0, 51.5, 9.0]` (slate and sandstone, little deep rock); Harz `[51.4, 10.0, 52.0, 11.5]`; Bohemian Massif `[48.2, 11.8, 51.3, 17.5]`; western Corsica and Sardinia `[38.8, 8.0, 43.1, 9.6]`; Moroccan Meseta `[31.0, -9.5, 34.5, -3.5]` (much younger cover); Anti-Atlas `[28.5, -10.5, 31.5, -4.0]` (mild folding of older rock).
   - Constituent zones: Rheno-Hercynian, Saxo-Thuringian, Moldanubian (Kossmat's zones); in Iberia the Cantabrian, West Asturian-Leonese, Central Iberian, Ossa-Morena and South Portuguese zones; Armorican Massif; Massif Central; Bohemian Massif; Moroccan Meseta; Mauritanides [memory].
   - Provinces: 488 Rheno-Hercynian Belt; 467 Saxo-Thuringian Belt; 490 Moldanubian Belt; 468 Armorican Basin; 469 Iberian Massif; 470 Ossa-Morena Zone; 472 West Austerian Leonese Zone; 491 South Portuguese Zone; 14 Anti-Atlas Mountains; 83 Mauritanides; 171 Scythian Platform.
   - Poor fits: 462 Sardinia-Corsica Block is classed Alpine-Himalayan but its western part is Variscan granite and gneiss. 12 Atlas Mountains is classed Variscan-Hercynian, yet the High Atlas ranges themselves were raised in the Cenozoic; only the basement (Meseta) is Variscan. 15 Tindouf Basin, 35 Reguibat Rise and 74 North Africa Belt carry the Variscan class but the Reguibat Rise is a much older shield; do not use the class alone in Africa. 604 Charleston Arc (south-eastern USA) carries this class; see entry 8. Variscan rock also reappears inside younger belts (the "external massifs" of the Alps such as Mont Blanc, and the axial zone of the Pyrenees), so entries 2 and 3 overlap it.
5. **Surface today.** Worn-down roots: uplands and low mountains, none of them the original range. Granite, gneiss and schist of Variscan age are very widely exposed (Iberia, Brittany, Massif Central, Vosges, Black Forest, Bohemia, Corsica-Sardinia) [memory].
6. **Claims.** Width and length as in item 4 [abstract]. No direct measurement of height was found. Comparisons of the Variscan belt with a Tibet-like plateau exist in the literature [memory] but rest on analogy.
7. **For visitors.** "About 360 to 290 million years ago the continents that are now Africa and Europe collided, raising a wide mountain belt across what is now Spain, France, Germany and Czechia. Those mountains have long since worn away; the granite and gneiss at the surface today formed deep in their roots."
8. **Sources.**
   - Matte, P. 2001. The Variscan collage and orogeny (480–290 Ma) and the tectonic definition of the Armorica microplate: a review. *Terra Nova* 13(2): 122–128. doi:10.1046/j.1365-3121.2001.00327.x
   - Franke, W. 2000. The mid-European segment of the Variscides: tectonostratigraphic units, terrane boundaries and plate tectonic evolution. *Geological Society, London, Special Publications* 179(1): 35–61. doi:10.1144/gsl.sp.2000.179.01.05
   - Kroner, U. & Romer, R.L. 2013. Two plates — many subduction zones: the Variscan orogeny reconsidered. *Gondwana Research* 24(1): 298–329. doi:10.1016/j.gr.2013.03.001 (abstract seen only in fragments)
9. **Caveat for visitors.** "The dates are for the main collision. Earlier collisions of smaller landmasses began about 400 million years ago, and the timing differs from one part of Europe to another."

## 13. Uralian orogeny

1. **Names.** Uralian orogeny; the belt is the Uralides. Sometimes grouped with the Variscan, but Puchkov 2009 argues against "a simple geodynamic connection" [abstract].
2. **Age: use 380 to 250 Ma.** Puchkov 2009: "developed mainly between the Late Devonian and the Late Permian" [abstract]; Late Devonian is about 383–359 Ma and the Permian ended about 252 Ma [memory].
   - Phases [abstract, period names; Ma from memory]: island arc collides with the continent's edge, Late Devonian in the south (about 380–360) and Early Carboniferous in the north (about 359–330); continent-to-continent collision "beginning in the mid-Carboniferous" (about 325) and lasting to the Late Permian.
   - Later movements: "a brief resumption of orogenic activity in the Lower Jurassic and Pliocene–Quaternary time" [abstract]. The present relief owes something to that young uplift.
3. **Cause.** An ocean between the East European continent (Baltica, by then part of Laurussia) and the Kazakhstan and Siberian continents closed; first an island arc, then the continents themselves, collided [abstract for the sequence; memory for the names of the continents].
4. **Extent.** More than 2,000 km north to south.
   - Boxes: Mugodzhary (Kazakhstan) `[47.5, 57.0, 51.0, 60.5]`; Southern Urals `[51.0, 56.5, 56.0, 61.5]`; Middle Urals `[56.0, 57.0, 60.0, 62.0]`; Northern Urals `[60.0, 57.5, 65.0, 62.0]`; Polar Urals `[65.0, 59.0, 69.0, 67.5]`. Each takes in a strip of the flat Russian platform on the west and of the West Siberian plain on the east. Pay-Khoy and Novaya Zemlya `[69.0, 51.0, 77.0, 69.0]` continue the belt but were deformed later (early Mesozoic) [memory]; leave out unless wanted.
   - Zones, west to east: Pre-Uralian foredeep, West Uralian fold belt, Central Uralian zone, Main Uralian Fault, Magnitogorsk and Tagil arc zones, East Uralian zone, Trans-Uralian zone [memory].
   - Provinces: 519 Uralide Fold Belt; 361 Ural Volcanic Arcs. Related: 349 Tamir Fold and Thrust Belt (Taimyr; similar age).
   - Poor fits: 506 Timan Orogen and 496 Bol'shezemel'sk Domain are classed Uralian but belong to the older Timanian belt of latest Precambrian age [memory]; do not attach this entry to them.
5. **Surface today.** Low to middling mountains. The Uralides are unusual in having kept their deep crustal root and well-preserved ocean-floor and island-arc rocks [abstract: Puchkov 2009, "particularly well preserved"]. Metamorphic rock and granite of the event are exposed along the central and eastern zones [memory].
6. **Claims.** No published height estimate was found. Do not say the ancient Urals were "as high as the Himalaya".
7. **For visitors.** "About 380 to 250 million years ago an ocean closed here and two continents collided, building the Ural Mountains along the join. The range has been worn down since, and was lifted a little again in recent geological time."
8. **Sources.**
   - Puchkov, V.N. 2009. The evolution of the Uralian orogen. *Geological Society, London, Special Publications* 327(1): 161–195. doi:10.1144/sp327.9
   - Brown, D., Juhlin, C., Ayala, C., et al. [11 authors] 2008. Mountain building processes during continent–continent collision in the Uralides. *Earth-Science Reviews* 89(3–4): 177–195. doi:10.1016/j.earscirev.2008.05.001 (citation checked; abstract not read)
9. **Caveat for visitors.** "The collision began earlier in the south than in the north."

## 14. Central Asian Orogenic Belt (Altaids)

1. **Names.** Central Asian Orogenic Belt (CAOB); Altaids (Şengör's name); Ural–Mongolian or Central Asian fold belt in Russian usage; in China the eastern end is the Xing'an–Mongolian orogenic belt, closed along the Solonker suture [memory for the regional names].
2. **Age: full span about 1000 to 250 Ma; for a timeline tile use 300 to 250 Ma (final closing) and say the build-up was far longer.**
   - Windley et al. 2007: "The Central Asian Orogenic Belt (c. 1000–250 Ma) formed by accretion of island arcs, ophiolites, oceanic islands, seamounts, accretionary wedges, oceanic plateaux and microcontinents"; "the Palaeo-Asian Ocean closed in the Permian with formation of the Solonker suture" [abstract].
   - Xiao et al. 2015: three collage systems (Mongolia, Kazakhstan, and Tarim–North China) whose parts "were generated by the Neoproterozoic and were amalgamated in the Permo-Triassic" [abstract].
   - The "300" start for the final closing is my rounding of "Permian" and "Permo-Triassic" (Permian is about 299–252 Ma [memory]); it is not a figure from either abstract. Disagreement on the end: Permian (Windley) versus Permo-Triassic (Xiao).
3. **Cause.** Not one collision. For hundreds of millions of years island arcs and small continents were swept together at the edges of the Siberian, Baltic, Tarim and North China continents, in the way the western Pacific works today, until the ocean between them closed [abstract: Windley et al. 2007].
4. **Extent.** From the Urals to the Pacific, between the Siberian craton and the Tarim and North China cratons.
   - Boxes: Kazakh uplands `[46.0, 66.0, 54.0, 80.0]`; Tian Shan `[39.5, 66.0, 44.5, 95.0]` (takes in the Ferghana and Ili basins and the northern edge of the Tarim basin); Altai and Sayan `[46.0, 82.0, 54.0, 100.0]`; Mongolia `[42.0, 88.0, 52.0, 116.0]`; Transbaikalia `[49.0, 102.0, 57.0, 120.0]` (its northern edge runs onto the Siberian craton); Beishan and Inner Mongolia to north-east China `[39.5, 93.0, 50.0, 128.0]` (the southern edge runs onto the North China craton).
   - Provinces: every row with `last_orogeny` = Kazakhstan (29 rows: ids 128, 181, 182, 192–212, 215, 245, 272, 359, 360), Mongolian (27 rows: ids 136, 184–187, 189–191, 220–222, 238–244, 273–276, 299, 305, 350, 363) and Solonker (216 Bainaimiao-Ondor Sum Belt, 217 Erdaojing subduction complex, 218 Henegshan-Baolidao Accretionary Complex). Possibly also the Yenisey class (129 Yenisei-Sayan Orogen; 169 Angara Belt; 300 and 301 Yenisei Fold Belt; 304 Patom Fold Belt), which is the oldest, Neoproterozoic, part.
   - Poor fits: 299 West Siberian Basin and 240 Kuznetsk Basin are in the Mongolian class but are sedimentary basins. Names repeat (193 and 202 are both "Aktau Microcontinent"; 276 and 350 both "Tarvagatay Igneous Belt"). The map splits the belt into three classes by region, not by time, so a class cannot give a date.
5. **Surface today.** High mountains in the Tian Shan and Altai, but that relief is young: it was raised in the Cenozoic by the far-off push of India into Asia [memory]. The rocks are Palaeozoic. Granite is exceptionally widespread across Mongolia, Transbaikalia and Kazakhstan [memory].
6. **Claims.** Nothing on height. The honest claim is "a long history of island arcs and small collisions", not "a great range stood here".
7. **For visitors.** "Central Asia was put together piece by piece: over hundreds of millions of years, chains of volcanic islands and small continents were swept together here, and the last ocean between them closed about 300 to 250 million years ago. The high ranges of today, such as the Tian Shan, were raised much later."
8. **Sources.**
   - Windley, B.F., Alexeiev, D., Xiao, W., Kröner, A. & Badarch, G. 2007. Tectonic models for accretion of the Central Asian Orogenic Belt. *Journal of the Geological Society* 164(1): 31–47. doi:10.1144/0016-76492006-022
   - Xiao, W., Windley, B.F., Sun, S., et al. [9 authors] 2015. A tale of amalgamation of three Permo-Triassic collage systems in Central Asia: oroclines, sutures, and terminal accretion. *Annual Review of Earth and Planetary Sciences* 43(1): 477–507. doi:10.1146/annurev-earth-060614-105254
9. **Caveat for visitors.** "This was not a single event. Different parts of Central Asia were assembled at very different times, and the date shown is only for the final closing."

## 15. Qinling–Dabie orogeny (Indosinian)

1. **Names.** Qinling–Dabie (–Sulu) orogen; Central China Orogenic Belt. Chinese usage calls its Triassic phase "Indosinian", a word coined in Vietnam and applied to Triassic deformation all over China and Indochina; these were several separate collisions, not one [memory].
2. **Age: use 250 to 200 Ma. Medium-low confidence.** Dong & Santosh 2016: "the Triassic collisional orogeny occurred between the South Qinling Block and South China Block along the Mianlue suture" [secondary]; Triassic is about 252–201 Ma [memory]. The ultrahigh-pressure metamorphism in Dabie–Sulu is dated by U–Pb on zircon at roughly 240–220 Ma [memory; Hacker et al. 1998 and Liu & Liou 2011 are the sources to read, citations checked].
   - The belt had earlier orogenies: about 1.0 Ga, and a Palaeozoic one along the Shangdan suture (Dong & Santosh: "four major episodes") [secondary].
3. **Cause.** The South China (Yangtze) block collided with the North China block; the edge of South China was carried to depths of 100 km or more and returned [memory].
4. **Extent.** Boxes: Qinling `[32.5, 104.0, 34.8, 112.0]`; Tongbai–Dabie `[30.3, 112.0, 32.8, 117.0]`; Sulu (Shandong–Jiangsu) `[34.3, 118.3, 37.5, 122.7]`.
   - Provinces: 166 Dabie Orogen; 339 and 340 Su-Lu Belt (two ids, one name). Possible Korean continuation, debated: 341 and 342 Gyeonggi Massif, 802 Ogcheon Belt.
   - Poor fits: no province is named for the Qinling; I could not tell from the table which row holds it. The "Indosinian" class also covers 167 East Cathaysia, 237 West Cathaysia, 803 Jiangnan Orogen, 799 Western Yangtze Craton and the Indochina rows (229, 233, 227, 228, 230–232), which are different Triassic collisions.
5. **Surface today.** Mountains of moderate height (Qinling over 3,000 m [memory]), with relief renewed in the Cenozoic. Metamorphic rock of the event, including rock from extreme depth, and Triassic and Cretaceous granite are widely exposed [memory].
6. **Claims.** Depth of burial is well founded (minerals such as coesite and diamond) [memory]; that says nothing direct about surface height.
7. **For visitors.** "About 250 to 200 million years ago the two blocks that make up northern and southern China collided along this line, raising a mountain belt. Some of the rock here was dragged very deep during the collision before returning to the surface."
8. **Sources.**
   - Dong, Y. & Santosh, M. 2016. Tectonic architecture and multiple orogeny of the Qinling Orogenic Belt, Central China. *Gondwana Research* 29(1): 1–40. doi:10.1016/j.gr.2015.06.009
   - Hacker, B.R., Ratschbacher, L., Webb, L., Ireland, T., Walker, D. & Dong, S. 1998. U/Pb zircon ages constrain the architecture of the ultrahigh-pressure Qinling–Dabie Orogen, China. *Earth and Planetary Science Letters* 161(1–4): 215–230. doi:10.1016/s0012-821x(98)00152-6 (abstract not read)
   - Liu, F.L. & Liou, J.G. 2011. Zircon as the best mineral for P–T–time history of UHP metamorphism: a review on mineral inclusions and U–Pb SHRIMP ages of zircons from the Dabie–Sulu UHP rocks. *Journal of Asian Earth Sciences* 40(1): 1–39. doi:10.1016/j.jseaes.2010.08.007 (abstract not read)
9. **Caveat for visitors.** "This mountain belt was built in several stages; the dates given are for the last major collision."

## 16. Cape orogeny (Gondwanide)

1. **Names.** Cape orogeny; the Cape Fold Belt. Part of the Gondwanide orogen, which continues in the Sierra de la Ventana (Argentina), the Falkland Islands and Antarctica (Ellsworth and Pensacola Mountains) [memory]; Ramos 2009 uses "Gondwanides orogeny" for the South American part [abstract].
2. **Age: use 275 to 250 Ma.** Hansma et al. 2016, argon dating of mica grown in the folds: an older group 261 ± 3 to 276 ± 5 Ma and a younger group 248 ± 2 to 254.6 ± 2.1 Ma, read as deformation at about 275–260 Ma and cooling at about 255–245 Ma, or else as two separate events [secondary: search summary of the abstract]. Blewett et al. 2019: a cluster at 253 ± 2 Ma taken as the main or final phase [secondary].
   - Disagreement: one event with cooling, or two events; older potassium–argon work suggested several pulses reaching into the Triassic, to about 230–215 Ma [memory].
3. **Cause.** Debated. The belt lay well inside Gondwana, far from the ocean trench on its southern edge; explanations include compression passed inland from that subduction zone and a collision with Patagonia (Ramos 2009: "amalgamation of the ... Patagonia terranes in Early Permian times") [abstract for the Patagonia statement; memory for the rest].
4. **Extent.** Boxes: western branch (Cederberg) `[-34.5, 18.2, -31.5, 19.8]`; southern branch (Cape Town to Port Elizabeth) `[-34.9, 18.3, -32.8, 27.0]`; Sierra de la Ventana `[-38.6, -62.8, -37.4, -61.2]`.
   - Provinces: 45 Cape Fold Belt; 784 Sierra del Ventana; 785 Falkland Block; in Antarctica 98 Ellsworth Province. All are classed "Terra Australis".
5. **Surface today.** Rugged ranges of folded quartz sandstone, up to about 2,000 m [memory]; the relief is erosional. **The rock is folded sedimentary rock, only lightly metamorphosed; no granite of this age is known in the belt** [memory]. The granite at Cape Town is about 540 Ma and belongs to the earlier Pan-African (Saldanian) event [memory]. This entry will seldom match a metamorphic or plutonic spot.
6. **Claims.** None on height.
7. **For visitors.** "About 275 to 250 million years ago, when Africa was part of the supercontinent Gondwana, the layered sandstones here were squeezed into great folds. Those folds, since carved by erosion, form the Cape mountains."
8. **Sources.**
   - Hansma, J., Tohver, E., Schrank, C., Jourdan, F. & Adams, D. 2016. The timing of the Cape Orogeny: new 40Ar/39Ar age constraints on deformation and cooling of the Cape Fold Belt, South Africa. *Gondwana Research* 32: 122–137. doi:10.1016/j.gr.2015.02.005
   - Blewett, S.C.J., Phillips, D. & Matchan, E.L. 2019. Provenance of Cape Supergroup sediments and timing of Cape Fold Belt orogenesis: constraints from high-precision 40Ar/39Ar dating of muscovite. *Gondwana Research* 70: 201–221. doi:10.1016/j.gr.2019.01.009
   - Blewett, S.C.J. & Phillips, D. 2016. An overview of Cape Fold Belt geochronology: implications for sediment provenance and the timing of orogenesis. In *Origin and Evolution of the Cape Mountains and Karoo Basin* (Regional Geology Reviews): 45–55. doi:10.1007/978-3-319-40859-0_5 (abstract not read)
9. **Caveat for visitors.** "Why these folds formed so far from the edge of the ancient continent is still debated."
## 17. East African Orogen (Pan-African; with the Kuunga orogeny)

1. **Names.** East African Orogen (EAO) or East African Orogeny; part of the "Pan-African" events, a loose name for all the collisions of about 850–500 Ma that assembled Gondwana. Its northern half is the Arabian-Nubian Shield, its southern half the Mozambique Belt. A later, overlapping event is the Kuunga (Kuungan, or Malagasy) orogeny. In Brazil the same family of events is called Brasiliano (entry 18).
2. **Age: use 650 to 550 Ma; phases below.** All from Fritz et al. 2013 as given in a search summary of the abstract and a repository copy [secondary]:
   - whole consolidation "between ~850 and 550 Ma";
   - Arabian-Nubian Shield: island arcs and small continents accreted as the Mozambique Ocean closed, about 850–620 Ma;
   - East African Orogeny in the strict sense: high-grade metamorphism about 650–620 Ma in Tanzania and Mozambique, nappe stacking complete about 620 Ma;
   - Kuungan orogeny about 600–500 Ma (southern Tanzania, Zambia, Malawi, Mozambique, Madagascar, and on into Antarctica);
   - stretching and collapse about 600–550 Ma in the north and 550–480 Ma in Mozambique and southern Madagascar.
   - Disagreement: whether the East African and Kuunga events are two orogenies or stages of one, and where the line between them runs, is not settled (Collins & Pisarevsky 2005; Meert 2003: citations checked, abstracts not read) [memory].
3. **Cause.** The Mozambique Ocean closed between the pieces that became western Gondwana (most of Africa) and eastern Gondwana (India, Madagascar, East Antarctica, Australia), sweeping up island arcs in the north and ending in a continent-to-continent collision in the south [secondary].
4. **Extent.**
   - Boxes, Arabian-Nubian Shield: Sinai and Egyptian Eastern Desert `[22.0, 32.5, 29.5, 36.0]`; Red Sea Hills, Eritrea, northern Ethiopia `[12.0, 33.0, 22.0, 40.0]` (much lava cover in Ethiopia); Arabian Shield `[15.0, 36.0, 29.0, 46.0]` (the Red Sea coastal plain and young lava fields are inside the box).
   - Boxes, Mozambique Belt: southern Ethiopia and Kenya `[-1.0, 34.0, 8.0, 40.0]` (largely hidden under rift lavas); eastern Tanzania `[-11.5, 35.0, -1.0, 39.5]`; northern Mozambique and Malawi `[-18.0, 32.5, -10.5, 41.0]`; Madagascar `[-25.7, 43.2, -12.0, 50.5]` (the western third is younger sedimentary rock).
   - Boxes, Kuunga-age rock outside Africa: southern India `[8.0, 76.0, 13.0, 80.0]` (takes in much older rock too); Sri Lanka `[5.8, 79.6, 9.9, 82.0]`.
   - Provinces, Arabian-Nubian Shield: 9 Sinai Shield; 47 Midyan Terrane; 48 Asir Terrane; 49 Ar Rayn Terrane; 50 Ad Dawadimi Terrane; 51 Al Madinah Terrane; 52 Jeddah Terrane; 53 Afif Terrane; 54 Hulayfah Terrane; 58 Ha'il Terrane; 55 Gabgaba and Gebeit Terranes; 56 East Desert Terrane; 79 Bayuda Terrane; 76 Nakfa Terrane; 90 Haya Terrane.
   - Provinces, Mozambique Belt and Madagascar: 62 Mozambique Belt; 805 Tanzanian Eastern Granulites; 806 Cabo Delgado Nappe Complex; 807 Marrupa Province; 808 Unango Province; 804 Nampula Block; 814 Malawi Complex; 809 Barue Complex; 8 South Azania; 46 North Azania; 27 Mait Complex; 28 Bekilv Block; 29 Antenanarivo Block; 30 Itremo Block; 31 Bemarivo Belt.
   - Provinces, Kuunga class in India and Sri Lanka: 520 Southern Granulite Terrane; 554 Trivandrum-Nagercoil Block; 543 Vijayan Complex; 544 Wanni Complex; 545 Highland Complex.
   - Poor fits: the "East African" class also holds ground that was never part of the orogen's mountains: 65 Arabian Platform; 26 Zagros Foreland Basin; 61 Palmyrides; 60 Israel Accretionary complex; 59 Semail Ophilite (Oman; emplaced in the Cretaceous [memory]); and in India 521 Aravalli Fold Belt, 539 Rajasthan Province, 542 Indus Plain and 791 Himalayan Foreland Basin. It also holds the separate Pan-African belts of southern Africa (41 Damara Orogenic Belt; 1 Gariep Belt; 817 Lufilian Arc; 862 Zambezi Belt; 813 West Zambezi Belt; 818 Southern Irumide Belt), which are a different collision of about the same age and are not covered by this entry. 540 Shillong Plateau and 417 Musgrave Ranges carry the Kuunga class.
5. **Surface today.** Worn-down roots. In the north, low-grade island-arc rock and abundant granite; in Tanzania, Mozambique, Madagascar, southern India and Sri Lanka, deep-crustal granulite and gneiss. Present highlands (Ethiopia, Kenya, the Red Sea flanks) owe their height to much younger rifting and volcanism, not to this event [memory].
6. **Claims.** Fritz et al. call the Tanzania–Madagascar segment a "Himalayan-type orogen" with crust thickened to about double [secondary]. That describes the type of collision; it is not a height.
7. **For visitors.** "About 650 to 550 million years ago an ocean closed here and landmasses collided to form the supercontinent Gondwana, raising a mountain belt that ran from Arabia to Mozambique. The mountains are long gone; the rock at the surface comes from deep inside them."
8. **Sources.**
   - Fritz, H., Abdelsalam, M., Ali, K.A., et al. [14 authors] 2013. Orogen styles in the East African Orogen: a review of the Neoproterozoic to Cambrian tectonic evolution. *Journal of African Earth Sciences* 86: 65–106. doi:10.1016/j.jafrearsci.2013.06.004
   - Stern, R.J. 1994. Arc assembly and continental collision in the Neoproterozoic East African Orogen: implications for the consolidation of Gondwanaland. *Annual Review of Earth and Planetary Sciences* 22(1): 319–351. doi:10.1146/annurev.ea.22.050194.001535 (abstract not read)
   - Collins, A.S. & Pisarevsky, S.A. 2005. Amalgamating eastern Gondwana: the evolution of the Circum-Indian Orogens. *Earth-Science Reviews* 71(3–4): 229–270. doi:10.1016/j.earscirev.2005.02.004 (abstract not read)
9. **Caveat for visitors.** "The north of this belt was assembled earlier, from about 850 million years ago, and the south was affected by a second collision that lasted until about 500 million years ago."

## 18. Brasiliano orogeny

1. **Names.** Brasiliano orogeny, cycle or collage (South America); the African counterparts across the Atlantic are called Pan-African (West Congo, Kaoko, Dom Feliciano–Gariep belts). Same family of events as entry 17, different collisions.
2. **Age: use 660 to 500 Ma. Low confidence.** Brito Neves et al. 2014 describe "four distinct pulses"; the two seen in the abstract fragment are about 800–740 Ma and about 660–610 Ma [secondary]. The later two pulses were not seen; figures of about 590–560 and 520–500 Ma are [memory] and were **not** confirmed (a search for them did not match the abstract). The article is open access (SciELO) and should be read before this entry is used.
   - Individual belts have their own, better-dated histories (Ribeira: Heilbron & Machado 2003; Araçuaí: Pedrosa-Soares et al. 2001; citations checked, abstracts not read).
3. **Cause.** The Amazonian, São Francisco–Congo, Río de la Plata and other old continental blocks, and smaller pieces between them, collided as the oceans separating them closed, forming western Gondwana [memory].
4. **Extent.**
   - Boxes: Mantiqueira province south (Dom Feliciano; Uruguay to Santa Catarina) `[-34.5, -56.0, -28.0, -48.5]` (west side takes in Paraná lavas); Ribeira belt (Paraná state to Rio de Janeiro and Espírito Santo) `[-26.5, -50.0, -19.5, -40.0]` (west edge takes in the Paraná Basin rim and, in Minas Gerais, the southern São Francisco craton); Araçuaí belt `[-19.5, -44.0, -15.0, -39.0]`; Brasília belt (Tocantins province) `[-21.0, -50.5, -11.0, -46.0]`; Borborema province `[-10.5, -41.5, -3.0, -34.8]`; Paraguay belt `[-22.0, -59.0, -14.0, -54.0]` (mostly low-grade folded sedimentary rock).
   - Provinces: 765 Ribeira Belt (south); 821 Ribeira Belt (north); 819 Araçuaí Belt (south); 820 Araçuaí Belt (north); 770 Tocantins Province; 769 Paraguay-Tucavaca Belt; 767 Nico Pérez Terrane; in Africa 19 West Congo and Kimezian Belts, 42 Kaoka Belt, 24 East Congo Mobile Belt.
   - Poor fits: 761 Borborema Province, 760 Media Coreau Domain and 759 Gurupi Belt are Brasiliano in Brazilian usage but are classed "Saharide" by the map (after their African continuation). 762 Parnaiba Block is classed Brasiliano but is the floor of a sedimentary basin. The bounding-box corners of 765 and 819 (both reaching 35° S) do not match where the Ribeira and Araçuaí belts lie, so the "(south)/(north)" names should be checked against the map before use.
5. **Surface today.** Worn-down roots, later lifted along the Atlantic margin; the coastal ranges (Serra do Mar, Mantiqueira) are young relief cut in old rock [memory]. Gneiss, migmatite and granite of the event are the bedrock of Rio de Janeiro, São Paulo, Belo Horizonte's eastern surroundings, Vitória, Porto Alegre and Recife [memory].
6. **Claims.** None on height. Do not connect the Sugarloaf or Serra do Mar scenery to the height of the ancient range.
7. **For visitors.** "Between about 660 and 500 million years ago several ancient landmasses collided here to form the supercontinent Gondwana, raising mountain belts across what is now Brazil. The granite and gneiss at the surface today formed deep beneath those mountains."
8. **Sources.**
   - Brito Neves, B.B. de, Fuck, R.A. & Pimentel, M.M. 2014. The Brasiliano collage in South America: a review. *Brazilian Journal of Geology* 44(3): 493–518. doi:10.5327/z2317-4889201400030010
   - Heilbron, M. & Machado, N. 2003. Timing of terrane accretion in the Neoproterozoic–Eopaleozoic Ribeira orogen (SE Brazil). *Precambrian Research* 125(1–2): 87–112. doi:10.1016/s0301-9268(03)00082-2
   - Pedrosa-Soares, A.C. [Crossref lists the first author only] 2001. The Araçuaí-West-Congo Orogen in Brazil: an overview of a confined orogen formed during Gondwanaland assembly. *Precambrian Research* 110(1–4): 307–323. doi:10.1016/s0301-9268(01)00174-7 (co-authors UNVERIFIED)
9. **Caveat for visitors.** "This was a series of collisions, not one, and each mountain belt in Brazil has its own dates within this span."

## 19. Grenville orogeny (with the Sveconorwegian of Scandinavia)

1. **Names.** Grenville or Grenvillian orogeny (North America). Its phases are the Ottawan and the Rigolet. The belt of the same age in southern Norway and south-west Sweden is the Sveconorwegian orogeny; whether the two were one continuous collision belt is disputed [memory; Bingen et al. 2021 is the current review, citation below, abstract not read].
2. **Age: use 1090 to 980 Ma.** Rivers 2009: metamorphism falls into "a relatively high T Ottawan (c. 1090–1020 Ma) phase" and "a relatively lower T Rigolet (c. 1000–980 Ma) phase" [abstract]. These rest on U–Pb dating of metamorphic minerals compiled along the whole province.
   - Disagreement: the Rigolet is also quoted as 1005–980 or 1010–980 Ma [secondary].
   - Earlier events in the same ground (Elzevirian, about 1245–1225 Ma; Shawinigan, about 1190–1140 Ma) [memory] are usually treated as separate, earlier accretion and are outside the range given.
   - Sveconorwegian: commonly quoted as about 1140–920 Ma [memory]; not verified here.
3. **Cause.** A collision between Laurentia (ancient North America) and another continent, commonly taken to be Amazonia, during the assembly of the supercontinent Rodinia [memory]. Rivers 2009 treats it as "a large hot long-duration collisional orogen" [abstract].
4. **Extent.**
   - Boxes, Canada and New York: central Ontario `[44.3, -81.0, 46.8, -76.0]`; western Quebec `[45.3, -78.0, 48.7, -73.5]`; Laurentides to Saguenay `[46.3, -74.0, 50.5, -68.0]`; Côte-Nord `[48.5, -69.0, 52.7, -62.0]`; Lower North Shore and southern Labrador `[50.0, -62.5, 53.8, -55.5]`; Adirondacks `[43.0, -76.0, 45.0, -73.3]`. The Ontario and Quebec boxes take in the flat-lying younger limestone of the St Lawrence and Ottawa lowlands (Ottawa, Montreal, Quebec City) and, on their north-west side, a strip of the older Superior Province beyond the Grenville Front.
   - Smaller outcrops: Llano Uplift, Texas `[30.0, -99.5, 31.2, -98.0]`. Grenville-age basement also forms the core of the Blue Ridge and other Appalachian inliers (Long Range of Newfoundland, Green Mountains, Berkshires, Hudson Highlands, Reading Prong, Blue Ridge from Virginia to Georgia) [abstract title: McLelland et al. 2010]; these are too narrow for boxes and overlap entries 8–10.
   - Sveconorwegian: `[57.5, 5.0, 61.5, 13.5]` (southern Norway and south-west Sweden; takes in the Oslo Rift, which is younger volcanic rock, and at its north edge the Caledonian nappes).
   - Constituent belts: Parautochthonous Belt, Allochthonous Polycyclic and Monocyclic Belts, separated by the Grenville Front and the Allochthon Boundary Thrust [abstract for the two boundaries; memory for the belt names]; Central Gneiss Belt, Central Metasedimentary Belt, Adirondack Highlands and Lowlands [memory].
   - Provinces: 605 Grenville Orogeny; 570 Llano Province; 603 Sabine Terrane; 457 Sveconorwegian Belt. The map class is "Rodinian", which also covers unrelated belts of similar age in Africa (43 Namaqua-Natal Belt; 70 and 73 Kibaran Belt; 815 Irumide Belt), South America (783 Rondonia-San Ignacio Belt) and Antarctica; these are not the Grenville orogeny proper. 483 Bothnia microcontinent carries the Rodinian class but lies in the Svecofennian (entry 21).
5. **Surface today.** Worn-down roots; gently rolling shield country, with the Adirondacks a young dome [memory]. High-grade gneiss, marble, anorthosite and granite of the event are almost the only bedrock across the province. Rocks now at the surface were buried to mid- and lower-crustal depths [title: Rivers 2008, "lower, mid, and upper orogenic crust"].
6. **Claims.** Rivers 2009 argues the evidence is "compatible with some form of channel flow beneath an orogenic plateau" [abstract]. That is an inference from metamorphic and structural data and a comparison with Tibet; it is not a measured height. Acceptable: "a mountain belt comparable in scale to the largest of today, according to geologists who have studied its roots". Not acceptable: any figure in metres, snow, or a named modern look-alike stated as fact.
7. **For visitors.** "About 1,090 to 980 million years ago two continents collided here, building a great mountain belt along what is now eastern Canada. Erosion has removed the mountains entirely; the rock at the surface was once many kilometres down in their roots."
8. **Sources.**
   - Rivers, T. 2009. The Grenville Province as a large hot long-duration collisional orogen – insights from the spatial and thermal evolution of its orogenic fronts. *Geological Society, London, Special Publications* 327(1): 405–444. doi:10.1144/sp327.17
   - Rivers, T. 2008. Assembly and preservation of lower, mid, and upper orogenic crust in the Grenville Province—Implications for the evolution of large hot long-duration orogens. *Precambrian Research* 167(3–4): 237–259. doi:10.1016/j.precamres.2008.08.005 (abstract seen only in fragments)
   - McLelland, J.M., Selleck, B.W. & Bickford, M.E. 2010. Review of the Proterozoic evolution of the Grenville Province, its Adirondack outlier, and the Mesoproterozoic inliers of the Appalachians. In *From Rodinia to Pangea: The Lithotectonic Record of the Appalachian Region* (GSA Memoir 206). doi:10.1130/2010.1206(02) (no page numbers in Crossref; abstract not read)
9. **Caveat for visitors.** "The dates are for the final collision; the same ground had been through earlier upheavals over the previous 150 million years or more."

## 20. Trans-Hudson orogeny

1. **Names.** Trans-Hudson Orogen (THO). Arms and correlatives carry local names: Cape Smith Belt, New Quebec and Torngat orogens, Foxe and Reindeer orogenies in Canada; Nagssugtoqidian and Rinkian in Greenland [abstract for Snowbird, Foxe, Reindeer; memory for the others].
2. **Age: use 1920 to 1800 Ma.** Corrigan et al. 2009: the Manikewan Ocean opened from about 2.07 to 1.92 Ga, "followed by its demise in the interval 1.92–1.80 Ga" [abstract]. Rests on U–Pb zircon dating of arc rocks and metamorphism.
   - Phases [abstract]: Snowbird 1.92–1.89 Ga; Foxe 1.88–1.865 Ga; Reindeer 1.87–1.865 Ga; then accretion of the Sask craton and final collision with the Superior craton. The final collision is cited from the same paper as 1.83–1.80 Ga [secondary].
3. **Cause.** An ocean closed between the Superior continent (now central Canada) and a group of older continents to the north-west (Hearne, Rae and others), with island arcs and small continents caught between [abstract]. St-Onge et al. 2006 call it "notably similar in scale, duration and character" to the Himalaya–Karakoram–Tibet collision [abstract].
4. **Extent.**
   - Boxes: exposed core in Saskatchewan and Manitoba `[54.0, -106.5, 60.0, -96.0]` (the south-east corner runs onto the Superior craton); Ungava, Cape Smith Belt `[60.0, -79.0, 62.5, -71.0]`; southern Baffin Island `[62.0, -75.0, 67.0, -64.0]`; New Quebec and Torngat arms `[55.0, -70.0, 60.5, -62.0]`; Black Hills core, South Dakota `[43.7, -104.2, 44.5, -103.2]`. South of about 54° N the belt runs on beneath the Prairies and Dakotas but is buried under flat-lying younger rock, so no box is given.
   - Divisions: Churchill margin, Reindeer Zone, Superior margin [abstract]; within the Reindeer Zone the Flin Flon, Glennie, La Ronge–Lynn Lake and Kisseynew domains; Wathaman batholith; Thompson Nickel Belt [memory].
   - Provinces: 581 Trans-Hudson Orogen; 594 La Range Arc; 618 Meta Incognita Terrane; 626 Sugluk Terrane; 627 Cumberland Batholith-Torngat and Narsajuaq Arcs; 600 Foxe Orogen; 597 Southeast Churchill Province; 598 Burwell Mobile Belt; 632 Snowbird Tectonic Zone; in Greenland 587 Nagssugtoqidian Mobile Belt and 655 Rinkinian Orogen.
   - Poor fits: the bounding box of 581 reaches 42° N, so most of that province is buried. The class "Inner-Nunanian" also holds the Taltson and Thelon arcs (the id 671 is used for both), 735 Rae Province and 596 Hearne Province, and belts in Siberia, North China and Europe, which are other events of broadly similar age; the class alone must not be read as "Trans-Hudson".
5. **Surface today.** Worn-down roots; low shield country with lakes. Gneiss, granite and metamorphosed volcanic rock of the event are the bedrock throughout the exposed part.
6. **Claims.** The comparison with the Himalaya is the authors' own (St-Onge et al. 2006) [abstract] and rests on structure and metamorphism. High-pressure rock (eclogite) of about 1.83 Ga shows deep burial of continental crust (Weller & St-Onge 2017) [secondary]. No height estimate.
7. **For visitors.** "About 1.9 to 1.8 billion years ago an ocean closed here and ancient continents collided, welding together the core of North America. Geologists compare the collision with the one that is building the Himalaya today, though the mountains themselves vanished long ago."
8. **Sources.**
   - Corrigan, D., Pehrsson, S., Wodicka, N. & de Kemp, E. 2009. The Palaeoproterozoic Trans-Hudson Orogen: a prototype of modern accretionary processes. *Geological Society, London, Special Publications* 327(1): 457–479. doi:10.1144/sp327.19
   - St-Onge, M.R., Searle, M.P. & Wodicka, N. 2006. Trans-Hudson Orogen of North America and Himalaya-Karakoram-Tibetan Orogen of Asia: structural and thermal characteristics of the lower and upper plates. *Tectonics* 25(4): article 2005TC001907. doi:10.1029/2005tc001907
   - Weller, O.M. & St-Onge, M.R. 2017. Record of modern-style plate tectonics in the Palaeoproterozoic Trans-Hudson orogen. *Nature Geoscience* 10(4): 305–311. doi:10.1038/ngeo2904 (abstract not read)
9. **Caveat for visitors.** "Rocks this old have been through later events too, and most of this ancient belt is hidden under younger rock."

## 21. Svecofennian orogeny

1. **Names.** Svecofennian orogeny (Finland, Sweden); Svecokarelian is an older name that also takes in the reworked edge of the Karelian craton [memory]. Korja et al. 2006 divide it into five partly overlapping orogenies: Lapland-Savo, Lapland-Kola, Fennian, Nordic and Svecobaltic [abstract].
2. **Age: use 1920 to 1790 Ma.** Korja et al. 2006, four stages [abstract]: microcontinent accretion 1.92–1.88 Ga; large-scale extension 1.87–1.84 Ga; continent–continent collision 1.87–1.79 Ga; gravitational collapse 1.79–1.77 Ga. Rests on U–Pb zircon ages of granites and metamorphism.
   - Disagreement [secondary]: stage boundaries shift between papers by the same group (accretion to 1.87; collision 1.84–1.79); whole-orogeny ranges of 1.92–1.76 Ga and 1.88–1.79 Ga are also in use.
3. **Cause.** Island arcs and small continents were swept against the older Karelian continent, and the belt was finished by two continental collisions [abstract].
4. **Extent.** About 1 million km² [secondary].
   - Boxes: southern and central Finland `[59.7, 20.5, 63.8, 31.0]` (the north-east corner takes in older Karelian craton); Ostrobothnia to Oulu `[63.5, 22.0, 65.5, 27.0]`; Bergslagen and Stockholm–Uppsala `[58.3, 14.5, 61.0, 19.2]`; central and northern Sweden `[61.0, 14.5, 66.0, 22.5]` (the west edge takes in the Caledonian front and the younger Transscandinavian granite belt); Norrbotten `[65.5, 18.0, 68.5, 24.0]`. South of the Gulf of Finland the belt continues under Estonia, Latvia and Lithuania beneath younger rock: no box.
   - Constituent units: Central Finland Granitoid Complex, Tampere and Pirkanmaa belts, Savo belt, Uusimaa and Häme belts (southern Finland arc complex), Pohjanmaa (Bothnian) belt; in Sweden the Bergslagen, Bothnian basin and Skellefte districts [memory].
   - Provinces: 455 Central Finland Arc Complex; 484 Central Finland Granitoid Complex; 481 Bergslagen-Livonia; 482 Ljusdal; 483 Bothnia microcontinent; buried parts 480 Mid-Baltic Belt and 479 Amberland.
   - Poor fits: 483 Bothnia microcontinent is classed "Rodinian", which looks like an error for this region. 500 and 501 Transscandinavian Igneous Belt (two ids, one name, two different classes) is a granite belt that mostly post-dates the orogeny. The class "Circum-Nunanian" also covers unrelated belts on other continents.
5. **Surface today.** Worn-down roots: low, ice-scoured shield. Granite, gneiss, migmatite and schist of the event are the bedrock nearly everywhere, including under Helsinki, Stockholm, Tampere and Turku [memory].
6. **Claims.** No height estimate found. The collapse stage (1.79–1.77 Ga) is itself an inference that thick, high crust once existed [abstract].
7. **For visitors.** "About 1.9 to 1.8 billion years ago chains of volcanic islands and small continents were pressed together here, building a mountain belt across what is now Finland and Sweden. Only the deep roots remain, exposed as the hard granite and gneiss of the Nordic bedrock."
8. **Sources.**
   - Korja, A., Lahtinen, R. & Nironen, M. 2006. The Svecofennian orogen: a collage of microcontinents and island arcs. *Geological Society, London, Memoirs* 32(1): 561–578. doi:10.1144/gsl.mem.2006.032.01.34
   - Lahtinen, R., Korja, A. & Nironen, M. 2005. Chapter 11 Paleoproterozoic tectonic evolution. In *Precambrian Geology of Finland: Key to the Evolution of the Fennoscandian Shield* (Developments in Precambrian Geology): 481–531. doi:10.1016/s0166-2635(05)80012-x (abstract not read)
   - Nironen, M. 1997. The Svecofennian Orogen: a tectonic model. *Precambrian Research* 86(1–2): 21–44. doi:10.1016/s0301-9268(97)00039-9 (abstract not read)
9. **Caveat for visitors.** "The belt was built in several stages that overlapped, and geologists place the stage boundaries a little differently."

## 22. Tasmanides of eastern Australia (Delamerian, Lachlan and New England orogenies)

1. **Names.** Tasmanides, or Tasman Orogenic System: five belts along eastern Australia (Delamerian, Lachlan, Thomson, Mossman/North Queensland, New England) [abstract: Glen 2005, "five orogenic belts"; memory for the list]. Named deformation events: Delamerian; Benambran, Tabberabberan and Kanimblan (Lachlan); Hunter–Bowen (New England). The Delamerian is the same event as the Ross orogeny of Antarctica [memory].
2. **Age: three rows.**
   - **Delamerian: use 514 to 490 Ma.** Glen 2005: convergent-margin tectonism and accretion "in the Middle-Late Cambrian" [abstract]; the two figures are [memory].
   - **Lachlan: use 450 to 340 Ma.** Foster & Gray 2000: "stepwise deformation and metamorphism from Late Ordovician (~450 Ma) through early Carboniferous times, with dominant events at about 440–430 Ma and 400–380 Ma" [abstract]. "340" is my figure for early Carboniferous [memory]. Glen 2005 names the cycles: Benambran (ending latest Ordovician–earliest Silurian) and Tabberabberan (Silurian–Middle Devonian) [abstract].
   - **New England (Hunter–Bowen): use 265 to 230 Ma. Both figures [memory]**; Rosenbaum 2018 says only that the record runs "from the Cambrian to the Triassic" [abstract].
   - Character: "relatively short episodes of contractional deformation alternated with longer periods of crustal extension accompanied by voluminous magmatism" (Rosenbaum 2018) [abstract].
3. **Cause.** No continental collision. Eastern Australia was the edge of Gondwana facing the Pacific; ocean floor sank beneath it for 300 million years, and deep-sea sediment, island arcs and small blocks were squeezed against the continent in bursts [abstract: Foster & Gray; Rosenbaum].
4. **Extent.** "The eastern third of Australia" [abstract: Rosenbaum]; about 2.5 million km² added to Gondwana [abstract: Foster & Gray].
   - Boxes, Delamerian: Mount Lofty and Flinders Ranges, Kangaroo Island `[-36.5, 137.5, -30.0, 140.5]`; western Victoria `[-38.5, 140.5, -36.5, 142.5]`; western Tasmania `[-43.7, 144.5, -40.5, 146.6]`.
   - Boxes, Lachlan: Victoria `[-39.2, 142.5, -36.0, 150.0]` (takes in young lava plains west of Melbourne and the Gippsland basin); New South Wales `[-37.5, 145.0, -31.0, 150.3]` (the west is hidden under the Murray basin; the north-east corner touches the Sydney Basin sandstone); eastern Tasmania `[-43.7, 146.5, -40.7, 148.5]`.
   - Boxes, New England: `[-33.0, 150.0, -28.0, 153.6]`; `[-28.0, 150.0, -23.0, 153.5]`; North Queensland (Mossman/Hodgkinson) `[-20.0, 144.0, -15.0, 146.5]`.
   - Provinces: Delamerian: 394 Delamerian Orogen; 393 North Delamerian Orogen; 418 Adelaide Rift Complex; 886 Western Tasmania. Lachlan: 388 Lachlan Fold Belt; 389 Stalwell Zone; 382 Wagga-Omeo Metamorphic Complex; 386 Macquarie Arc; 387 Hay-Booligal Zone; 885 Eastern Tasmania. New England and north: 426 New England Orogen; 367 Mossman Orogen. Buried: 364 East Thompson Orogen; 372 West Thompson Orogen.
   - Poor fits: every one of these is classed "Terra Australis", a class that also spans the Andes, Antarctica and New Zealand; it cannot give a date. 370 Sydney-Surat Basin and 390 Darling Basin carry the class but are sedimentary basins. 400 Arunta Block (central Australia) carries it too: that is the separate Alice Springs orogeny, not covered here.
5. **Surface today.** Worn-down roots, lifted later to form the Great Dividing Range (a young, erosional highland) [memory]. Granite is extremely widespread ("voluminous granitic plutons") [abstract]; most of the other rock is folded deep-sea sandstone and slate, with high-grade metamorphic rock only in belts (Wagga-Omeo, Mount Lofty, western Tasmania) [memory].
6. **Claims.** None on height. The style (folded sea-floor sediment, granite) does not by itself show a high range.
7. **For visitors.** (Lachlan) "From about 450 to 340 million years ago this was the edge of the supercontinent Gondwana, where deep-sea sediment and volcanic islands were squeezed against the continent in several bursts and large bodies of granite formed below. Eastern Australia was built up in this way, belt by belt."
8. **Sources.**
   - Rosenbaum, G. 2018. The Tasmanides: Phanerozoic tectonic evolution of eastern Australia. *Annual Review of Earth and Planetary Sciences* 46(1): 291–325. doi:10.1146/annurev-earth-082517-010146
   - Glen, R.A. 2005. The Tasmanides of eastern Australia. *Geological Society, London, Special Publications* 246(1): 23–96. doi:10.1144/gsl.sp.2005.246.01.02
   - Foster, D.A. & Gray, D.R. 2000. Evolution and structure of the Lachlan Fold Belt (Orogen) of eastern Australia. *Annual Review of Earth and Planetary Sciences* 28(1): 47–80. doi:10.1146/annurev.earth.28.1.47
   - Gray, D.R. & Foster, D.A. 2004. Tectonic evolution of the Lachlan Orogen, southeast Australia: historical review, data synthesis and modern perspectives. *Australian Journal of Earth Sciences* 51(6): 773–817. doi:10.1111/j.1400-0952.2004.01092.x
9. **Caveat for visitors.** "This was a long series of short squeezing episodes separated by quieter times, not a single collision."

## 23. Kaikōura orogeny (Southern Alps, New Zealand)

1. **Names.** Kaikōura orogeny: the New Zealand name for the late Cenozoic to present mountain-building along the Pacific–Australian plate boundary. The older events that made New Zealand's basement rock are the Rangitata (Mesozoic) and Tuhua (Palaeozoic) orogenies [memory].
2. **Age: use 8 Ma to today (still going on).** Fission-track dating: "the earliest indications ... being at 8 Ma at the southern end of the Alps, decreasing to 5 Ma at the northern end and 3 Ma along the southeastern margin" (Tippett & Kamp 1993) [abstract]; "uplift was underway at 7 Ma in the south at Haast Pass and by 5 Ma in the north at Arthur's Pass" (Kamp et al. 1989) [abstract].
   - The plate boundary is older: most or all Alpine Fault offset is younger than 45 Ma, and plate motion "increased rapidly in Miocene time" (Sutherland 1999) [abstract]. Textbooks start the Kaikōura orogeny at about 25 Ma [memory]. Use 8 for "the Southern Alps rose"; 25 for "the plate boundary formed".
3. **Cause.** The Pacific and Australian plates slide past each other along the Alpine Fault and also converge obliquely; the edge of the Pacific plate is being pushed up and over [abstract].
4. **Extent.** Boxes: Southern Alps `[-45.2, 167.5, -42.0, 172.5]` (the east takes in the Canterbury Plains edge); Fiordland `[-46.3, 166.4, -44.5, 168.2]`; Marlborough and Kaikōura ranges `[-42.8, 172.3, -41.2, 174.5]`; North Island axial ranges `[-41.5, 175.0, -37.8, 178.3]`.
   - Provinces: 411 Haast Schist; 412 Torlesse Terrane; 860 Buller Terrane; 410 Takaka terrane; 419 Murihiku Terrane; 380 Hikurangi Province; 443 South Hikurangi Province.
   - Poor fits: these are basement terranes classed "Terra Australis"; nothing in the table marks the young event. Several New Zealand rows have a west edge of −180, i.e. their bounding boxes wrap round the date line and are unusable as boxes.
5. **Surface today.** High, fast-rising mountains. Rock uplift next to the Alpine Fault totals as much as 19 km (Tippett & Kamp 1993) or 14.5–21.5 km (Kamp et al. 1989), at up to about 6 mm a year recently [abstract]; this has brought schist to the surface. **The schist and greywacke were formed and metamorphosed in the Mesozoic (Rangitata) event; the Kaikōura event lifted them** [memory].
6. **Claims.** Rock uplift is not the same as summit height (erosion removes most of it); do not turn 19 km into a height. An isotope study of the growth of the range's relief exists (Chamberlain et al. 1999) [title].
7. **For visitors.** "For about the last 8 million years two plates have been grinding together here, pushing up the Southern Alps along the Alpine Fault. The mountains are still rising, by several millimetres a year in places, and erosion wears them down almost as fast."
8. **Sources.**
   - Tippett, J.M. & Kamp, P.J.J. 1993. Fission track analysis of the Late Cenozoic vertical kinematics of continental Pacific crust, South Island, New Zealand. *Journal of Geophysical Research: Solid Earth* 98(B9): 16119–16148. doi:10.1029/92jb02115
   - Kamp, P.J.J., Green, P.F. & White, S.H. 1989. Fission track analysis reveals character of collisional tectonics in New Zealand. *Tectonics* 8(2): 169–195. doi:10.1029/tc008i002p00169
   - Sutherland, R. 1999. Cenozoic bending of New Zealand basement terranes and Alpine Fault displacement: a brief review. *New Zealand Journal of Geology and Geophysics* 42(2): 295–301. doi:10.1080/00288306.1999.9514846
   - Also checked: Chamberlain, C.P., Poage, M.A., Craw, D. & Reynolds, R.C. 1999, *Chemical Geology* 155(3–4): 279–294, doi:10.1016/s0009-2541(98)00165-x. Batt, G.E., Braun, J., Kohn, B.P. & McDougall, I. 2000, *GSA Bulletin* 112(2): 250–266, doi:10.1130/0016-7606(2000)112<250:taotdo>2.0.co;2. Mortimer, N. 2004. New Zealand's geological foundations. *Gondwana Research* 7(1): 261–272, doi:10.1016/s1342-937x(05)70324-5.
9. **Caveat for visitors.** "The rock itself is much older than the mountains: it formed during an earlier mountain-building episode more than 100 million years ago."

## 24. Taiwan orogeny (Penglai)

1. **Names.** Taiwan orogeny; Penglai orogeny in Taiwanese usage [memory].
2. **Age: use 6.5 Ma to today (still going on).** The collision of the Luzon volcanic arc with the Chinese continental margin is widely cited as "initiated ~6.5 Ma ago" [secondary: several citing papers]. Disagreement [secondary]: other models give 4 Ma or 2–3 Ma; some propose two stages (about 6.5 and 3.5 Ma, or slow uplift from 6–7 Ma and rapid uplift after 2–3 Ma); and whether the collision spread southward along the island or began everywhere at once (exhumation from 5–7 Ma along the whole island) is disputed.
3. **Cause.** A chain of volcanic islands on the Philippine Sea plate (the Luzon arc) is colliding with the edge of the Asian continent [title: Teng 1990; Huang et al. 2006].
4. **Extent.** Box: `[21.8, 120.3, 25.4, 122.1]` (the western third is coastal plain and foothills, not mountain). Belts, west to east: Coastal Plain, Western Foothills, Hsuehshan Range, Central Range (Backbone slate belt and Tananao metamorphic complex), Longitudinal Valley, Coastal Range [memory].
   - Provinces: **none named for Taiwan.** The island falls inside the bounding box of 320 Luzon Volcanic Arc (which reaches 25.4° N) and near 141 Ryukyu-Kyushu Volcanic Arc and 155 Ryukyu-Kyushu Forearc, all classed "Cordilleran". Use the box.
5. **Surface today.** High mountains (nearly 4,000 m [memory]), among the fastest rising and eroding on Earth. Slate and schist are widely exposed in the Central Range; the Tananao schist and marble are older rock metamorphosed again in this event [memory].
6. **Claims.** Present height only. No palaeo-height source read.
7. **For visitors.** "About 6.5 million years ago a chain of volcanic islands began to collide with the edge of Asia, pushing up the mountains of Taiwan. The collision continues, and the island is still rising."
8. **Sources.**
   - Huang, C.-Y., Yuan, P.B. & Tsao, S.-J. 2006. Temporal and spatial records of active arc-continent collision in Taiwan: a synthesis. *Geological Society of America Bulletin* 118(3–4): 274–288. doi:10.1130/b25527.1 (abstract not read)
   - Teng, L.S. 1990. Geotectonic evolution of late Cenozoic arc-continent collision in Taiwan. *Tectonophysics* 183(1–4): 57–76. doi:10.1016/0040-1951(90)90188-e (abstract not read)
9. **Caveat for visitors.** "Estimates of when the collision began range from about 6.5 to 3 million years ago."

## 25. New Guinea orogeny (Central Range and Papuan highlands)

1. **Names.** No single agreed name: "Central Range orogeny" (van Ufford & Cloos), "New Guinea orogen", Papuan fold belt. An earlier, separate "Peninsular orogeny" affected the eastern tail of the island [abstract].
2. **Age: use 12 Ma to today.** Hill & Raza 1999: a change in plate motion at about 12–10 Ma "caus[ed] PNG–Caroline plate convergence, creating the orogenic belt in New Guinea from 12 to 4 Ma" [abstract]. Collision and uplift continue on the north coast (Finisterre Range) [memory], hence "to today".
   - Earlier: Peninsular orogeny about 35–30 Ma in easternmost New Guinea, which raised the Papuan ophiolite (van Ufford & Cloos 2005) [abstract]. "The age, number, and plate kinematics of the events that formed the island are vigorously argued" [abstract].
3. **Cause.** The northern edge of the Australian continent, moving north, collided with island arcs of the Pacific side [abstract].
4. **Extent.** Boxes: Papua New Guinea highlands and Mobile Belt `[-8.0, 140.8, -3.5, 147.5]` (the south takes in the Fly lowlands); Central Range of Indonesian Papua `[-5.2, 135.0, -3.0, 141.0]`; Finisterre and Huon `[-6.8, 145.5, -5.0, 148.0]`; Papuan Peninsula (Owen Stanley; the earlier event) `[-10.8, 146.5, -7.5, 151.0]`.
   - Provinces: 156 Papuan Fold and Trust Belt; 250 Mamberamo Thrust Belt; 234 Papuan Arc; 415 Papuan Accretionary Complex; 235 Bismarck Volcanic Arc.
   - Poor fits: classed "Cordilleran" (156, 250, 234) and "Terra Australis" (415, 235); neither names this young event.
5. **Surface today.** High mountains (to about 4,900 m [memory]). The Mobile Belt exposes metamorphic rock and Miocene intrusions; the fold belt to the south is sedimentary. Eastern Papua has some of the youngest deeply buried rock known at the surface [abstract: Baldwin et al. 2012 mention exhumation of "(ultra)high-pressure metamorphic rocks"].
6. **Claims.** Hill & Raza 1999 infer "~4.5 km of uplift and ~3 km of denudation" of the Mobile Belt in the late Miocene from fission tracks [abstract]: a founded, model-based estimate of rock uplift, usable with "about" and the source.
7. **For visitors.** "About 12 million years ago the northern edge of the Australian continent began colliding with volcanic island chains to its north, raising the central mountains of New Guinea. Mountain-building continues along the north coast today."
8. **Sources.**
   - Hill, K.C. & Raza, A. 1999. Arc-continent collision in Papua Guinea: constraints from fission track thermochronology. *Tectonics* 18(6): 950–966. doi:10.1029/1999tc900043
   - van Ufford, A.Q. & Cloos, M. 2005. Cenozoic tectonics of New Guinea. *AAPG Bulletin* 89(1): 119–140. doi:10.1306/08300403073
   - Baldwin, S.L., Fitzgerald, P.G. & Webb, L.E. 2012. Tectonics of the New Guinea region. *Annual Review of Earth and Planetary Sciences* 40(1): 495–520. doi:10.1146/annurev-earth-040809-152540
9. **Caveat for visitors.** "Geologists disagree about how many separate collisions built this island and when each took place."

## 26. Cordilleran arc and accreted terranes of western North America (optional entry)

1. **Why it is here.** The brief asked whether the Cordilleran history needs an entry beyond Sevier and Laramide. For the stated purpose it does: the Sierra Nevada, Peninsular Ranges, Idaho and Coast Mountains batholiths are the main plutonic rock of the western USA and Canada, and none is a product of the Sevier or Laramide events as defined above. But it is a long-lived volcanic arc, not an "orogeny" with a start and end. **I researched it least; treat as a stub.**
2. **Age: use 170 to 50 Ma. Both figures [memory].** Dickinson 2004: subduction since the Triassic; island arcs accreted "during mid-Mesozoic time"; "a Cretaceous batholith belt along the Cordilleran trend" [abstract]. Sierra Nevada granite is mostly about 120–85 Ma and the Coast Mountains batholith about 170–50 Ma [memory; Ducea 2001 and Gehrels et al. 2009 are the papers to read, citations checked].
3. **Cause.** Ocean floor sinking beneath the continent's edge fed a chain of volcanoes; the granite is their frozen plumbing. Island arcs and other pieces were added to the edge along the way [abstract: Dickinson].
4. **Extent.** Boxes: Peninsular Ranges `[30.0, -117.5, 34.0, -115.5]`; Sierra Nevada `[35.0, -121.0, 40.3, -117.8]`; Klamath `[40.0, -124.0, 42.8, -122.0]`; Idaho batholith `[43.3, -117.0, 47.0, -113.5]`; North Cascades and Coast Mountains `[47.5, -129.0, 55.0, -120.5]` and `[54.5, -135.5, 60.5, -128.0]`.
   - Provinces: 666 Sierra Nevada Batholith; 667 Peninsular Ranges Batholith; 659 Idaho Batholith; 695 Coast plutonic complex; 607 Klamouth Range; accreted terranes 697 Alexander Terrane, 701 Wrangellia, 704 Stikinia, 699 Quesnellia Terrane, 698 Cache Creek, 702 Yukon-Tanana. All classed "Cordilleran", which here lumps this entry with entries 6 and 7.
5. **Surface today.** High mountains made largely of granite. The present Sierra Nevada relief is a later tilted block, not the volcanic range that stood above the granite [memory].
6. **Claims.** None on the height of the ancient volcanic range.
7. **For visitors.** "Between about 170 and 50 million years ago a long chain of volcanoes stood here above a sinking ocean plate. The volcanoes have eroded away, and the granite that cooled in their roots now forms the mountains."
8. **Sources.**
   - Dickinson, W.R. 2004. Evolution of the North American Cordillera. *Annual Review of Earth and Planetary Sciences* 32(1): 13–45. doi:10.1146/annurev.earth.32.101802.120257
   - Ducea, M. 2001. The California arc: thick granitic batholiths, eclogitic residues, lithospheric-scale thrusting, and magmatic flare-ups. *GSA Today* 11(11): 4. doi:10.1130/1052-5173(2001)011<0004:tcatgb>2.0.co;2 (abstract not read)
   - Gehrels, G., Rusmore, M., Woodsworth, G., et al. [17 authors] 2009. U-Th-Pb geochronology of the Coast Mountains batholith in north-coastal British Columbia: constraints on age and tectonic evolution. *Geological Society of America Bulletin* 121(9–10): 1341–1361. doi:10.1130/b26404.1 (abstract not read)
9. **Caveat for visitors.** "The granite formed in many separate pulses over this long span."

---

## Notes for the editor

**On the number of entries.** The dossier has 26 numbered entries, which become about 30 list rows if the phases are split as recommended (Caledonian into Grampian and Scandian; Tasmanides into three; Sveconorwegian apart from Grenville). The candidate list could not be cut to 18–22 without leaving North America's western granite (entry 26) or one of the three Appalachian events uncovered, so the total is nearer 25, as the brief allowed.

**Entries that will seldom help at a metamorphic or plutonic spot** (the rock at the surface is folded sedimentary rock, or is much older than the event): Sevier (6), Zagros (4), Cape (16), Pyrenean (3), Laramide (7), Kaikōura (23). For the last four the deep rock in the range was made in an earlier orogeny and only lifted in this one. If the app uses an event to say "this rock was squeezed and heated then", it will be wrong at such places; "this ground was pushed up then" is the supportable claim.

**Gaps, not researched.** (a) Africa is thin: the Damara–Lufilian–Zambezi belt (Namibia to Zambia), the Trans-Saharan and Dahomeyide belts of West Africa, and the Atlas are not covered. (b) Peninsular India: Eastern Ghats and Aravalli–Delhi belts. (c) Central Australia: Alice Springs and Petermann orogenies. (d) Carpathians, Apennines, Dinarides, Betics, Caucasus, Anatolia. (e) Japan and Korea. (f) New Zealand's Rangitata orogeny, which made the schist that the Kaikōura event lifted. (g) The Ouachita belt and the Innuitian (Ellesmerian) belt of North America. (h) Precambrian belts of similar standing to those included: Limpopo, Eburnean–Trans-Amazonian, Capricorn, Wopmay, Yavapai–Mazatzal, Namaqua–Natal, Kibaran, Sveconorwegian (only touched on in entry 19).

**On the province table.** Three recurring problems: (1) the `last_orogeny` classes are regional families, not events ("Terra Australis" covers the Andes, eastern Australia, New Zealand and the Cape; "Cordilleran" covers Japan, Kamchatka, the Philippines, New Guinea and western North America; "Alpine-Himalayan" runs from Spain to Indonesia), so a class can select candidate provinces but can never supply a date; (2) young events that reworked old belts (Andean, Kaikōura, New Guinea, Laramide in Wyoming) have no class of their own; (3) foreland basins and platforms sometimes carry an orogenic class (Arabian Platform, Himalayan Foreland Basin, Sydney-Surat Basin). Matching should be on province id, with the boxes as a second test.

**Rift ties (one line each, for the dossier on rifts and oceans).** Alleghanian and Variscan belts were split by the opening of the central and North Atlantic. The Caledonian belt was split by the opening of the North-East Atlantic (Norway from Greenland). The East African Orogen is cut along its length by the Red Sea and the East African Rift. The Brasiliano and Pan-African belts were parted by the South Atlantic. The Cape belt was parted from the Sierra de la Ventana and the Falklands by the same opening. Caledonian mountains collapsed by stretching in the Devonian, 403–380 Ma (Fossen 2010, *Geological Society, London, Special Publications* 335(1): 767–793, doi:10.1144/sp335.31) [abstract].

**Other citations checked in Crossref and not used above.** Hasterok, D., Halpin, J.A., Collins, A.S., Hand, M., Kreemer, C., Gard, M.G. & Glorie, S. 2022. New maps of global geological provinces and tectonic plates. *Earth-Science Reviews* 231: 104069. doi:10.1016/j.earscirev.2022.104069. Cawood, P.A., Kröner, A., Collins, W.J., Kusky, T.M., Mooney, W.D. & Windley, B.F. 2009. Accretionary orogens through Earth history. *Geological Society, London, Special Publications* 318(1): 1–36. doi:10.1144/sp318.1. Cawood, P.A. 2005. Terra Australis Orogen. *Earth-Science Reviews* 69(3–4): 249–279. doi:10.1016/j.earscirev.2004.09.001. Rowley, D.B. & Garzione, C.N. 2007. Stable isotope-based paleoaltimetry. *Annual Review of Earth and Planetary Sciences* 35(1): 463–508. doi:10.1146/annurev.earth.35.031306.140155. Hynes, A. & Rivers, T. 2010. Protracted continental collision — evidence from the Grenville Orogen. *Canadian Journal of Earth Sciences* 47(5): 591–620. doi:10.1139/e10-003 (its abstract supports entry 19: collision with "another continent, probably Amazonia, at ca. 1100 Ma"; peak metamorphism "ca. 1090–1020 Ma" at depths of about 30 km, locally 50–60 km; youngest structures "ca. 1000–980 Ma"; the orogeny "lasted more than 100 million years" [abstract]). Lahtinen, R., Korja, A., Nironen, M. & Heikkinen, P. 2009. Palaeoproterozoic accretionary processes in Fennoscandia. *Geological Society, London, Special Publications* 318(1): 237–256. doi:10.1144/sp318.8 (its abstract supports entry 21: about 1 million km², assembled "between 1.92 and 1.79 Ga" [abstract]). Bingen, B., Viola, G., Möller, C., Vander Auwera, J., Laurent, A. & Yi, K. 2021. The Sveconorwegian orogeny. *Gondwana Research* 90: 273–313. doi:10.1016/j.gr.2020.10.014. Wilhem, C., Windley, B.F. & Stampfli, G.M. 2012. The Altaids of Central Asia: a tectonic and evolutionary innovative review. *Earth-Science Reviews* 113(3–4): 303–341. doi:10.1016/j.earscirev.2012.04.001. Meert, J.G. 2003. A synopsis of events related to the assembly of eastern Gondwana. *Tectonophysics* 362(1–4): 1–40. doi:10.1016/s0040-1951(02)00629-7. Johnson, P.R., Andresen, A., Collins, A.S., et al. [8 authors] 2011. Late Cryogenian–Ediacaran history of the Arabian–Nubian Shield. *Journal of African Earth Sciences* 61(3): 167–232. doi:10.1016/j.jafrearsci.2011.07.003. Ratschbacher, L., Hacker, B.R., Calvert, A., et al. [9 authors] 2003. Tectonics of the Qinling (Central China). *Tectonophysics* 366(1–2): 1–53. doi:10.1016/s0040-1951(03)00053-2. Hodges, K.V. 2000. Tectonics of the Himalaya and southern Tibet from two perspectives. *GSA Bulletin* 112(3): 324–350. doi:10.1130/0016-7606(2000)112<324:tothas>2.0.co;2. Nance, R.D., Gutiérrez-Alonso, G., Keppie, J.D., et al. [8 authors] 2010. Evolution of the Rheic Ocean. *Gondwana Research* 17(2–3): 194–222. doi:10.1016/j.gr.2009.08.001. Hoffman, P.F. 1988. United Plates of America, the birth of a craton. *Annual Review of Earth and Planetary Sciences* 16(1): 543–603. doi:10.1146/annurev.ea.16.050188.002551. Cloos, M., Sapiie, B., Quarles van Ufford, A., Weiland, R.J., Warren, P.Q. & McMahon, T.P. 2005. *Collisional Delamination in New Guinea* (GSA Special Paper 400). doi:10.1130/2005.2400.

**Not found in Crossref (UNVERIFIED).** Lee, Y.-H. et al. on fission-track exhumation of Taiwan (a 2006 *EPSL* paper is cited at second hand in entry 24's disagreement line); the Newton, Shone & Booth chapter on the Cape Fold Belt in *The Geology of South Africa* (2006); the co-authors of Pedrosa-Soares 2001 and the authors of the 1993 Wind River paper (Crossref records are incomplete).
