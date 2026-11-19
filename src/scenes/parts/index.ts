// Every part the scenes may draw, from every group file. The parts made only for the painted pictures
// (./people.ts, ./domesticates.ts, Titanis, ./stromatolite-reef.ts) are left out so that the scene script does not carry them;
// ../all-parts.ts adds them back for the painting tools, the workbench and the tests.

import type { PartDef } from '../part';
import { PARTS as floraPaleozoic } from './flora-paleozoic';
import { PARTS as floraMesozoic } from './flora-mesozoic';
import { PARTS as floraCenozoic } from './flora-cenozoic';
import { PARTS as landPaleozoic } from './land-paleozoic';
import { PARTS as landTriassicJurassic } from './land-triassic-jurassic';
import { PARTS as landCretaceous } from './land-cretaceous';
import { PARTS as landPaleogene } from './land-paleogene';
import { PARTS as landNeogene } from './land-neogene';
import { PARTS as landQuaternary } from './land-quaternary';
import { PARTS as landSouthern } from './land-southern';
import { PARTS as landSmall } from './land-small';
import { PARTS as marineEarlyPaleozoic } from './marine-early-paleozoic';
import { PARTS as stromatoliteForms } from './stromatolite-forms';
import { PARTS as marineLatePaleozoic } from './marine-late-paleozoic';
import { PARTS as fishPaleozoic } from './fish-paleozoic';
import { PARTS as marineMesozoic } from './marine-mesozoic';
import { PARTS as marineCenozoic } from './marine-cenozoic';
import { PARTS as marineCommon } from './marine-common';
import { PARTS as freshwater } from './freshwater';
import { PARTS as primates } from './primates';

export const PARTS: Record<string, PartDef> = {
  ...floraPaleozoic,
  ...floraMesozoic,
  ...floraCenozoic,
  ...landPaleozoic,
  ...landTriassicJurassic,
  ...landCretaceous,
  ...landPaleogene,
  ...landNeogene,
  ...landQuaternary,
  ...landSouthern,
  ...landSmall,
  ...marineEarlyPaleozoic,
  ...stromatoliteForms,
  ...marineLatePaleozoic,
  ...fishPaleozoic,
  ...marineMesozoic,
  ...marineCenozoic,
  ...marineCommon,
  ...freshwater,
  ...primates,
};
