// Whitelist: monkeys, apes and the human family.
// Each entry says where and when one part may be drawn, and why. The drawings
// are in ../parts/primates.ts. Edit the lists freely; the code obeys them.

import { NOT_COLD, type Climate, type PartCaveat, type Permit, type Region, span } from '../permit';

/** Wet or unknown climate: for the apes and monkeys of closed forest. */
const FOREST: Climate[] = ['wet', 'neutral'];

/** Every landmass people reached before written history: all but Antarctica. */
const PEOPLED: Region[] = ['africa', 'europe', 'asia', 'india', 'australia', 'north-america', 'south-america', 'new-zealand'];

const HUMANS = ['habilis', 'erectus', 'neanderthal', 'denisovan', 'floresiensis', 'sapiens'];
const UPRIGHT = ['australopith', ...HUMANS];

/** What a visitor should know before trusting these drawings: guesses, simplifications and points specialists dispute. */
export const CAVEATS: PartCaveat[] = [
  // ---- the upright figures as a whole ----
  { parts: UPRIGHT, text: 'Skin, hair and clothing do not fossilize. Every skin tone, every head of hair, the amount of body hair and every garment in these drawings is an inference: from climate, from living relatives, from tools and, for the most recent humans, from ancient DNA.' },
  { parts: UPRIGHT, text: 'Each drawing shows a small group, and the figures in a group differ a little in height, build and hair. The differences are there because no population looks alike; they are not measurements of particular fossils. Who walked with whom, and whether such groups were families, is not known.' },
  { parts: UPRIGHT, text: 'All of these species are drawn fully upright, because their skeletons show that they stood and walked that way. The stooped, shuffling "cave man" of older pictures came largely from a 1911 study of one elderly Neanderthal with severe arthritis.' },
  { parts: HUMANS, text: 'A chapter covers a whole geological period, and the Quaternary runs from 2.58 million years ago to the present. No human species lived through all of it, and several lived only for a small part. A Quaternary scene can therefore show a species in a place it had not yet reached, or had already left, at the moment a particular rock formed.' },
  { parts: HUMANS, text: 'Fossil records usually name human bones only by the genus Homo, which covers every human species. A record of Homo near a place therefore brings the drawing of Homo sapiens, the one species that lived on every landmass where such bones are found, even when the bones themselves belong to an earlier human such as Homo erectus or a Neanderthal. The other human drawings can never be confirmed by a local fossil record for the same reason.' },
  { parts: ['australopith', 'habilis', 'erectus', 'floresiensis'], text: 'Australopithecus, Homo habilis, Homo erectus and Homo floresiensis are drawn unclothed. Nothing shows that any of them wore clothing, and the genetics of body lice, which live in clothing, suggest that it came into regular use only within about the last 200,000 years.' },
  { parts: [...UPRIGHT, 'gorilla', 'chimpanzee'], text: 'The upright figures, the gorillas and the chimpanzees are drawn to one scale, in which an adult Homo sapiens stands about 1.7 meters tall, so their sizes can be compared with one another. Against the other animals of a scene the comparison is only rough.' },

  // ---- Australopithecus ----
  { parts: ['australopith'], text: 'Australopithecus is drawn mainly from the skeleton called Lucy (Australopithecus afarensis, Ethiopia, 3.2 million years old) and from the footprint trails at Laetoli in Tanzania, left in damp volcanic ash about 3.66 million years ago by several individuals walking the same way. The trails are the reason for showing a group on the move; that it was two adults and a child is a guess.' },
  { parts: ['australopith'], text: 'Its coat is unknown. It is drawn with thin dark body hair and a bare face, like a chimpanzee, because the loss of body hair is usually linked to the later, long-legged humans. Some reconstructions show much less hair.' },
  { parts: ['australopith'], text: 'Males of Australopithecus afarensis were larger than females, and the drawing shows a larger and a smaller adult. How great the difference was is disputed.' },
  { parts: ['australopith'], text: 'The drawing also stands for Paranthropus, a relative with huge chewing teeth and a bony crest along the top of the skull, whose body was otherwise similar. Earlier possible members of the human line, such as Ardipithecus, had a grasping big toe and a different gait, and are not represented.' },
  { parts: ['australopith'], text: 'Australopithecus is known from about 4.2 to 2 million years ago, and Paranthropus until about 1 million years ago. That is only the last part of the Neogene and the first part of the Quaternary, so a scene from elsewhere in either chapter can show it at a time when it did not exist.' },
  { parts: ['australopith', 'habilis'], text: 'Fossils of these early species come from eastern Africa, South Africa, Malawi and Chad. Africa counts as a single landmass here, so the drawings can appear anywhere on it between about 30 degrees south and 18 degrees north (15 degrees for Homo habilis), including West Africa and the Congo Basin, where no such fossils have been found. Bones rarely survive in the acid soils of those regions, so their absence there is not proof.' },

  // ---- Homo habilis ----
  { parts: ['habilis'], text: 'Homo habilis lived from about 2.3 to about 1.5 million years ago. Its body is poorly known: two very incomplete skeletons suggest a small frame with long arms, and that is how it is drawn. The dark body hair is a guess, and some reconstructions show it nearly as bare as later humans.' },
  { parts: ['habilis'], text: 'The name means "handy man", but the oldest known stone tools (Lomekwi, Kenya, 3.3 million years old) are older than any Homo. Homo habilis made and used simple flaked cobbles, as drawn, but it was not the first toolmaker and was probably not the only one of its day.' },
  { parts: ['habilis'], text: 'Whether Homo habilis belongs in the genus Homo, or with Australopithecus, is disputed, and so is whether its fossils are one species or two (the second is called Homo rudolfensis).' },

  // ---- Homo erectus ----
  { parts: ['erectus'], text: 'Homo erectus appeared about 1.9 million years ago in Africa, had reached Georgia by 1.8 million years ago and China and Java by about 1.6 to 1.3 million, and survived on Java until roughly 110,000 years ago. The drawing also stands for other tall, long-legged early humans that have no drawing of their own: Homo antecessor and Homo heidelbergensis in Europe and Africa, and the early African form often called Homo ergaster.' },
  { parts: ['erectus'], text: 'The fire is the least certain thing in this drawing. The oldest widely accepted traces of controlled fire are about 1 million years old (Wonderwerk Cave, South Africa) and 790,000 years old (Gesher Benot Ya\'aqov, Israel), and regular use of fire may be later still. For the first half of its existence Homo erectus may have had no fire.' },
  { parts: ['erectus'], text: 'Hand axes like the one held here appear about 1.76 million years ago in Africa and spread to Europe and India. They are rare in China and Southeast Asia, where Homo erectus mostly made simpler flake tools.' },
  { parts: ['erectus'], text: 'The build is taken mainly from the "Turkana Boy" skeleton from Kenya, 1.5 to 1.6 million years old. Nearly hairless dark skin is inferred from the body\'s adaptation to heat and from a pigmentation gene whose present form dates to about 1.2 million years ago. It is not directly known.' },
  { parts: ['erectus'], text: 'In India the evidence is mostly stone tools, including hand axes about 1.5 million years old at Attirampakkam, and a single skull cap from the Narmada valley whose species is disputed. Europe here reaches east to the Caspian Sea, so the Georgian site of Dmanisi counts as Europe; in Europe proper the early humans are usually given other species names.' },
  { parts: ['erectus'], text: 'The limits of 35 degrees south and 53 degrees north, and of climates that are not cold, are rough. The northernmost traces of early humans of this kind are footprints and tools on the coast of eastern England, about 900,000 years old.' },

  // ---- Neanderthals ----
  { parts: ['neanderthal'], text: 'Neanderthals lived from roughly 400,000 to 40,000 years ago. They are shown only in Europe, which here reaches east to the Urals and the Caspian Sea and so takes in the Caucasus and northern Iraq. They also lived in the Levant and in central Asia as far east as the Altai Mountains of Siberia, but Asia counts as a single landmass, and listing it would also put Neanderthals in China and Japan, where they are not known.' },
  { parts: ['neanderthal'], text: 'Ancient DNA suggests that Neanderthal skin and hair varied, and that some individuals had red hair. The medium skin tones and the brown and reddish hair drawn here are a reasonable reading of that evidence, not a record of it.' },
  { parts: ['neanderthal'], text: 'Neanderthals could not have survived glacial Europe unclothed, and wear on their stone scrapers and bone tools shows that they worked hides. No sewing needles are known from them, so they are drawn in draped and tied hides. The actual form of their clothing is unknown.' },
  { parts: ['neanderthal'], text: 'The wooden spear follows finds from Germany: a complete spear from Lehringen, about 125,000 years old, and the older spears from Schoeningen, between 200,000 and 300,000 years old, made by early Neanderthals or their forerunners. Neanderthals also set stone points on spear shafts. The spear is shown resting on the ground, not in use.' },
  { parts: ['neanderthal'], text: 'Neanderthals lived through several ice ages but drew back from the coldest ground, so they are not placed in scenes at the edge of the ice. Their northern limit is drawn at 56 degrees.' },

  // ---- Denisovans ----
  { parts: ['denisovan'], text: 'Denisovans are known from very few bones: a finger bone, some teeth and scraps of skull from Denisova Cave in Siberia, a jaw and a rib from the Tibetan Plateau, a jaw dredged from the seabed off Taiwan, probably a tooth from Laos and, since studies of its proteins and DNA published in 2025, the massive Harbin skull from northeastern China. Almost nothing is known of the skeleton below the neck. The bodies in this drawing are a reasoned guess: heavily built people, like their close relatives the Neanderthals, with the long, low skull and very strong brow of the Harbin fossil.' },
  { parts: ['denisovan'], text: 'DNA from Denisova Cave suggests dark skin, brown hair and brown eyes for the one individual studied in detail. Clothing is inferred only from the cold of Siberia and the Tibetan Plateau, where a Denisovan jaw was found at 3,280 meters above sea level. The staff and the carried bundle are generic.' },
  { parts: ['denisovan'], text: 'Denisovans lived from at least 200,000 years ago until perhaps 50,000 to 30,000 years ago. Traces of their DNA in living people of New Guinea, Australia and the Philippines show that they also lived in tropical Southeast Asia. Because the figures are dressed for cold, the drawing is not shown south of 20 degrees north.' },
  { parts: ['denisovan'], text: 'Asia counts as a single landmass here, so the drawing can appear in western and central Asia and in Japan, where no Denisovan remains have been found.' },

  // ---- Homo floresiensis ----
  { parts: ['floresiensis'], text: 'Homo floresiensis is known only from the Indonesian island of Flores: from Liang Bua cave, where its bones are about 100,000 to 60,000 years old, and from 700,000-year-old teeth and a jaw of likely ancestors at Mata Menge. Adults stood about 1.06 meters tall, with a brain the size of a chimpanzee\'s, short legs and very long feet.' },
  { parts: ['floresiensis'], text: 'Because it lived on one island, Homo floresiensis is shown only for places within about 300 kilometers of Flores, and nowhere else.' },
  { parts: ['floresiensis'], text: 'Its origin is disputed: it may be a dwarfed descendant of Homo erectus, or of a smaller and earlier human. Its skin, hair and lack of clothing are guesses suited to a tropical island. Simple stone flakes are found with its bones; the wooden stick is an assumption, since wood does not survive there.' },

  // ---- Homo sapiens ----
  { parts: ['sapiens'], text: 'Homo sapiens arose in Africa about 300,000 years ago and reached the other landmasses late in the Quaternary: southern Asia and India by roughly 70,000 to 50,000 years ago (with earlier, short-lived ventures), Australia about 65,000 to 50,000 years ago, Europe about 54,000 to 45,000 years ago, the Americas roughly 23,000 to 15,000 years ago, and New Zealand only about 750 years ago. For most of the Quaternary there were no people of this species in any of those places.' },
  { parts: ['sapiens'], text: 'The drawing shows hunter-gatherers of the last ice age. It does not fit every people or place: the first New Zealanders, for example, were Polynesian seafarers with woven cloaks, gardens and dogs, and people in the tropics wore far less than is drawn here. One drawing has to serve every landmass and climate.' },
  { parts: ['sapiens'], text: 'All three figures have dark skin. Homo sapiens evolved in tropical Africa, and ancient DNA shows that dark skin remained usual even in Europe until well within the last 10,000 years.' },
  { parts: ['sapiens'], text: 'Clothing of hide is inferred from bone needles with eyes (known by about 45,000 years ago), from the cold places people settled and from the genetics of body lice. The stone-tipped spear and the bundle of firewood are generic; no particular culture is intended.' },

  // ---- apes ----
  { parts: ['gorilla', 'chimpanzee'], text: 'The living African apes have almost no fossil record. For chimpanzees there are three teeth from Kenya, about 545,000 years old; for gorillas nothing certain, apart from a few much older teeth from Ethiopia (Chororapithecus) that may belong to an early relative. Both are shown on the strength of where they live today and of DNA evidence that their lines have been separate for millions of years, so their presence in any Quaternary scene is an inference.' },
  { parts: ['gorilla', 'chimpanzee'], text: 'Africa counts as a single landmass here, so only latitude and climate keep these forest apes in place: within 8 degrees of the equator for the gorilla and from 9 degrees south to 14 degrees north for the chimpanzee. Those bands also cross East Africa and the Horn, where neither ape lives today. The forest belt also widened and shrank many times during the ice ages.' },
  { parts: ['gorilla'], text: 'The larger gorilla is a grown male, a silverback, walking on his knuckles, with a youngster behind him. Females are about half his weight and lack the silver saddle and the tall crest on the head.' },
  { parts: ['chimpanzee'], text: 'The chimpanzee drawing also stands for the bonobo, its close relative south of the Congo River, which is slimmer and darker in the face. The pale face of the smallest animal is a mark of youth in chimpanzees; the seated one is chewing a plant stem.' },
  { parts: ['orangutan'], text: 'Orangutans live today only on Borneo and Sumatra, but their teeth are common in Quaternary cave deposits from southern China through Vietnam, Laos and Thailand to Java, and that wider range is what is listed, from 9 degrees south to 30 degrees north. Asia counts as a single landmass, so the band also takes in a strip of southern Iran and Pakistan where orangutans never lived.' },
  { parts: ['orangutan'], text: 'The orangutan is drawn as a grown male with cheek pads, walking on the ground on its fists. Orangutans spend most of their lives in trees; the scenes have no way to place an animal in a tree, and big males do travel on the ground.' },
  { parts: ['mioceneape'], text: 'The early ape is modeled on Proconsul (also called Ekembo) from Kenya, about 18 million years old: a tailless animal built like a large monkey that walked on its palms along branches. It also stands for later apes of Europe and Asia, such as Dryopithecus and Sivapithecus, which were larger, hung beneath branches like living great apes and, in the case of Sivapithecus, had a face like an orangutan. For those it is only a rough likeness.' },
  { parts: ['mioceneape'], text: 'Apes lived only in Africa and Arabia until about 17 million years ago, and had died out in Europe by about 7 million years ago. The Neogene chapter runs from 23 to 2.6 million years ago, so a Neogene scene in Europe, Asia or India can show an ape at a time when none lived there. The northern limit of 50 degrees follows finds in Germany.' },
  { parts: ['mioceneape', 'orangutan', 'newworldmonkey'], text: 'These animals were tree dwellers and are drawn on the ground, because the scenes place animals only on the ground.' },

  // ---- monkeys ----
  { parts: ['oldworldmonkey'], text: 'The Old World monkey is modeled on a macaque, with something of a baboon in its muzzle. It stands for a wide range of ground-living monkeys, from baboons and the giant geladas of Africa to the macaques of Europe and Asia, and more loosely for early leaf-eating monkeys such as Mesopithecus, which were slimmer and longer in the tail.' },
  { parts: ['oldworldmonkey'], text: 'Old World monkeys lived in Africa throughout the Neogene but are known in Europe, Asia and India only from about 8 million years ago, so an early Neogene scene outside Africa can show one too soon. The northern limit is set at 42 degrees, about where macaques live in Japan today. In warm periods of the Quaternary macaques ranged much farther north in Europe, as far as England; there the drawing appears only where their fossils are recorded. It is kept out of cold-climate scenes, although Japanese macaques tolerate snow.' },
  { parts: ['newworldmonkey'], text: 'The South American monkey is modeled on a red howler. Monkeys reached South America from Africa about 40 to 35 million years ago, probably on rafts of floating vegetation, but those first arrivals were small and unlike howlers. The oldest known relative of the howlers, Stirtonia from Colombia, is about 13 million years old, so in a scene from the early Neogene the drawing runs ahead of the evidence.' },
  { parts: ['newworldmonkey'], text: 'In the Quaternary the drawing is also shown in Central America and southern Mexico, which count here as part of North America, south of 20 degrees north. The same band takes in Caribbean islands, which had monkeys of their own of a different kind, and the dry Pacific side of Mexico, which has none.' },
  { parts: ['orangutan', 'mioceneape', 'oldworldmonkey', 'newworldmonkey'], text: 'These smaller animals are drawn in the foreground of a scene, so they look larger beside the big animals behind them than they really were.' },
];

export const PERMITS: Permit[] = [
  {
    id: 'australopith',
    name: 'Australopithecus, an upright ape',
    group: 'hominin',
    scenes: ['land', 'river-plain', 'lake', 'volcanic-land'],
    chapters: span('Neogene', 'Quaternary'),
    regions: ['africa'],
    latitudes: [-30, 18],
    climates: NOT_COLD,
    matches: ['Australopithecus', 'Paranthropus', 'Kenyanthropus', 'Praeanthropus', 'Zinjanthropus', 'Plesianthropus'],
    basis: 'Small-brained apes that walked fully upright lived in eastern and southern Africa and Chad from about 4.2 to 1 million years ago, and left footprints in volcanic ash at Laetoli, Tanzania.',
  },
  {
    id: 'habilis',
    name: 'Homo habilis',
    group: 'human',
    scenes: ['land', 'river-plain', 'lake'],
    chapters: ['Quaternary'],
    regions: ['africa'],
    latitudes: [-30, 15],
    climates: NOT_COLD,
    matches: [],
    basis: 'A small early human that made simple flaked stone tools beside the lakes and rivers of eastern Africa from about 2.3 to 1.5 million years ago, best known from Olduvai Gorge and Koobi Fora.',
  },
  {
    id: 'erectus',
    name: 'Homo erectus',
    group: 'human',
    scenes: ['land', 'river-plain', 'lake', 'volcanic-land'],
    chapters: ['Quaternary'],
    regions: ['africa', 'asia', 'europe', 'india'],
    latitudes: [-35, 53],
    climates: NOT_COLD,
    matches: ['Pithecanthropus', 'Sinanthropus', 'Atlanthropus', 'Telanthropus'],
    basis: 'The first human with a tall, long-legged body like that of living people; it spread from Africa to Georgia, China and Java within a few hundred thousand years of its origin about 1.9 million years ago, and made hand axes.',
  },
  {
    id: 'neanderthal',
    name: 'Neanderthals',
    group: 'human',
    scenes: ['land', 'river-plain', 'lake', 'shoreline'],
    chapters: ['Quaternary'],
    regions: ['europe'],
    latitudes: [34, 56],
    matches: [],
    basis: 'Stocky, large-brained humans who lived across Europe and western Asia from roughly 400,000 to 40,000 years ago, known from hundreds of skeletons, wooden spears and hide-working tools.',
  },
  {
    id: 'denisovan',
    name: 'Denisovans',
    group: 'human',
    scenes: ['land', 'river-plain', 'lake'],
    chapters: ['Quaternary'],
    regions: ['asia'],
    latitudes: [20, 56],
    matches: [],
    basis: 'An eastern sister group of the Neanderthals, identified by DNA and proteins in a few bones from Siberia, Tibet, Taiwan and China, including the Harbin skull.',
  },
  {
    id: 'floresiensis',
    name: 'Homo floresiensis, the "hobbit"',
    group: 'human',
    scenes: ['land', 'river-plain', 'volcanic-land'],
    chapters: ['Quaternary'],
    regions: ['asia'],
    near: { lat: -8.6, lng: 121.1, km: 300 },
    matches: [],
    basis: 'A human about 1.06 meters tall known only from the island of Flores, Indonesia, where its bones at Liang Bua cave are about 100,000 to 60,000 years old.',
  },
  {
    id: 'sapiens',
    name: 'Homo sapiens, people of the ice age',
    group: 'human',
    scenes: ['land', 'river-plain', 'lake', 'shoreline', 'delta', 'desert', 'ice'],
    chapters: ['Quaternary'],
    regions: PEOPLED,
    matches: ['Homo'],
    basis: 'Homo sapiens arose in Africa about 300,000 years ago and by the end of the Quaternary had settled every landmass except Antarctica.',
  },
  {
    id: 'gorilla',
    name: 'Gorillas',
    group: 'ape',
    scenes: ['land', 'swamp'],
    chapters: ['Quaternary'],
    regions: ['africa'],
    latitudes: [-8, 8],
    climates: FOREST,
    matches: ['Gorilla'],
    basis: 'Gorillas live in the equatorial forests of central Africa; they have almost no fossil record, and DNA shows their line has been separate for about 8 to 10 million years.',
  },
  {
    id: 'chimpanzee',
    name: 'Chimpanzees',
    group: 'ape',
    scenes: ['land', 'swamp', 'river-plain'],
    chapters: ['Quaternary'],
    regions: ['africa'],
    latitudes: [-9, 14],
    climates: NOT_COLD,
    matches: ['Pan'],
    basis: 'Chimpanzees and bonobos live in the forests and wooded savannas of equatorial Africa; the only fossils are teeth from Kenya about 545,000 years old.',
  },
  {
    id: 'orangutan',
    name: 'Orangutan',
    group: 'ape',
    scenes: ['land', 'swamp', 'river-plain'],
    chapters: ['Quaternary'],
    regions: ['asia'],
    latitudes: [-9, 30],
    climates: FOREST,
    matches: ['Pongo'],
    basis: 'Orangutans, now confined to Borneo and Sumatra, left abundant teeth in Quaternary caves from southern China through Southeast Asia to Java.',
  },
  {
    id: 'mioceneape',
    name: 'Early ape (Proconsul and its relatives)',
    group: 'ape',
    scenes: ['land', 'swamp', 'river-plain', 'lake'],
    chapters: ['Neogene'],
    regions: ['africa', 'europe', 'asia', 'india'],
    latitudes: [-35, 50],
    climates: NOT_COLD,
    matches: ['Proconsul', 'Ekembo', 'Afropithecus', 'Kenyapithecus', 'Nacholapithecus', 'Dryopithecus', 'Hispanopithecus', 'Rudapithecus', 'Sivapithecus', 'Lufengpithecus'],
    basis: 'Tailless apes were diverse in the Miocene forests of Africa from about 23 million years ago, and of Europe, Asia and India from about 17 million years ago.',
  },
  {
    id: 'oldworldmonkey',
    name: 'Old World monkey (macaque or baboon)',
    group: 'monkey',
    scenes: ['land', 'river-plain', 'lake', 'swamp'],
    chapters: span('Neogene', 'Quaternary'),
    regions: ['africa', 'asia', 'europe', 'india'],
    latitudes: [-35, 42],
    climates: NOT_COLD,
    matches: ['Macaca', 'Papio', 'Theropithecus', 'Parapapio', 'Paradolichopithecus', 'Procynocephalus', 'Mesopithecus', 'Dolichopithecus', 'Victoriapithecus', 'Cercopithecus'],
    basis: 'Ground-living monkeys such as baboons and macaques are common fossils in Africa from the Miocene, and in Europe, Asia and India from the late Miocene onward.',
  },
  {
    id: 'newworldmonkey',
    name: 'South American monkey (howler)',
    group: 'monkey',
    scenes: ['land', 'swamp', 'river-plain'],
    chapters: span('Neogene', 'Quaternary'),
    regions: ['south-america'],
    regionsByChapter: { Quaternary: ['south-america', 'north-america'] },
    latitudes: [-31, 20],
    climates: FOREST,
    matches: ['Alouatta', 'Stirtonia', 'Protopithecus', 'Cartelles', 'Caipora', 'Ateles', 'Solimoea', 'Brachyteles', 'Lagothrix'],
    basis: 'Howler and spider monkeys, with grasping tails, have lived in the forests of South America since at least the middle Miocene, and in Central America in the Quaternary.',
  },
];
