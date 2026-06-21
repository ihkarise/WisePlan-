/**
 * theme.js
 * Dark-mode support via a single data-theme attribute on <html>. CSS variables
 * (in base.css) do the actual theming — no duplicated rules. Preference order:
 * stored manual choice, otherwise the system setting (and it follows the system
 * live until the user makes a manual choice).
 */

import { CONFIG } from '../config.js';
import { readString, writeString } from './storage.js';

const DARK = 'dark';
const LIGHT = 'light';

/** Apply the stored or system theme and start following the system setting. */
export function initTheme() {
  const stored = readString(CONFIG.STORAGE.THEME, '');
  apply(stored || systemTheme());
  watchSystem();
}

/** The theme currently applied to the document. */
export function currentTheme() {
  return document.documentElement.getAttribute('data-theme') || LIGHT;
}

/** Flip the theme, persist the manual choice, and return the new theme. */
export function toggleTheme() {
  const next = currentTheme() === DARK ? LIGHT : DARK;
  writeString(CONFIG.STORAGE.THEME, next);
  apply(next);
  return next;
}

function apply(theme) {
  document.documentElement.setAttribute('data-theme', theme === DARK ? DARK : LIGHT);
}

function systemTheme() {
  return prefersDark() ? DARK : LIGHT;
}

function prefersDark() {
  return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
}

function watchSystem() {
  if (!window.matchMedia) {
    return;
  }
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  if (!mq.addEventListener) {
    return;
  }
  mq.addEventListener('change', (event) => {
    if (!readString(CONFIG.STORAGE.THEME, '')) {
      apply(event.matches ? DARK : LIGHT);
    }
  });
}
