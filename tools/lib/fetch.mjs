// Shared download helpers for the data-build scripts.
// Every raw download is cached under data-raw/ so a rebuild does not re-fetch.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const UA = 'deep-time-explorer-build/0.1';

export async function fetchRetry(url, init = {}, tries = 4) {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { ...init, headers: { 'User-Agent': UA, ...init.headers } });
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
      return res;
    } catch (err) {
      if (attempt >= tries) throw err;
      await new Promise((r) => setTimeout(r, 2000 * attempt));
    }
  }
}

/** Fetch `url` to `file` unless it is already cached. Returns the file path. */
export async function cached(file, url, init) {
  if (!fs.existsSync(file)) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const res = await fetchRetry(url, init);
    const tmp = file + '.part';
    await pipeline(Readable.fromWeb(res.body), fs.createWriteStream(tmp));
    fs.renameSync(tmp, file);
  }
  return file;
}

/** Run `fn` over `items` with at most `limit` in flight. */
export async function pool(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: limit }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

/** Extract a zip archive into `dir` (once). Windows ships bsdtar, which reads zip. */
export function unzip(zip, dir) {
  if (fs.existsSync(dir)) return dir;
  fs.mkdirSync(dir, { recursive: true });
  execFileSync(path.join(process.env.SystemRoot, 'System32', 'tar.exe'), ['-xf', zip, '-C', dir]);
  return dir;
}
