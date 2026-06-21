/**
 * toast.js
 * Transient, non-blocking feedback. One container, auto-dismissing messages.
 * Reusable: any module passes (message, kind) where kind is
 * info | success | warn | error.
 */

import { el } from '../utils/dom.js';

const TOAST_TIMEOUT_MS = 3200;
let container = null;

/** Show a toast. Safe to call before the DOM is fully ready. */
export function showToast(message, kind = 'info') {
  const host = ensureContainer();
  const toast = el('div', { className: 'toast toast--' + kind, text: message, attrs: { role: 'status' } });
  host.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  window.setTimeout(() => dismiss(toast), TOAST_TIMEOUT_MS);
}

function dismiss(toast) {
  toast.classList.remove('toast--visible');
  window.setTimeout(() => toast.remove(), 250);
}

function ensureContainer() {
  if (!container) {
    container = el('div', { className: 'toast-host', attrs: { 'aria-live': 'polite' } });
    document.body.appendChild(container);
  }
  return container;
}
