// The shape of a part: one small drawing function for a plant, animal or trace.
// The drawings themselves are in parts/, one file per group.
//
// DRAWING CONVENTIONS (every part must follow these, or it will not sit right in a scene)
// - A part is drawn around its own origin, in its own units, as a string of SVG.
//   The scene moves, scales, mirrors and tints it.
// - 'base' parts stand on the origin: (0, 0) is ground level at the centre of the
//   part, and the drawing extends upward into negative y.
//   'center' parts float around the origin.
// - Animals face right (+x). The scene mirrors them as needed.
// - Every colour goes through c.tone('#rrggbb'), which applies the scene's light,
//   climate and distance haze. Never write a bare colour into the output.
// - Use c.rng for any variation, never Math.random, so a place always looks the same.
// - c.detail is false for small or distant copies: skip fine lines then.
// - c.sun says which side the light comes from (+1 right, -1 left) for highlights.
// - No ids, gradients, filters, text or <defs>: plain shapes only. A part is drawn
//   many times in one picture.
// - Size by role, in the part's own units, so that scenes can scale by role alone:

import type { Rng } from './draw';

/** What job a part does in a composition, with the size it must be drawn at. */
export type Role =
  /** Tall tree. Base anchor. 200 to 270 tall. */
  | 'canopy'
  /** Small tree or tall shrub. Base. 100 to 190 tall. */
  | 'understory'
  /** Low plant or clump. Base. 30 to 80 tall, up to 100 wide. */
  | 'ground'
  /** Plants lying on a water surface, seen at a low angle. Center. About 130 wide, 30 to 40 tall. */
  | 'floating'
  /** Very large land animal, shown in the middle distance. Base. 260 to 340 long, up to 230 tall. */
  | 'giant'
  /** Medium to large land animal. Base. 150 to 230 long, 70 to 130 tall. */
  | 'walker'
  /** Small land animal, shown close. Base. 60 to 110 long. */
  | 'critter'
  /** Animal at the water's edge. Base. 150 to 250 long, low. Set `afloat` if it lies in the water. */
  | 'shore'
  /** Small animal that crawls on the ground or the sea floor. Base. 60 to 180 long. */
  | 'crawler'
  /** In the air. Center. 60 to 240 across, to relative scale: a small bird 60, a large pterosaur 240. */
  | 'flyer'
  /** A trackway. Center. About 160 long. */
  | 'trace'
  /** Large swimmer. Center. 230 to 300 long. */
  | 'swimmer'
  /** Small or medium swimmer, or a school of small ones. Center. 90 to 160 across. */
  | 'drifter'
  /** Tall thing rooted on the sea or lake floor. Base. 100 to 180 tall. */
  | 'stalked'
  /** Mound-shaped builder on the floor. Base. 90 to 120 wide, 40 to 70 tall. */
  | 'mound'
  /** Small thing lying on the sea or lake floor. Base. 40 to 90 wide. */
  | 'floor';

export interface PartCtx {
  rng: Rng;
  /** Applies the scene's light, climate palette and distance haze to a colour. */
  tone: (hex: string) => string;
  /** Near parts get fine detail; distant ones are simplified. */
  detail: boolean;
  /** Which side the light comes from, in the part's own coordinates. */
  sun: -1 | 1;
}

export interface PartDef {
  role: Role;
  /** Approximate drawn size, for the gallery and for shadows. */
  w: number;
  h: number;
  /** 'base' parts stand on their origin; 'center' parts float around it. */
  anchor: 'base' | 'center';
  /** Sits in the water, not on the bank. */
  afloat?: boolean;
  draw: (c: PartCtx) => string;
}

export const rad = (deg: number) => (deg * Math.PI) / 180;
