// Turns Macrostrat vector tiles into samples on the 0.1° rock grid
// (see tools/build-rockgrid.mjs for the route and the output format).
import { VectorTile } from '@mapbox/vector-tile';
import { PbfReader } from 'pbf';

export const ROWS = 1800; // 0.1° cells; row 0 is the southernmost
export const COLS = 3600; // column 0 is the westernmost
export const PLAN_Z = 2; // zoom used to find where a continental map has polygons
export const DATA_Z = 5; // zoom the grid is sampled from
const EXTENT = 4096; // coordinate units across one tile

// Where each row's centre latitude sits on the Web Mercator y axis, in DATA_Z tile
// coordinates. Rows poleward of 85.05° land outside every tile and stay empty.
const rowY = Float64Array.from({ length: ROWS }, (_, r) => {
  const lat = (((r + 0.5) / 10 - 90) * Math.PI) / 180;
  return ((1 - Math.asinh(Math.tan(lat)) / Math.PI) / 2) * 2 ** DATA_Z * EXTENT;
});

function* unitFeatures(buf) {
  if (!buf.length) return; // the server answers an empty tile with an empty body
  const layer = new VectorTile(new PbfReader(buf)).layers.units;
  for (let i = 0; i < (layer?.length ?? 0); i++) yield layer.feature(i);
}

/**
 * The DATA_Z tiles, as [x, y], worth fetching under PLAN_Z tile (px, py): the rectangle of
 * child tiles that spans all its polygons. A rectangle, not just the tiles the polygons
 * touch, because the server drops polygons under about 10 km from PLAN_Z tiles; small
 * islands lying among larger pieces of the same map are still fetched this way.
 */
export function plan(buf, px, py) {
  let x1 = Infinity;
  let y1 = Infinity;
  let x2 = -Infinity;
  let y2 = -Infinity;
  for (const ft of unitFeatures(buf)) {
    const box = ft.bbox();
    x1 = Math.min(x1, box[0]);
    y1 = Math.min(y1, box[1]);
    x2 = Math.max(x2, box[2]);
    y2 = Math.max(y2, box[3]);
  }
  const tiles = [];
  if (x1 > x2) return tiles; // no polygons
  const n = 2 ** (DATA_Z - PLAN_Z);
  const pad = 8; // outlines at PLAN_Z are simplified to within 4 units of the true ones
  const child = (v) => Math.min(n - 1, Math.max(0, Math.floor((v * n) / EXTENT)));
  for (let j = child(y1 - pad); j <= child(y2 + pad); j++) {
    for (let i = child(x1 - pad); i <= child(x2 + pad); i++) tiles.push([px * n + i, py * n + j]);
  }
  return tiles;
}

/**
 * Sample DATA_Z tile (tx, ty) at the centre of every grid cell that falls inside it.
 * A cell still empty in `grid` takes the legend_id of the polygon containing its centre.
 * Where polygons of one map overlap, the smallest wins: the Arctic map, for one, lays a
 * general ocean-crust polygon beneath its more specific units.
 */
export function rasterise(buf, tx, ty, grid) {
  const rows = []; // grid rows in this tile, north to south, so their tile y ascends
  for (let r = ROWS - 1; r >= 0; r--) {
    const y = rowY[r] - ty * EXTENT;
    if (y >= 0 && y < EXTENT) rows.push(r);
  }
  const ys = rows.map((r) => rowY[r] - ty * EXTENT);
  const perTile = COLS / 2 ** DATA_Z; // grid columns per tile width
  // First column whose centre lies at or east of tile coordinate x.
  const colAt = (x) => Math.ceil((x * perTile) / EXTENT + perTile * tx - 0.5);
  const first = colAt(0);
  const end = colAt(EXTENT);
  const polygons = Array.from(unitFeatures(buf), (ft) => {
    const rings = ft.loadGeometry();
    return { legend: ft.properties.legend_id, rings, area: area(rings) };
  });
  for (const { legend, rings } of polygons.sort((a, b) => a.area - b.area)) {
    scanFill(rings, ys, (k, xa, xb) => {
      const row = rows[k] * COLS;
      for (let c = Math.max(first, colAt(xa)), stop = Math.min(end, colAt(xb)); c < stop; c++) {
        grid[row + c] ||= legend;
      }
    });
  }
}

/** Area inside a polygon's rings. Holes wind the opposite way, so they subtract themselves. */
function area(rings) {
  let twice = 0;
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) twice += ring[i - 1].x * ring[i].y - ring[i].x * ring[i - 1].y;
  }
  return Math.abs(twice) / 2;
}

/**
 * Even-odd scanline fill, which handles holes and multi-part polygons alike: calls
 * span(k, xa, xb) for every stretch of x that is inside the rings along sample row ys[k].
 * `ys` must ascend. Rings are closed (first point repeated), as vector-tile returns them.
 */
function scanFill(rings, ys, span) {
  const crossings = []; // per row: x of every ring edge crossing it
  for (const ring of rings) {
    for (let i = 1; i < ring.length; i++) {
      let a = ring[i - 1];
      let b = ring[i];
      if (a.y === b.y) continue;
      if (a.y > b.y) [a, b] = [b, a];
      // An edge owns the rows with a.y <= y < b.y, so a row through a vertex counts once.
      for (let k = firstAtOrAfter(ys, a.y); k < ys.length && ys[k] < b.y; k++) {
        (crossings[k] ??= []).push(a.x + ((ys[k] - a.y) * (b.x - a.x)) / (b.y - a.y));
      }
    }
  }
  crossings.forEach((xs, k) => {
    xs.sort((p, q) => p - q);
    for (let i = 0; i + 1 < xs.length; i += 2) span(k, xs[i], xs[i + 1]);
  });
}

function firstAtOrAfter(ys, y) {
  let lo = 0;
  let hi = ys.length;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (ys[mid] < y) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}
