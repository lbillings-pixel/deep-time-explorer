// ============================================================================
// WHITELIST OF SCENE PARTS
// ============================================================================
// The whitelist decides which plants and animals a scene may show, where and when.
// A part is never drawn outside the scenes and chapters listed for it.
// The entries are in one file per group, beside this one; this file gathers them.

import type { PartCaveat, Permit } from '../permit';
import * as floraPaleozoic from './flora-paleozoic';
import * as floraMesozoic from './flora-mesozoic';
import * as floraCenozoic from './flora-cenozoic';
import * as landPaleozoic from './land-paleozoic';
import * as landTriassicJurassic from './land-triassic-jurassic';
import * as landCretaceous from './land-cretaceous';
import * as landPaleogene from './land-paleogene';
import * as landNeogene from './land-neogene';
import * as landQuaternary from './land-quaternary';
import * as landSouthern from './land-southern';
import * as landSmall from './land-small';
import * as marineEarlyPaleozoic from './marine-early-paleozoic';
import * as marineLatePaleozoic from './marine-late-paleozoic';
import * as fishPaleozoic from './fish-paleozoic';
import * as marineMesozoic from './marine-mesozoic';
import * as marineCenozoic from './marine-cenozoic';
import * as marineCommon from './marine-common';
import * as freshwater from './freshwater';
import * as primates from './primates';
import * as domesticates from './domesticates';

export interface WhitelistGroup {
  id: string;
  title: string;
  permits: Permit[];
  caveats: PartCaveat[];
}

export const GROUPS: WhitelistGroup[] = [
  { id: 'flora-paleozoic', title: 'Plants of the Paleozoic, and the ferns and horsetails that outlasted it', permits: floraPaleozoic.PERMITS, caveats: floraPaleozoic.CAVEATS },
  { id: 'flora-mesozoic', title: 'Plants of the Mesozoic', permits: floraMesozoic.PERMITS, caveats: floraMesozoic.CAVEATS },
  { id: 'flora-cenozoic', title: 'Plants of the Cenozoic', permits: floraCenozoic.PERMITS, caveats: floraCenozoic.CAVEATS },
  { id: 'land-paleozoic', title: 'Land animals of the Paleozoic', permits: landPaleozoic.PERMITS, caveats: landPaleozoic.CAVEATS },
  { id: 'land-triassic-jurassic', title: 'Land animals of the Triassic and Jurassic', permits: landTriassicJurassic.PERMITS, caveats: landTriassicJurassic.CAVEATS },
  { id: 'land-cretaceous', title: 'Land animals of the Cretaceous', permits: landCretaceous.PERMITS, caveats: landCretaceous.CAVEATS },
  { id: 'land-paleogene', title: 'Land animals of the Paleogene', permits: landPaleogene.PERMITS, caveats: landPaleogene.CAVEATS },
  { id: 'land-neogene', title: 'Land animals of the Neogene', permits: landNeogene.PERMITS, caveats: landNeogene.CAVEATS },
  { id: 'land-quaternary', title: 'Land animals of the Quaternary', permits: landQuaternary.PERMITS, caveats: landQuaternary.CAVEATS },
  { id: 'land-southern', title: 'Land animals of the southern continents in the Cenozoic', permits: landSouthern.PERMITS, caveats: landSouthern.CAVEATS },
  { id: 'land-small', title: 'Small land animals that span many chapters', permits: landSmall.PERMITS, caveats: landSmall.CAVEATS },
  { id: 'marine-early-paleozoic', title: 'Sea life of the Precambrian to the Silurian', permits: marineEarlyPaleozoic.PERMITS, caveats: marineEarlyPaleozoic.CAVEATS },
  { id: 'marine-late-paleozoic', title: 'Sea-floor life of the Devonian to the Permian', permits: marineLatePaleozoic.PERMITS, caveats: marineLatePaleozoic.CAVEATS },
  { id: 'fish-paleozoic', title: 'Fishes of the Paleozoic', permits: fishPaleozoic.PERMITS, caveats: fishPaleozoic.CAVEATS },
  { id: 'marine-mesozoic', title: 'Sea life of the Mesozoic', permits: marineMesozoic.PERMITS, caveats: marineMesozoic.CAVEATS },
  { id: 'marine-cenozoic', title: 'Sea life of the Cenozoic', permits: marineCenozoic.PERMITS, caveats: marineCenozoic.CAVEATS },
  { id: 'marine-common', title: 'Sea animals that span many chapters', permits: marineCommon.PERMITS, caveats: marineCommon.CAVEATS },
  { id: 'freshwater', title: 'Life in rivers and lakes', permits: freshwater.PERMITS, caveats: freshwater.CAVEATS },
  { id: 'primates', title: 'Monkeys, apes and the human family', permits: primates.PERMITS, caveats: primates.CAVEATS },
  { id: 'domesticates', title: 'Crops and domestic animals, drawn only in the painted pictures', permits: domesticates.PERMITS, caveats: domesticates.CAVEATS },
];

/** Caveats that apply to every picture. */
export const GENERAL_CAVEATS = {
  colors: 'Colors are not preserved in most fossils. The colors of the animals are chosen to look plausible, and so are plant colors beyond green foliage and brown bark.',
  motion: 'Any movement in the picture is decoration. It does not show how these plants and animals actually moved.',
  frost: "Cold dune fields are drawn with a pale dusting of frost on the shaded faces. That is an artist's signal for cold, not a claim from the rocks.",
};

export const PERMITS: Permit[] = GROUPS.flatMap((g) => g.permits);
export const CAVEATS: PartCaveat[] = GROUPS.flatMap((g) => g.caveats);
