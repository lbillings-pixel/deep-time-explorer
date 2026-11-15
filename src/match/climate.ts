// Climate, read only from the rocks. Coal means a wet climate, salt and gypsum
// a dry one, glacial till a cold one. Latitude and climate models are not used.
import type { ChapterResult } from './match';

export type RockClimate = 'wet' | 'dry' | 'cold';

export interface ClimateEvidence {
  climate: RockClimate;
  /** The rock type that says so, e.g. "coal". */
  rock: string;
  /** The unit it was found in. */
  unit: string;
}

const SIGNS: Record<string, RockClimate> = {
  coal: 'wet',
  lignite: 'wet',
  peat: 'wet',
  anthracite: 'wet',
  evaporite: 'dry',
  halite: 'dry',
  gypsum: 'dry',
  anhydrite: 'dry',
  trona: 'dry',
  till: 'cold',
  tillite: 'cold',
};

export const CLIMATE_WORD: Record<RockClimate, string> = { wet: 'a wet climate', dry: 'a dry climate', cold: 'a cold climate' };

/** Every sign of climate in the well-dated rock at the point, one per rock type. */
export function climateEvidence(c: ChapterResult): ClimateEvidence[] {
  const out: ClimateEvidence[] = [];
  for (const unit of c.rocksHere) {
    // Listed among the unit's rock types, or named outright ("Clayey Till").
    const words = [...unit.liths.map((l) => l.name), ...unit.name.toLowerCase().split(/[^a-z]+/)];
    for (const word of words) {
      const climate = SIGNS[word];
      if (climate && !out.some((e) => e.rock === word)) out.push({ climate, rock: word, unit: unit.name });
    }
  }
  return out;
}

/** The one climate the rocks point to, or null if they give no sign or point more than one way. */
export function rockClimate(evidence: ClimateEvidence[]): RockClimate | null {
  const found = new Set(evidence.map((e) => e.climate));
  return found.size === 1 ? [...found][0]! : null;
}
