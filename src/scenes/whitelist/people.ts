// Whitelist: people, drawn only in the painted pictures, never in a chapter scene.
// Each entry says when one part may be drawn, and why. The drawings are in ../parts/people.ts.
// Every part here is `paintingsOnly`, so `scenes` is empty. The sources named for the fourteen groups are
// those of the three dossiers docs/research/great-events-civilization*.md.

import type { PartCaveat, Permit } from '../permit';

/** The groups of people drawn for the two painted pictures of human history, one for each scene. */
const PLAIN_WRAP = ['people-karampuang', 'people-sahul', 'people-kuk', 'people-nukuleka', 'people-povertypoint'];
const PEOPLE = [
  ...PLAIN_WRAP,
  'people-lascaux', 'people-catalhoyuk', 'people-giza', 'people-caral', 'people-mohenjodaro', 'people-ur', 'people-anyang', 'people-laventa', 'people-athens',
];

/** A permit for one of those groups: painted pictures only, never a chapter scene. */
const people = (id: string, name: string, basis: string): Permit => ({ id, name, group: 'human', scenes: [], paintingsOnly: true, chapters: ['Quaternary'], matches: [], basis });

/** What a visitor should know before trusting these drawings: guesses, simplifications and points specialists dispute. */
export const PAINTING_CAVEATS: PartCaveat[] = [
  // ---- the hunters of the mammoth steppe ----
  { parts: ['hunter'], text: 'All three figures have dark skin. Homo sapiens evolved in tropical Africa, and ancient DNA shows that dark skin remained usual even in Europe until well within the last 10,000 years.' },
  { parts: ['hunter'], text: 'The hunters of the mammoth steppe are drawn only in the painting of the Late Pleistocene extinctions, never in a chapter scene. Their sewn, hooded fur clothing is an inference. Bone needles with eyes are known from Siberia and China by 45,000 to 40,000 years ago. In burials at Sungir in Russia, about 34,000 years old, rows of ivory beads lie as if sewn onto fitted shirts, trousers and caps, and ivory figurines from Mal\'ta in Siberia, about 24,000 years old, are usually read as people in hooded fur suits. The cut, the colors and the pale fur trim are guesses, and the accounts of Sungir and Mal\'ta were not checked against the published reports.' },
  { parts: ['hunter'], text: 'The hunters carry spears with stone tips, held in the hand, which is what sites of mammoth hunting show. Whether such spears were thrust or thrown cannot be told from the finds. No spear-thrower, bow or dog is drawn: the oldest surviving spear-throwers are about 19,000 years old and come from southwestern Europe, no bow survives from the ice-age steppe, and the oldest generally accepted skeleton of a dog is about 14,000 years old.' },

  // ---- the people of the two pictures of human history ----
  { parts: PEOPLE, text: 'These small groups of people are drawn only in the two painted pictures of human history, each for one place and one task, and never in a chapter scene.' },
  { parts: PEOPLE, text: 'Faces, skin, hair, dress and gestures are reconstructions throughout. No figure is taken from a photograph, a portrait, a published facial reconstruction or an ancient likeness. Skin is drawn brown to dark in every group, with no attempt to show a physical type; the sources speak of skin for two places only, dark or intermediate at Lascaux and brown at Nukuleka.' },
  { parts: PLAIN_WRAP, text: 'Nothing is known of what people wore at Leang Karampuang, in northern Australia 50,000 years ago, at Kuk Swamp or at Poverty Point, and at Nukuleka the sources go no further than "simple wraps". In all five groups every figure, adult and child, wears the same plain short wrap with the upper body bare. That wrap is a painter\'s convention, not a finding.' },
  { parts: PEOPLE, text: 'Men and women are drawn at work in every group, and no one is shown as an overseer, priest, chief or king. Which person did which task is not known for any of these places, and who is drawn doing what is the painter\'s choice.' },
  { parts: ['people-giza', 'people-ur', 'people-anyang', 'people-athens'], text: 'The long dresses and robes at Giza, Ur, Anyang and Athens are one simple garment in these drawings, a covered trunk and a skirt to the calf or ankle. It stands for garments that were draped, pinned or wrapped in ways the drawings do not show: the robe at Ur left one shoulder bare, and the lengths at Anyang and Athens are not given by the sources. Hats, headbands, hairpins, bangles and patterned cloth are left out because the figures are seen very small.' },
];

export const PAINTING_PERMITS: Permit[] = [
  {
    id: 'hunter',
    name: 'Homo sapiens, hunters of the mammoth steppe',
    group: 'human',
    scenes: [],
    paintingsOnly: true,
    chapters: ['Quaternary'],
    regions: ['europe', 'asia'],
    matches: [],
    basis: 'Homo sapiens hunted woolly mammoths on the cold steppe of northern Europe and Asia: at Kraków Spadzista in Poland, about 29,000 to 28,000 years old, a flint spear point is lodged in a mammoth rib.',
  },
  people('people-karampuang', 'People at Leang Karampuang', 'Our own species is the most likely maker of the red paintings on the ceiling of Leang Karampuang in Sulawesi, at least 51,200 years old; that is the research team\'s inference, since no bones of that age were found with the art. The red ochre, put on with a brush or the fingertips, is sourced; the plain short wrap is a painter\'s convention, because nothing is known of dress.'),
  people('people-sahul', 'People in northern Australia, 50,000 years ago', 'Grinding stones, ground red ochre and ground-edge hatchet heads were found in a rock shelter in northern Australia, at least 50,000 years old. Only the hatchet heads survive, so the handle and binding are an inference, and nothing is known of how the people looked or dressed: the plain short wrap is a painter\'s convention.'),
  people('people-lascaux', 'People at Lascaux', 'The painters of Lascaux, about 21,000 years ago, worked by the light of stone lamps that burned animal fat, with red and yellow iron oxides and black manganese oxide. That their clothing was sewn is sourced, from needles with eyes known in Europe at that period; its cut is conjecture. A woman is drawn painting because hand stencils in other caves suggest women were among the painters, a finding that is contested.'),
  people('people-catalhoyuk', 'People at Çatalhöyük', 'At Çatalhöyük, about 6700 to 6500 BC, people entered their houses through the roof by ladder and moved about across the roofs, and they had baskets. Cloth of tree-bast fiber and garments of animal skin are sourced; the cut of the wrap and tunic drawn here is conjecture.'),
  people('people-kuk', 'People at Kuk Swamp', 'By about 6,500 years ago people at Kuk Swamp in the highlands of New Guinea grew bananas and taro on low mounds of earth at the edge of the swamp. The wooden digging sticks are an inference, and nothing direct is known of the people: the plain short wrap is a painter\'s convention.'),
  people('people-nukuleka', 'People at Nukuleka', 'The people who settled Nukuleka in Tonga about 900 BC made red-slipped pots with stamped bands filled with white lime, and left heaps of shells up to 2 meters thick; men, women and children were among them. The sources describe their dress no more closely than "simple wraps", so the plain short wrap is a painter\'s convention, and the shell ornaments they wore are left out.'),
  people('people-giza', 'People at Giza', 'Gangs of workers hauled limestone blocks on wooden sledges to the pyramids of Giza about 2600 to 2500 BC. The short white linen kilt, bare chest and cropped hair of the men and the long close-fitting dress of the woman follow a standard account of Old Kingdom dress. The woman\'s jar and her place beside the haulers are the painter\'s choice.'),
  people('people-caral', 'People at Caral', 'The builders of Caral in Peru, about 2400 to 2200 BC, carried the fill of their platform mounds in open-mesh reed bags of stones, and dried anchovies and sardines reached the town from the coast. Very little is established about the people themselves: clothing of cotton is a fair inference, and the knee-length wrap and tunic are the painter\'s convention.'),
  people('people-mohenjodaro', 'People at Mohenjo-daro', 'Mohenjo-daro, about 2300 BC, was a city of wells, and its people drove carts with solid wheels. Everyday dress is unknown. The man\'s short beard and the cloak over his shoulder, drawn here as a tunic, are taken from the site\'s sculpture; the wraps are the painter\'s convention, and the stacked bangles that the sculpture shows on women are left out.'),
  people('people-ur', 'People at Ur', 'At Ur about 2100 to 2000 BC men were clean-shaven with shaved heads and wore a long robe with a fringed hem, women wore long draped robes with their hair bound up, and laborers wore short kilts, according to a standard account of Sumerian dress. The pole and the tasks of all three figures are the painter\'s choice.'),
  people('people-povertypoint', 'People at Poverty Point', 'Men and women raised the great mound at Poverty Point in Louisiana, about 1300 BC, by carrying earth in baskets and hides. No burials or textiles survive, so nothing is known of dress: the plain short wrap is a painter\'s convention.'),
  people('people-anyang', 'People at Anyang', 'Anyang, about 1200 BC, had workshop quarters where bronze was cast on an industrial scale. Robes with sashes and hair coiled in a knot follow standard accounts of Shang dress, with hemp for ordinary people; the length of the robe is not given by the sources and is drawn to the calf.'),
  people('people-laventa', 'People at La Venta', 'Loincloths, belts and capes are shown on small figurines and throne carvings of the Olmec, the people of La Venta in Mexico about 600 to 500 BC, who grew maize in small plots among water and forest. The dress of women and everyday dress are poorly known, so the woman\'s wrap, the pole and the digging stick are the painter\'s choice.'),
  people('people-athens', 'People in Athens', 'Athenians of about 430 BC wore a light tunic or a heavier pinned dress, often colored; men were usually bearded and women bound up their hair. The garments are sourced but their lengths are not, and the water jar carried on the head is the painter\'s choice of how it was carried.'),
];
