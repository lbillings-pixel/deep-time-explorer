# Painted pictures of the five mass extinctions

Five pictures sit between chapter cards on the timeline. They are drawn by code as large SVGs with filters and thousands of brush strokes, then turned once into ordinary image files that ship with the site. No image model, no downloaded pictures, nothing installed.

| File | What it is |
| --- | --- |
| `paint.ts` | The painting toolkit, including `figure()`, the only way to put a plant or animal in a picture. |
| `scenes/<id>.ts` | One picture each. Exports `paint(): string`, a complete 1600 by 900 SVG. `end-cretaceous.ts` is the worked example. |
| `render.test.ts` | Runs every `paint()` and writes `review-sheet/extinctions/<id>.svg` and `<id>.cast.txt` (the parts used). Skipped unless `EXTINCTIONS=1`. |
| `rasterise.mjs` | Turns each SVG into `public/extinctions/<id>.webp` (1600 wide), `<id>-800.webp` and `<id>-320.webp` (the thumbnail on a lesser extinction's card), plus PNGs in `review-sheet/extinctions/` for looking at. |

A picture's id is the `id` of its entry in `src/match/extinctions.ts`, and the name of its scene file. Every file in `scenes/` is painted; there is no other list. The five mass extinctions are `end-ordovician`, `late-devonian`, `end-permian`, `end-triassic` and `end-cretaceous`; the lesser extinctions follow the same pattern.

## Paint one picture and look at it

```
node tools/extinctions/rasterise.mjs --paint end-cretaceous
```

This works in any shell and takes about five seconds. It prints the path of `review-sheet/extinctions/end-cretaceous.png`; open that, and `end-cretaceous-800.png` beside it, which is the size most visitors see. It also prints the size of the WebP (aim for 150 to 350 KB) and three measured lightness figures.

For a close-up at twice life size, to judge brushwork and edges, add a box in picture units (x, y, width, height). It is written to `<id>-crop.png`:

```
node tools/extinctions/rasterise.mjs --paint end-cretaceous --crop 300,380,800,450
```

If `paint()` throws (a part the whitelist does not permit, a syntax error), the error is printed and nothing is drawn.

## Rebuild everything

```
EXTINCTIONS=1 npx vitest run tools/extinctions/render.test.ts && node tools/extinctions/rasterise.mjs
```

(In PowerShell, `node tools/extinctions/rasterise.mjs --paint` does the same.) Pictures that have no scene file yet are skipped.

`tools/` is outside the project's `tsconfig.json`, so `npx tsc --noEmit` does not check these files. Check them with the project's settings like this:

```
npx tsc --ignoreConfig --noEmit --target ES2022 --module ESNext --moduleResolution bundler --lib ES2022,DOM,DOM.Iterable --strict --noUnusedLocals --noUnusedParameters --noUncheckedIndexedAccess --skipLibCheck --resolveJsonModule --types vite/client,node tools/extinctions/paint.ts tools/extinctions/render.test.ts tools/extinctions/scenes/*.ts
```

## The toolkit, a line each

Create `const p = new Painting(seed)`, add layers back to front with `p.add(...)`, and return `p.svg()`.

Living things:

- `figure(id, chapter, { x, y, scale, flip, tone, rotate, detail, lightFrom, seed })`: draws a part from the library; throws unless the whitelist permits `id` in `chapter`.
- `p.painted(figures, { seed, color, flow, density, edge, air, light })`: repaints a placed figure inside its own outline so it belongs to the painting: brush strokes from a color function, an outline that is pushed about, frayed and softened, the color of the air behind glazed along its edges, and broken light with a half-light on the side facing each light. Use it on every plant and animal, in place of `p.rough` and `p.rim`.
- `boxOf(figures)`: the box around a placed figure, for color functions that need to know where its head, feet or lit side is.
- `silhouette(dark, keep, lift)`: a tone that turns a part into a near-silhouette.
- `duotone(shadow, light)`: a tone that maps a part's darks and lights onto two palette colors.
- `toward(haze, t, inner)`: a tone that pulls a part toward the haze color, for distance.
- `mirror(content, y)`: a reflection in still water or wet sand, about the line at height y.
- `castShadow(standing, x, y, lean, length)`: a figure's shadow lying on the ground.

Color and shape:

- `p.underpaint(colorAt, cell)`: the lay-in, a blurred mosaic of a color function of (x, y).
- `p.linear(stops, x1, y1, x2, y2)` and `p.radial(stops, cx, cy, r, squash)`: gradient fills.
- `p.wash(fill)`: a rectangle over the whole picture.
- `vary(color, rng, amount, accent)`: a color nudged at random, so no two strokes match.
- `lum(hex)`: lightness of a color, 0 to 1.
- `landform(yAt)`: the closed shape under a skyline given as a height function.
- `smooth(points, closed)`: a smooth curve through points.
- `noise1(seed, scale)` and `noise2(seed, scale)`: smooth random wobble along a line and over the picture.
- `groundPlane(horizonY, eyeHeight, cx)`: perspective for textures on flat ground or water.
- `trail(x0, y0, x1, y1, width, color, core, bend)`: a tapering streak of light: ember, meteor, spark, ray.

Brushwork and soft masses:

- `p.strokes({ seed, count, box, where, flow, color, len, width, opacity, size, bend, wander, shape })`: thousands of short strokes that follow a flow direction and sample a color function.
- `p.puffs({ seed, spine, count, dark, mid, light, toLight })`: a billowing mass (smoke, ash, steam, cloud) lit from one side.

Filters, each wrapping finished content:

- `p.blur(content, sx, sy)`: softens.
- `p.rough(content, { wobble, size, bristle })`: breaks edges so nothing looks cut with a knife.
- `p.dry(content, { hold, grainX, grainY })`: dry brush, streaky holes that let the layer beneath show.
- `p.blend(content, mode, opacity)`: `screen` and `color-dodge` for light, `multiply` for shadow, `soft-light` and `overlay` to shift what is beneath.
- `p.fade(content, maskFill)`: fades content through a gradient.
- `p.rim(content, { toLight, color, width, soft, strength, broken })`: a lit edge on the side facing the light.
- `p.bloom(content, spread, strength)`: makes bright content glow.

Light, air and finish:

- `p.glow(cx, cy, rx, ry, color, opacity, mode)`: a soft pool of light or shadow, with no filter.
- `p.haze(y, spread, color, opacity, mode)`: a band of haze across the picture.
- `p.vignette(strength, color, cx, cy)`: darkens the corners around a center.
- `p.svg({ wobble, relief, grain })`: the finished document, passed through a last filter: a fine wobble of every edge, a relief that catches light on stroke edges like thick paint, and grain.
- `p.sub(label)`: repeatable random numbers for one named layer.
- `figuresUsed()`: the parts drawn so far, for the report and alt text.

Spheres and frameless vignettes (plain functions that take the painting as their first argument):

- `litSphere(p, { seed, cx, cy, r, toLight, surface, night, glow, shading, terminator, haze, halo, tilt, lean, spin, flow, density, len, width })`: a ball with a day side, a terminator and a night side, painted in strokes that run round its curve. `toLight` is `[right, down, toward the viewer]`. `surface(s, rng)` gives the colour in full light at a `SpherePoint` `s` (`s.lon`, `s.lat` in radians fixed to the ball; `s.nx, s.ny, s.nz` the normal; `s.light` and `s.lit` the light there; `s.x, s.y` the picture point), so one caller paints a molten Earth and another a cratered Moon. `glow(s)` (0 to 1) keeps that share of the surface colour whatever the light: lava, a fresh scar. `halo` is a glow outside the limb, `haze` air along the limb. It uses no filter and works from a radius of about 18 to several hundred. See `scenes/moon-impact.ts`.
- `sphereAt(opts, x, y)`: the `SpherePoint` under a picture point, or null off the disc. `sphereSpot(opts, lon, lat)`: where a place on the ball falls in the picture, `[x, y, facing]`, for laying a `p.glow` over a feature.
- `softRegion(p, content, { seed, cx, cy, rx, ry, feather, irregular, lobes, square })`: masks a small scene to an irregular, frayed, soft-edged patch, for a picture of several scenes with no frames. Paint a shared ground first, then add each region; where regions overlap by about `feather` they run into each other.

Learned while making them:

- **A ball in space wants a side light.** With the light well toward the viewer (`toLight` third number above about 0.3) the terminator slides round the back and the ball looks evenly lit. `[-0.88, -0.36, 0.12]` gives a clear day and night.
- **Strokes along `'latitude'` smear round features into bands** (a cratered moon turns streaky). Use `flow: 'limb'` or `'light'` for an airless, spotted body, and keep `'latitude'` for a spinning, banded or molten one.
- **A small sphere (radius under about 30) is mostly its lay-in**: put the features in `surface` at a scale of a third of the disc or more, and let `glow` plus a `p.glow` on top carry a scar.
- **Paint each `softRegion` scene about half as large again as its `rx`, `ry`**, or the frayed edge runs out of paint. The default `feather` (0.18 of the smaller half-size) reads as the edge of a wash; much more looks airbrushed.

## How the example picture is built

1. **Light as functions.** `sky(x, y)` and `sea(x, y)` return a color for any point, mixed from six palette colors. Clouds, the path of light on the water and the sand bars are all inside these functions.
2. **Lay-in.** `p.underpaint(field)` fills the picture with those colors, blurred.
3. **Brushwork.** `p.strokes` repaints each area with the same function, so strokes and gaps agree. The sky's strokes radiate from the blast; the sea's are flat and shrink toward the horizon.
4. **The event.** More strokes for the fan of fire, selected by a function (`inFan`) that also sets their color; `p.puffs` for dust; `p.glow` for the fireball; `trail` inside `p.bloom` for falling rock.
5. **Ground.** `landform` shapes with `p.rough` edges and a `p.rim` of light along the top, then strokes down the slope.
6. **Figures.** Library parts in a `silhouette` tone, each repainted with `p.painted`, with a `mirror` reflection or a `castShadow` made from the plain part.
7. **Air.** A `p.glow` of glare laid under the near figures, then `p.vignette`.

## Painting a figure

A library part laid on the picture as it comes is a crisp, flat cut-out: clip art on a gouache. `p.painted` repaints it. Give `figure()` a dark tone (that is the lay-in, and what shows between strokes), then:

```ts
const rex = figure('tyrannosaur', CHAPTER, { x: 440, y: 700, scale: 1.8, tone: silhouette(DARK, 0.06, EMBER) });
p.add(p.painted(rex, {
  seed: 'rex',
  color: (x, y, r) => vary(mix(DARK, WARM, 0.15 * clamp((x - boxOf(rex)[0]) / boxOf(rex)[2], 0, 1)), r, 0.03),
  flow: 4,                                              // along the body
  air: { color: field },                                // the picture's own color function: what is behind the figure
  light: { toLight: [1, 0.1], color: GOLD, width: 6 },  // one light, or a list of them
}));
```

Several figures joined with `+` can go in one call if they share colors and stand close together. `color`, `air.color` and `light.color` are in picture units, like every other color function. To lose a figure's feet in the ground or its far end in haze, wrap the result in `p.fade`.

Learned while polishing the other four pictures:

- **An explicit `box` cuts off whatever lies outside it**, because the mask is the size of the box. A long limb or tail is sliced unless the box is generous.
- **One call per figure is often faster than one call for a group.** A call's filter passes are as large as the box around all its figures; a row of domes along a slope drew in 3.0 seconds as groups and 2.25 seconds one by one.
- **A light close in hue to the ground loses its half-light**, and the figure goes back to a flat silhouette (orange light in a maroon scene). Shift the light toward gold or toward the sky's color.
- **About a tenth of the flat lay-in shows between strokes.** Where the stroke color changes a lot across a figure (light back, dark belly) that reads as flecks or camouflage. Give `figure()` a `tone` that maps the part's own lights and darks onto the two ends of the stroke colors.
- **Pointed `dab` strokes leave shard-shaped gaps on pale forms.** Use `shape: 'line'` there, with a lay-in near the stroke color.

## What looks painted in Edge's SVG renderer, and what does not

Works:

- **`p.painted` on every figure, with quiet settings.** What made the parts sit in the picture, in order of effect: body strokes that differ only a little from one another (`vary` at 0.025 to 0.04 and a warm mix under 0.25); a light 3 to 6 units wide with its half-light (`turn`) left on, which models the form where a thin rim only outlines it; the `air` glaze at 0.2 to 0.3, which takes the knife off the edge. Give the nearest animal larger strokes than the default (`len: [26, 70], width: [7, 15]` for a figure 500 units long).
- **A lighter step of ground behind dark foreground plants.** Write it into the ground's color function (lighter just behind the skyline of the nearer rise) so the plants have something to stand against.
- **Streaks of light that differ.** A power of a random number (`rng() ** 2.4`) for size gives many faint small ones and a few broad ones; only the few get a head that glows, and that head is small.

- **Color functions plus strokes.** This is the main trick. A smooth gradient looks like vector art; the same colors laid down as 2,000 to 4,000 overlapping strokes per area, each varied a few percent with `vary`, look like gouache. Give every area a flow direction with a meaning (away from a blast, along water, down a slope).
- **Stroke shape and filter.** `dab` strokes inside `p.rough` with `bristle` 1.5 to 2.5 get ragged, dry edges. `lens` strokes with a tiny `wander` make water. `p.dry` over long flat strokes makes wet sand and dragged paint.
- **The finishing filter in `p.svg()`.** Leave it on. The relief makes stroke edges catch light; the wobble takes the knife edge off library parts; the grain hides gradient banding.
- **Light added last with `screen`.** A blurred copy of bright strokes (`p.bloom`) is what makes fire glow.
- **Rim light from a filter** (`p.rim`) on land: the skyline of a hill, a bank, a headland. Use `broken` so it is not a continuous line. On plants and animals use the `light` of `p.painted`.
- **Overlapping grounds in steps of value**: near shapes darkest, each one back a little lighter and nearer the sky color.
- **Reflections and shadows.** A `mirror` copy, blurred down its length and passed through `p.dry`, puts a figure on wet ground at once.

Does not work:

- **`p.puffs` with strong lights on a dark sky** reads as out-of-focus lamps. Keep `lightOpacity` at 0.5 or less and `soft` high, or paint clouds inside the sky's color function and let the strokes draw them (see `sky` in the example).
- **Rim light on ferns and other fine foliage** outlines every leaflet like gold wire. Leave small plants without light (`p.painted` with `air` only), or give large near fronds one dull, wide, soft light (`strength` 0.5, `soft` about half the width, `broken` 0.55).
- **A strong outline wobble on an animal** (`edge.wobble` of 2.5) melts its head and limbs into blobs. Keep animals at about 1; a stiff, symmetrical tree can take 3 to 4 and is the better for it.
- **Body strokes that vary a lot** (a warm mix ranging from 0.1 to 0.45 from stroke to stroke) turn an animal into camouflage. Let the color change with place, not at random.
- **A wide soft light or a deep `air` glaze** (`soft` near half the width at width 8, or `air` 6 deep at 0.26 against a bright sky) looks airbrushed and out of focus, not painted.
- **Round glowing heads on many streaks** read as lamps or comets. Glow only a few, with a head no wider than about one and a half times the streak.
- **A straight band of haze as a line of light** (a shock front, a far shore) looks ruled. Paint it as strokes kept by a noise function, so it wanders, thickens and breaks.
- **Strong relief or grain.** Relief above about 0.3 embosses bright lines; grain at 0.5 looked like a noisy photograph, and the WebP had to drop from quality 0.85 to 0.70 to stay under 350 KB.
- **Small scattered details** (pebbles, single rocks): at 800 wide they are specks. Leave them out.
- **A screen glow laid over figures** turns silhouettes brown. Put glare under near figures, and only a faint one over everything.
- **Thin arcs and rings of light** (a pressure wave was tried) look like scratches.
- **Foreground ground lit cool and light** reads as snow at phone size, even when it is quite dark in absolute terms. Mix the cool light with the picture's warm dark, and keep the light patches few.
- **Library plants dark on a dark ground** vanish. Put silhouettes where something lighter is behind them.

## Pitfalls

- **Bleed.** Everything a filter touches must overrun the picture's edge (`BLEED`, 120 units). `landform`, `p.wash` and `p.underpaint` do this already. Without it, roughened edges drag holes in from outside.
- **Filters go at the top level.** `blur`, `rough`, `dry`, `rim`, `bloom`, `fade` and `painted` use regions in picture units. Never wrap them inside a moved or scaled group; wrap the placed figure instead.
- **`p.painted` finds its figures by the text `figure()` returned.** Pass that text as it is (joined with `+` or already wrapped in a filter is fine). A `mirror` or `castShadow` of a figure is somewhere else: make those from the plain figure, or give `box`.
- **`p.painted` costs by the box around its figures.** Each call makes a filter pass for the edge, one for `air` and one for each light, as large as the box around everything in the call, and scatters strokes over each figure's whole box. Group figures that stand together; give far-apart ones their own calls; use `density: 1` for fine foliage, where strokes hardly show.
- **Filters you write yourself** need `filterUnits="userSpaceOnUse"` with a region covering the picture and `color-interpolation-filters="sRGB"`. The default region clips blurs into a visible square, and the default color space shifts colors.
- **Dabs point along the flow.** A `dab` is blunt at its start and pointed at its end, so flow of 0 points right and 180 points left.
- **Speed.** The example has about 14,000 strokes in a 1.8 MB SVG, about 30 full-frame filtered layers and about 25 small ones inside `p.painted`; Edge draws it in about one and a half seconds (about one second before its figures were repainted). Every `rough`, `dry`, `rim`, `blur` and `bloom` call is one more full-frame pass, so dozens are fine and hundreds are not. Never filter strokes one at a time: filter the whole layer. `count` in `p.strokes` is the number tried; `where` rejects many.
- **The viewer can flatter.** A picture can look lighter in a preview than it is. Trust the lightness line that `rasterise.mjs` prints. The example reads 7, 24, 80.
- **File size** is driven by grain and by the number of high-contrast fine strokes. The script lowers WebP quality in steps from 0.85 if the large file passes 350 KB, and says so.
- **Random numbers.** Use `p.sub('label')` or the `seed` of `strokes` and `puffs`. Changing one layer then leaves the others as they were.
- **Colors passed to `mix`, `vary` and tone functions** must be six-digit hex, such as `#1c1d3a`.
- **Edit with the Write or Edit tool.** Shell heredocs on this machine can mangle backslashes and backticks.
