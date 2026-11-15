/** Reads one shipped data file (path relative to `data/`) and returns its bytes, gunzipped if it ends in `.gz`. */
export type ReadData = (path: string) => Promise<ArrayBuffer>;

export async function readJson<T>(read: ReadData, path: string): Promise<T> {
  return JSON.parse(new TextDecoder().decode(await read(path))) as T;
}

export const browserRead: ReadData = async (path) => {
  const res = await fetch(`${import.meta.env.BASE_URL}data/${path}`);
  if (!res.ok) throw new Error(`Could not load ${path} (HTTP ${res.status})`);
  const bytes = await res.arrayBuffer();
  // Some web servers gunzip .gz files on the way out and some send them as they are,
  // so go by the gzip signature in the bytes, not by the file name.
  const head = new Uint8Array(bytes, 0, Math.min(2, bytes.byteLength));
  if (head[0] !== 0x1f || head[1] !== 0x8b) return bytes;
  return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
};
