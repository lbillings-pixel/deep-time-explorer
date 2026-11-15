// A picture shown full screen: a scene's layers or a painting, as large as the screen allows, over a black ground.
// Where the browser can hand over the whole screen it does; where it cannot (an iPhone), the picture fills the window.

/**
 * `picture` is the element to show; `ready`, if given, is called once it is in the page. `caption` is the line under it.
 * A click anywhere, the Close button or the Esc key brings the page back, with the keyboard's place returned to `opener`.
 */
export function showFullScreen(picture: HTMLElement, caption: string, opener: HTMLElement, ready?: () => void): void {
  const line = document.createElement('p');
  line.textContent = caption;
  const close = document.createElement('button');
  close.type = 'button';
  close.textContent = 'Close';

  const overlay = document.createElement('div');
  overlay.className = 'full-scene';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', `Full screen: ${caption}`);
  overlay.append(picture, line, close);

  // Opened from inside a panel that lies over the page, the picture must go inside that panel to lie over it in turn.
  const panel = opener.closest('dialog');
  const host = panel ?? document.body;
  // While the picture is up, what is behind it can be neither clicked nor reached by keyboard.
  const behind = [...host.children].filter((el): el is HTMLElement => el instanceof HTMLElement && !el.inert);
  for (const el of behind) el.inert = true;
  host.append(overlay);
  ready?.();

  const end = (): void => {
    if (!overlay.isConnected) return;
    overlay.remove();
    for (const el of behind) el.inert = false;
    document.removeEventListener('keydown', onKey);
    document.removeEventListener('fullscreenchange', onChange);
    panel?.removeEventListener('cancel', keepPanel);
    panel?.removeEventListener('close', end);
    if (document.fullscreenElement) void document.exitFullscreen();
    opener.focus({ preventScroll: true });
  };
  const onKey = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') end();
  };
  // The browser's own way out of full screen (Esc, a swipe, a system button) closes the picture too.
  const onChange = (): void => {
    if (!document.fullscreenElement) end();
  };
  // Esc closes the picture, not the panel under it.
  const keepPanel = (event: Event): void => event.preventDefault();
  overlay.addEventListener('click', (event) => {
    event.stopPropagation();
    end();
  });
  document.addEventListener('keydown', onKey);
  document.addEventListener('fullscreenchange', onChange);
  panel?.addEventListener('cancel', keepPanel);
  panel?.addEventListener('close', end);
  close.focus();
  // Refused or missing, the picture still fills the window.
  overlay.requestFullscreen?.().catch(() => {});
}
