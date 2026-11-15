// The visitor's settings: appearance, scene motion, full-screen scenes and the globe's colors.
// Each is kept on the visitor's own device, and nowhere else. If the browser blocks that storage,
// a choice lasts only for the visit.

import { PALETTES } from './globe/render';

export interface Settings {
  /** 'auto' follows the device's own light or dark setting. */
  theme: 'light' | 'dark' | 'auto';
  /** Whether scenes move. Off to begin with on a device that asks for reduced motion. */
  motion: boolean;
  /** Whether a click on a scene's picture, or on a painting, shows it full screen. */
  fullscreen: boolean;
  /** The globe's colors: 'random' picks one of the palettes each time the page is opened; '1', '2' and so on name one. */
  globe: string;
}

function stored(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

const theme = stored('theme');
const globe = stored('globe');

export const settings: Settings = {
  theme: theme === 'dark' || theme === 'auto' ? theme : 'light',
  motion: (stored('motion') ?? (matchMedia('(prefers-reduced-motion: reduce)').matches ? 'off' : 'on')) === 'on',
  fullscreen: stored('fullscreen') === 'on',
  globe: globe && PALETTES[Number(globe) - 1] ? globe : 'random',
};

const listeners: ((key: keyof Settings) => void)[] = [];

/** Calls `fn` after any setting changes, with the name of the one that did. */
export function onSetting(fn: (key: keyof Settings) => void): void {
  listeners.push(fn);
}

const DARK = matchMedia('(prefers-color-scheme: dark)');

// The same rule is applied by a few lines in the head of each page, before anything is drawn, so that a dark page never flashes light.
function applyTheme(): void {
  const dark = settings.theme === 'dark' || (settings.theme === 'auto' && DARK.matches);
  if (dark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
}
DARK.addEventListener('change', applyTheme);
applyTheme();

export function setSetting<K extends keyof Settings>(key: K, value: Settings[K]): void {
  if (settings[key] === value) return;
  settings[key] = value;
  try {
    localStorage.setItem(key, typeof value === 'boolean' ? (value ? 'on' : 'off') : value);
  } catch {
    // Storage can be blocked; the choice then lasts only for this visit.
  }
  if (key === 'theme') applyTheme();
  sync();
  for (const fn of listeners) fn(key);
}

// ---------- the menu ----------

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string> = {}, ...children: (Node | string)[]): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
  node.append(...children);
  return node;
}

let dialog: HTMLDialogElement | undefined;

/** Brings the menu's controls into line with the settings, which can also change outside it (the pause button under a scene). */
function sync(): void {
  if (!dialog) return;
  for (const input of dialog.querySelectorAll('input')) {
    const value = settings[input.name as keyof Settings];
    input.checked = input.type === 'checkbox' ? value === true : value === input.value;
  }
}

function choice<K extends 'theme' | 'globe'>(name: K, legend: string, options: [value: Settings[K], label: string][], hint?: string): HTMLElement {
  return el(
    'fieldset',
    {},
    el('legend', {}, legend),
    ...options.map(([value, label]) => {
      const input = el('input', { type: 'radio', name, value });
      input.addEventListener('change', () => setSetting(name, value));
      return el('label', {}, input, ` ${label}`);
    }),
    ...(hint ? [el('p', { class: 'hint' }, hint)] : []),
  );
}

function toggle(name: 'motion' | 'fullscreen', legend: string, label: string, hint: string): HTMLElement {
  const input = el('input', { type: 'checkbox', name });
  input.addEventListener('change', () => setSetting(name, input.checked));
  return el('fieldset', {}, el('legend', {}, legend), el('label', {}, input, ` ${label}`), el('p', { class: 'hint' }, hint));
}

function build(): HTMLDialogElement {
  const close = el('button', { type: 'button' }, 'Done');
  const box = el(
    'dialog',
    { class: 'settings', 'aria-labelledby': 'settings-title' },
    // Done stands at the top and stays there as the menu is scrolled: at the foot, a phone's own bars can cover it.
    el('div', { class: 'bar' }, el('h2', { id: 'settings-title' }, 'Settings'), close),
    choice('theme', 'Appearance', [
      ['light', 'Light'],
      ['dark', 'Dark'],
      ['auto', 'Same as this device'],
    ]),
    toggle('motion', 'Motion', 'Scenes move gently', 'Only the scene of an open chapter moves. The same choice is under each scene, as "Pause motion".'),
    toggle('fullscreen', 'Full-screen pictures', 'A click on a scene or a painting shows it full screen', 'A click on the picture, or the Esc key, brings the page back. With this off, a click on a scene opens its chapter. Either way, "Full screen" under an open scene or a painting does the same.'),
    choice('globe', 'Globe colors', [['random', 'A different set each visit'], ...PALETTES.map((p, i): [string, string] => [String(i + 1), p.name])]),
    el('p', { class: 'hint' }, 'Each choice takes effect at once and is kept on this device only.'),
  );
  close.addEventListener('click', () => box.close());
  // A click on the dimmed page around the menu closes it.
  box.addEventListener('click', (event) => {
    const r = box.getBoundingClientRect();
    if (event.target === box && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) box.close();
  });
  document.body.append(box);
  return box;
}

export function openSettings(): void {
  dialog ??= build();
  sync();
  dialog.showModal();
}
