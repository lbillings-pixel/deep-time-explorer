// Turns one chapter of a place's timeline into the settings for its scene.
// Everything a scene shows is driven by data: the matched environment, the
// chapter, the ancient latitude, climate read from the rocks, water depth from
// the ancient maps, the present-day landmass, and fossils recorded nearby.

import type { LatLng } from '../geo/plates';
import { climateEvidence, rockClimate } from '../match/climate';
import type { ChapterResult } from '../match/match';
import type { EnvType } from '../match/taxonomy';
import { subSeed } from './draw';
import { regionOf } from './region';
import type { SceneParams } from './stage';

/** Scene types whose waterline follows the depth shown on the ancient maps. */
const SHALLOW_SEAS: EnvType[] = ['shelf-sea', 'carbonate-sea', 'reef'];
/** Depth of the shelf edge on the ancient maps, in metres: the deepest a shallow sea gets. */
const SHELF_DEPTH = 200;

/** A repeatable seed from a location, so a place always gets the same view. */
export function seedFromCoords(lat: number, lng: number): number {
  return subSeed(Math.round((lat + 90) * 100) * 40000 + Math.round((lng + 180) * 100), 'place');
}

/** The scene settings for a chapter, or null if the chapter has no matched environment. */
export function sceneParams(c: ChapterResult, place: LatLng): SceneParams | null {
  const env = c.environments[0];
  if (!env) return null;
  // PALEOMAP comes first in the list of plate models, and is the one the ancient maps are built on.
  const lat = c.paleo?.status === 'ok' ? (c.paleo.lats[0]?.lat ?? null) : null;
  const params: SceneParams = {
    environment: env.type,
    chapter: c.chapter.name,
    paleolatitude: lat,
    climate: rockClimate(climateEvidence(c)) ?? 'neutral',
    seed: seedFromCoords(place.lat, place.lng),
    region: regionOf(place.lat, place.lng),
    place: { lat: place.lat, lng: place.lng },
    localOrganisms: [...new Set(c.sitesNear.flatMap((s) => s.genera))],
  };
  if (SHALLOW_SEAS.includes(env.type) && c.paleo?.status === 'ok') {
    const depths = c.paleo.terrain.filter((t) => t.terrain === 'shallow-sea').map((t) => -t.metres);
    if (depths.length > 0) {
      const mean = depths.reduce((a, b) => a + b, 0) / depths.length;
      params.waterLevel = Math.min(1, Math.max(0.1, mean / SHELF_DEPTH));
    }
  }
  return params;
}
