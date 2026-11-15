// Every part, from every group file.

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
import { PARTS as marineLatePaleozoic } from './marine-late-paleozoic';
import { PARTS as fishPaleozoic } from './fish-paleozoic';
import { PARTS as marineMesozoic } from './marine-mesozoic';
import { PARTS as marineCenozoic } from './marine-cenozoic';
import { PARTS as marineCommon } from './marine-common';
import { PARTS as freshwater } from './freshwater';
import { PARTS as primates } from './primates';
import { PARTS as domesticates } from './domesticates';

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
  ...marineLatePaleozoic,
  ...fishPaleozoic,
  ...marineMesozoic,
  ...marineCenozoic,
  ...marineCommon,
  ...freshwater,
  ...primates,
  ...domesticates,
};
