// The environment taxonomy, and the rules that turn the vocabulary of
// Macrostrat and the Paleobiology Database into one of its 13 types.

export type EnvType =
  | 'deep-sea'
  | 'shelf-sea'
  | 'carbonate-sea'
  | 'reef'
  | 'shoreline'
  | 'delta'
  | 'river-plain'
  | 'lake'
  | 'swamp'
  | 'desert'
  | 'ice'
  | 'volcanic-land'
  | 'mountains'
  | 'land';

export const ENV_LABEL: Record<EnvType, string> = {
  'deep-sea': 'Deep water (basin or slope)',
  'shelf-sea': 'Open shelf sea',
  'carbonate-sea': 'Warm shallow sea',
  reef: 'Reef',
  shoreline: 'Shoreline',
  delta: 'Delta or estuary',
  'river-plain': 'River plain',
  lake: 'Lake',
  swamp: 'Swamp',
  desert: 'Desert',
  ice: 'Ice',
  'volcanic-land': 'Volcanic land',
  mountains: 'Mountains',
  land: 'Land, setting unknown',
};

export interface EnvMatch {
  type: EnvType;
  /** False when the record says only "marine" or "terrestrial" with no further detail. */
  specific: boolean;
}

const SPECIFIC: Record<Exclude<EnvType, 'volcanic-land' | 'mountains' | 'land'>, string[]> = {
  'deep-sea': ['basinal', 'basinal (carbonate)', 'basinal (siliceous)', 'basinal (siliciclastic)', 'abyss', 'slope', 'submarine fan', 'deep-water indet.'],
  'shelf-sea': ['offshore', 'offshore shelf', 'offshore ramp', 'offshore indet.', 'deep subtidal ramp', 'deep subtidal shelf', 'deep subtidal indet.'],
  'carbonate-sea': ['peritidal', 'shallow subtidal', 'shallow subtidal indet.', 'open shallow subtidal', 'lagoonal/restricted shallow subtidal', 'sand shoal'],
  reef: [
    'reef',
    'buildup or bioherm',
    'reef, buildup or bioherm',
    'perireef',
    'perireef or subreef',
    'intrashelf/intraplatform reef',
    'platform/shelf-margin reef',
    'slope/ramp reef',
    'basin reef',
  ],
  shoreline: [
    'coastal indet.',
    'foreshore',
    'shoreface',
    'transition zone/lower shoreface',
    'barrier bar',
    'tidal flat',
    'lagoonal',
    'paralic indet.',
    'marginal marine',
    'marginal marine indet.',
  ],
  delta: ['deltaic indet.', 'delta plain', 'delta front', 'interdistributary bay', 'prodelta', 'estuary/bay', 'fluvial-deltaic indet.'],
  'river-plain': [
    'fluvial indet.',
    'fluvial braided',
    'fluvial meandering',
    'channel',
    'channel lag',
    'coarse channel fill',
    'fine channel fill',
    'floodplain',
    'wet floodplain',
    'dry floodplain',
    'levee',
    'crevasse splay',
    'alluvial fan',
    'fluvial-lacustrine indet.',
    'colluvial slope',
  ],
  lake: [
    'lacustrine indet.',
    'lacustrine - large',
    'lacustrine - small',
    'pond',
    'crater lake',
    'lacustrine deltaic indet.',
    'lacustrine delta plain',
    'lacustrine interdistributary bay',
    'lacustrine delta front',
    'lacustrine prodelta',
  ],
  swamp: ['mire/swamp'],
  desert: ['eolian indet.', 'dune', 'interdune', 'playa', 'loess'],
  ice: ['glacial', 'glacial indet.', 'end moraine', 'ground moraine', 'esker', 'drumlin', 'outwash plain'],
};

const GENERIC: Partial<Record<EnvType, string[]>> = {
  'shelf-sea': ['marine', 'marine indet.', 'inferred marine', 'carbonate indet.'],
  land: ['non-marine', 'terrestrial indet.', 'karst indet.', 'fissure fill', 'cave', 'sinkhole', 'spring', 'tar', 'weathering surface'],
};

const BY_NAME = new Map<string, EnvMatch>();
for (const [type, names] of Object.entries(SPECIFIC)) for (const n of names) BY_NAME.set(n, { type: type as EnvType, specific: true });
for (const [type, names] of Object.entries(GENERIC)) for (const n of names) BY_NAME.set(n, { type: type as EnvType, specific: false });

/** The environment type for a recorded depositional-environment name, or null if the name is unknown or empty. */
export function envFromName(name: string): EnvMatch | null {
  return BY_NAME.get(name.toLowerCase().replaceAll('"', '').trim()) ?? null;
}

export interface Lith {
  name: string;
  /** Macrostrat rock-type group, e.g. "carbonate", "volcanic", "plutonic". */
  type: string;
  /** "sedimentary", "igneous" or "metamorphic". */
  class: string;
}

/** What a unit's rock types say on their own, when nothing records its environment. */
export type LithReading =
  | { kind: 'environment'; type: EnvType; because: string; /** The unit's own name mentions this rock type. */ named: boolean }
  | { kind: 'volcanic'; because: string }
  | { kind: 'underground'; because: string };

const CARBONATE_NOT_DIAGNOSTIC = new Set(['mixed carbonate-siliciclastic', 'marl', 'siderite', 'ankerite']);
const COAL = new Set(['coal', 'lignite', 'peat', 'anthracite']);
const TILL = new Set(['till', 'tillite']);
const LOESS = new Set(['loess']);

/**
 * Rock type decides the environment only when it is diagnostic:
 *   coal, lignite, peat      -> swamp (present at all)
 *   till, tillite            -> ice (present at all)
 *   loess                    -> desert (present at all)
 *   limestone, dolomite, chalk and kin -> warm shallow sea (at least half the listed rock types)
 *   lava and ash             -> volcanic (at least half); the caller decides land or not
 *   granite, gneiss, schist and kin -> formed underground (at least half)
 * Sandstone, shale and clay form in seas, lakes and rivers alike, so they decide nothing.
 * A unit can give more than one reading (a till with peat in it records ice and bog).
 */
export function readLiths(liths: Lith[], unitName = ''): LithReading[] {
  const out: LithReading[] = [];
  const name = unitName.toLowerCase();
  const nameWords = name.split(/[^a-z]+/);
  // Present in the rock-type list, or named outright ("Clayey Till").
  const ifPresent = (set: Set<string>, type: EnvType) => {
    const inName = nameWords.find((w) => set.has(w));
    const hit = inName ?? liths.find((l) => set.has(l.name))?.name;
    if (hit) out.push({ kind: 'environment', type, because: hit, named: inName !== undefined });
  };
  ifPresent(COAL, 'swamp');
  ifPresent(TILL, 'ice');
  ifPresent(LOESS, 'desert');

  const mostly = (test: (l: Lith) => boolean) => {
    const hits = liths.filter(test);
    return hits.length > 0 && hits.length * 2 >= liths.length ? hits : null;
  };
  const names = (hits: Lith[]) => hits.map((l) => l.name).join(', ');
  const carbonate = mostly((l) => l.type === 'carbonate' && !CARBONATE_NOT_DIAGNOSTIC.has(l.name));
  const volcanic = mostly((l) => l.type === 'volcanic');
  const deep = mostly((l) => l.type === 'plutonic' || l.class === 'metamorphic');
  if (carbonate) out.push({ kind: 'environment', type: 'carbonate-sea', because: names(carbonate), named: carbonate.some((l) => name.includes(l.name)) });
  else if (volcanic) out.push({ kind: 'volcanic', because: names(volcanic) });
  else if (deep) out.push({ kind: 'underground', because: names(deep) });
  return out;
}
