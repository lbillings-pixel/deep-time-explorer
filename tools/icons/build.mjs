// Makes the site's icons and the picture shown when someone posts a link to the site.
//
//   node tools/icons/build.mjs
//
// 1. tools/icons/icons.test.ts paints the present-day globe with the app's own globe code and
//    writes public/favicon.ico and public/apple-touch-icon.png.
// 2. This script lays out the link picture (1200 x 630) as a page around that globe and has the
//    copy of Edge (or Chrome) already on this machine photograph it, headless, into
//    public/og-image.png. Nothing is installed or downloaded.
//
// The view and the marker (Salt Lake City, the place the search box suggests) are set in both files.
import { execSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

execSync('npx vitest run tools/icons/icons.test.ts', { env: { ...process.env, ICONS: '1' }, stdio: 'inherit' });

const VIEW = { lat: 38, lng: -100 };
const MARKER = { lat: 40.76, lng: -111.89 };
const RAD = Math.PI / 180;
// Where the marker falls on the disc (as toScreen in src/globe/render.ts), in units of the radius, y up.
const [lat, lat0, d] = [MARKER.lat * RAD, VIEW.lat * RAD, (MARKER.lng - VIEW.lng) * RAD];
const mx = Math.cos(lat) * Math.sin(d);
const my = Math.cos(lat0) * Math.sin(lat) - Math.sin(lat0) * Math.cos(lat) * Math.cos(d);

const dir = path.resolve('review-sheet/icons');
const globe = `file:///${path.join(dir, 'globe.png').replace(/\\/g, '/')}`;
const [W, H, size, cx, cy] = [1200, 630, 560, 870, 315];
const dot = size * 0.04;
const html = `<!doctype html><meta charset="utf-8"><style>
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
body{position:relative;font-family:'Segoe UI',system-ui,sans-serif;background:radial-gradient(circle at 72% 50%,#17324a 0%,#0a1520 55%,#060b11 100%)}
.glow,.globe{position:absolute;left:${cx - size / 2}px;top:${cy - size / 2}px;width:${size}px;height:${size}px;border-radius:50%}
.glow{box-shadow:0 0 ${size * 0.12}px ${size * 0.02}px rgba(120,170,210,.45)}
.dot{position:absolute;left:${cx + (mx * size) / 2 - dot / 2}px;top:${cy - (my * size) / 2 - dot / 2}px;width:${dot}px;height:${dot}px;border-radius:50%;background:#d2331f;border:4px solid #fff;box-sizing:border-box;box-shadow:0 0 10px rgba(0,0,0,.45)}
.words{position:absolute;left:72px;top:150px;width:480px;color:#fff}
h1{margin:0;font:600 84px/0.98 'Segoe UI',sans-serif;letter-spacing:-1.5px}
p{margin:30px 0 0;font:400 28px/1.35 'Segoe UI',sans-serif;color:#b4cde2}
</style>
<div class="glow"></div><img class="globe" src="${globe}"><div class="dot"></div>
<div class="words"><h1>Deep Time<br>Explorer</h1><p>Enter a place and see what it was like through geological time.</p></div>`;
const src = path.join(dir, 'og-image.html');
fs.writeFileSync(src, html);

const browser = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
].find((p) => fs.existsSync(p));
if (!browser) throw new Error(`No Edge or Chrome found. Open ${src} in a browser and save a 1200 x 630 screenshot as public/og-image.png.`);
const out = path.resolve('public/og-image.png');
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'icons-'));
fs.rmSync(out, { force: true });
spawnSync(browser, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', `--user-data-dir=${profile}`, `--screenshot=${out}`, `--window-size=${W},${H}`, `file:///${src.replace(/\\/g, '/')}`], { stdio: 'ignore', timeout: 60000 });
if (!fs.existsSync(out)) throw new Error('The browser did not write the link picture.');
for (const f of ['favicon.ico', 'apple-touch-icon.png', 'og-image.png']) console.log(`public/${f}  ${(fs.statSync(`public/${f}`).size / 1024).toFixed(0)} KB`);
