// Turns the painted SVGs of the extinctions into the image files the site ships.
//
// Rebuild everything (bash; the pictures are painted by the vitest file, then turned into images here):
//
//   EXTINCTIONS=1 npx vitest run tools/extinctions/render.test.ts && node tools/extinctions/rasterise.mjs
//
// While painting one picture, this does both steps for that picture alone (works in any shell):
//
//   node tools/extinctions/rasterise.mjs --paint end-cretaceous
//   node tools/extinctions/rasterise.mjs --paint end-cretaceous --crop 800,300,640,360   also writes a close-up
//
// For each review-sheet/extinctions/<id>.svg it writes
//   public/extinctions/<id>.webp        1600 wide, shipped
//   public/extinctions/<id>-800.webp    800 wide, shipped
//   public/extinctions/<id>-320.webp    320 wide, shipped: the thumbnail on a lesser extinction's card
//   review-sheet/extinctions/<id>.png and <id>-800.png   for looking at (git-ignored)
//   review-sheet/extinctions/<id>-crop.png                with --crop x,y,w,h (in picture units), at full sharpness
//
// How: the copy of Edge (or Chrome) already on this machine runs headless; this script talks to it
// over its remote debugging port with Node's built-in WebSocket, draws the SVG onto a canvas in a
// blank page and asks for the canvas as WebP and PNG. Nothing is installed or downloaded.
// Needs Node 22 or later (global WebSocket and fetch).
import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const W = 1600;
const H = 900;
/** The large WebP should land between 150 and 350 KB: quality starts here and steps down while the file is too big. */
const QUALITY = 0.85;
const MAX_BYTES = 350 * 1024;

const argv = process.argv.slice(2);
const paint = argv.includes('--paint');
const cropAt = argv.indexOf('--crop');
const crop = cropAt >= 0 ? argv[cropAt + 1].split(',').map(Number) : null;
const named = argv.filter((a, i) => !a.startsWith('--') && !(cropAt >= 0 && i === cropAt + 1));

const svgDir = path.resolve('review-sheet/extinctions');
const outDir = path.resolve('public/extinctions');
fs.mkdirSync(svgDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });

if (paint) {
  try {
    execSync('npx vitest run tools/extinctions/render.test.ts', { env: { ...process.env, EXTINCTIONS: '1', ...(named.length ? { ONLY: named.join(',') } : {}) }, stdio: 'pipe' });
  } catch (err) {
    // Show the real error (a thrown whitelist refusal, a syntax error), not vitest's whole report.
    const text = `${err.stdout ?? ''}${err.stderr ?? ''}`;
    console.error(text.split('\n').filter((l) => /Error|error|✗|×|FAIL|at |\d+\s*\|/.test(l)).slice(0, 25).join('\n') || text.slice(-1500));
    process.exit(1);
  }
}

// Named ids, or every picture that has been painted. Any other id (a test picture) can be named too.
const ids = named.length ? named : fs.readdirSync(svgDir).filter((f) => f.endsWith('.svg')).map((f) => f.slice(0, -4));
if (!ids.length) {
  console.error(`No SVGs in ${svgDir}. Paint them first: EXTINCTIONS=1 npx vitest run tools/extinctions/render.test.ts`);
  process.exit(1);
}

const browser = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));
if (!browser) {
  console.error('No Edge or Chrome found.');
  process.exit(1);
}

// A profile folder of its own, so this never touches the user's browser. Port 0 lets the browser
// choose a free port, which it writes into the profile folder.
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'extinctions-'));
const child = spawn(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--remote-debugging-port=0', '--remote-allow-origins=*', `--user-data-dir=${profile}`, 'about:blank'], { stdio: 'ignore' });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Runs in the browser: draws the SVG at full size, then returns the image files as data URLs. */
const inPage = async (svg, W, H, quality, maxBytes, crop) => {
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  const img = new Image();
  img.src = url;
  await img.decode();
  const canvasOf = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });
  const t0 = performance.now();
  const big = canvasOf(W, H);
  big.getContext('2d').drawImage(img, 0, 0, W, H);
  // The small one is the large one scaled down, so both show the same brushwork and grain.
  const small = canvasOf(W / 2, H / 2);
  const sc = small.getContext('2d');
  sc.imageSmoothingQuality = 'high';
  sc.drawImage(big, 0, 0, W / 2, H / 2);
  // The thumbnail is scaled from the small one: shrinking in steps keeps it sharp.
  const thumb = canvasOf(W / 5, H / 5);
  const tc = thumb.getContext('2d');
  tc.imageSmoothingQuality = 'high';
  tc.drawImage(small, 0, 0, W / 5, H / 5);
  const bytes = (dataUrl) => Math.floor(((dataUrl.length - dataUrl.indexOf(',') - 1) * 3) / 4);
  let q = quality;
  let webp = big.toDataURL('image/webp', q);
  while (bytes(webp) > maxBytes && q > 0.5) {
    q = Math.round((q - 0.05) * 100) / 100;
    webp = big.toDataURL('image/webp', q);
  }
  // The spread of light and dark, measured: lightness (0 to 100) below which 5%, 50% and 95% of the picture lies.
  const px = big.getContext('2d').getImageData(0, 0, W, H).data;
  const hist = new Array(101).fill(0);
  for (let i = 0; i < px.length; i += 4) hist[Math.round((0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 2.55)]++;
  const values = [0.05, 0.5, 0.95].map((mark) => {
    let acc = 0;
    return hist.findIndex((count) => (acc += count) >= (px.length / 4) * mark);
  });
  const out = { q, values, ms: Math.round(performance.now() - t0), webp, webp800: small.toDataURL('image/webp', quality), webp320: thumb.toDataURL('image/webp', quality), png: big.toDataURL('image/png'), png800: small.toDataURL('image/png') };
  if (crop) {
    // A close-up for judging brushwork: drawn from the SVG again, twice as large, so nothing is blurred by scaling.
    const [x, y, w, h] = crop;
    const c = canvasOf(w * 2, h * 2);
    c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w * 2, h * 2);
    out.crop = c.toDataURL('image/png');
  }
  URL.revokeObjectURL(url);
  return out;
};

let ws;
try {
  // Wait for the browser to say which port it chose.
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let i = 0; i < 100 && !fs.existsSync(portFile); i++) await sleep(100);
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim();
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    target = list.find((t) => t.type === 'page');
    if (!target) await sleep(100);
  }
  ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = () => reject(new Error('Could not connect to the browser.'));
  });
  let next = 0;
  const waiting = new Map();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && waiting.has(m.id)) {
      waiting.get(m.id)(m);
      waiting.delete(m.id);
    }
  };
  const send = (method, params) =>
    new Promise((resolve) => {
      const id = ++next;
      waiting.set(id, resolve);
      ws.send(JSON.stringify({ id, method, params }));
    });

  const save = (file, dataUrl) => {
    const buf = Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64');
    fs.writeFileSync(file, buf);
    return Math.round(buf.length / 1024);
  };

  for (const id of ids) {
    const file = path.join(svgDir, `${id}.svg`);
    if (!fs.existsSync(file)) {
      console.error(`${id}: no ${file}`);
      process.exitCode = 1;
      continue;
    }
    const svg = fs.readFileSync(file, 'utf8');
    const expression = `(${inPage.toString()})(${JSON.stringify(svg)}, ${W}, ${H}, ${QUALITY}, ${MAX_BYTES}, ${JSON.stringify(crop)})`;
    const reply = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
    const r = reply.result?.result?.value;
    if (!r) {
      console.error(`${id}: the browser could not draw it. ${JSON.stringify(reply.result?.exceptionDetails?.exception?.description ?? reply.error ?? reply).slice(0, 600)}`);
      process.exitCode = 1;
      continue;
    }
    const kb = save(path.join(outDir, `${id}.webp`), r.webp);
    const kb800 = save(path.join(outDir, `${id}-800.webp`), r.webp800);
    const kb320 = save(path.join(outDir, `${id}-320.webp`), r.webp320);
    save(path.join(svgDir, `${id}.png`), r.png);
    save(path.join(svgDir, `${id}-800.png`), r.png800);
    if (r.crop) save(path.join(svgDir, `${id}-crop.png`), r.crop);
    console.log(`${id}: svg ${Math.round(svg.length / 1024)} KB, drawn in ${r.ms} ms, webp ${kb} KB at quality ${r.q}${kb < 150 ? ' (under the 150 KB aim)' : kb > 350 ? ' (OVER the 350 KB aim)' : ''}, 800 wide ${kb800} KB, 320 wide ${kb320} KB`);
    // A check on the eye: a picture viewer can flatter. A dramatic picture wants deep darks, a middle around 20 to 45, and lights near 100 somewhere.
    console.log(`  lightness (0 black to 100 white): darkest twentieth below ${r.values[0]}, middle ${r.values[1]}, lightest twentieth above ${r.values[2]}`);
    console.log(`  look at: ${path.join(svgDir, `${id}.png`)}  and  ${id}-800.png beside it`);
  }
} finally {
  try {
    ws?.close();
  } catch {
    // already closed
  }
  child.kill();
  await sleep(300);
  try {
    fs.rmSync(profile, { recursive: true, force: true });
  } catch {
    // Windows sometimes holds the folder for a moment; the temp folder is cleaned by the system.
  }
}
