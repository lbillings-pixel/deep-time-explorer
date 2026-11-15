// The caveats a chapter carries when its setting is mountains: what ties the spot to the range, and
// which of this site's own rules of thumb were used. They are rules of thumb, not published figures,
// and each caveat says so.
import type { ChapterResult } from './match';
import { HIGH_GROUND } from './match';
import { WEARING_DOWN, wornBy } from './tectonics';

/** True if the chapter's mountains are only those of a range whose building had ended: shown wearing down. */
export function wornDown(c: ChapterResult): boolean {
  return c.environments[0]?.type === 'mountains' && c.mountains.length > 0 && c.mountains.every((m) => m.state === 'wearing-down');
}

export const HEIGHT_LINE_CAVEAT = `This spot is counted as part of the range because ground rises to at least ${HIGH_GROUND.toLocaleString('en')} meters within 10 km of it today. That line is this site's own rule of thumb, not a published definition of a mountain. A town at the foot of a range can fall on either side of it.`;

export const HEIGHT_REACH_CAVEAT =
  'High ground today is evidence about the present. This site lets it stand for the Quaternary and the Neogene, the last 23 million years, because the mountain building named here was under way during that time, and for nothing earlier. When this particular spot first stood high is not known, and it may have been later than the picture suggests.';

export const WORN_CAVEAT =
  'The forces that built these mountains had stopped by this time. They are shown as still standing because published work finds that a range can outlast its building by tens of millions of years, slowly wearing down. How high this one still stood, and how rugged it was, is not known.';

export const WORN_SPAN_CAVEAT = `Unless published work dates what became of a range, this site shows it wearing down for ${WEARING_DOWN} million years after its building ended, and then stops. That span is this site's own judgment, not a published figure: studies of how fast mountains wear away give answers from a few million to hundreds of millions of years.`;

export const WORN_TO_PRESENT_CAVEAT = 'Mountains standing here today are not proof that mountains stood here all the while. Some old ranges were worn low, or covered by the sea, and lifted again much later.';

export const BESIDE_CAVEAT =
  'Fossil sites within 25 km record a different setting at this time; they are listed in the evidence. The rock at this spot formed deep underground and mountains were being built on it, so this site takes those fossils to record the lowland or the sea beside the range, not this spot. Where the range front ran is not known to within a few kilometers, so that reading can be wrong.';

/** The caveats for a chapter whose setting is mountains; none for any other chapter. */
export function mountainCaveats(c: ChapterResult): string[] {
  if (c.environments[0]?.type !== 'mountains') return [];
  const out: string[] = [];
  if (c.sitesNear.length > 0 && c.mountains.some((m) => m.state === 'building' && m.unit !== null)) out.push(BESIDE_CAVEAT);
  if (wornDown(c)) {
    out.push(WORN_CAVEAT);
    // An event with a span of its own carries its own caveat in place of the general one.
    const own = c.mountains.flatMap((m) => (m.event.wornCaveat ? [m.event.wornCaveat] : []));
    out.push(...new Set(own));
    if (c.mountains.some((m) => m.event.wornBy === undefined)) out.push(WORN_SPAN_CAVEAT);
    if (c.mountains.some((m) => wornBy(m.event) === 0)) out.push(WORN_TO_PRESENT_CAVEAT);
  } else if (c.mountains.every((m) => m.state === 'wearing-down' || m.unit === null)) {
    // No deep rock ties the spot to a range being built: the tie is today's high ground.
    if (c.mountains.some((m) => m.metres !== null)) out.push(HEIGHT_LINE_CAVEAT, HEIGHT_REACH_CAVEAT);
  }
  return out;
}
