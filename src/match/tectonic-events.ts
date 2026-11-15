// The list of tectonic events. See tectonics.ts for what an entry means and how it is used.
import { MOUNTAIN_BUILDING } from './tectonic-events-mountains';
import { RIFTS_AND_OCEANS } from './tectonic-events-rifts';
import type { TectonicEvent } from './tectonics';

export const TECTONIC_EVENTS: TectonicEvent[] = [...MOUNTAIN_BUILDING, ...RIFTS_AND_OCEANS];
