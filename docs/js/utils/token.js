/**
 * token.js
 * Token-in-URL bootstrap. On first load we read ?t=TOKEN, persist it to
 * localStorage, then strip it from the visible URL so it is not shared or
 * bookmarked. Subsequent loads use the stored token.
 */

import { CONFIG } from '../config.js';
import { readString, writeString } from './storage.js';

/**
 * Capture a token from the URL (if present), persist it, and clean the URL.
 * @return {string} the active token (may be empty if none is known yet).
 */
export function bootstrapToken() {
  const url = new URL(window.location.href);
  const fromUrl = url.searchParams.get('t');
  if (fromUrl) {
    writeString(CONFIG.STORAGE.TOKEN, fromUrl);
    stripTokenFromUrl(url);
    return fromUrl;
  }
  return readString(CONFIG.STORAGE.TOKEN, '');
}

/** Return the currently stored token. */
export function getToken() {
  return readString(CONFIG.STORAGE.TOKEN, '');
}

/** Remove ?t= from the address bar without reloading the page. */
function stripTokenFromUrl(url) {
  url.searchParams.delete('t');
  const clean = url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : '') + url.hash;
  window.history.replaceState({}, document.title, clean);
}
