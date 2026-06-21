/**
 * header.js
 * Top app bar: event name, connectivity, queued-writes badge, and a dark-mode
 * toggle. Pure presentation — it receives data/callbacks and returns a node.
 */

import { el } from '../utils/dom.js';

/**
 * @param {{eventName, online, theme, onToggleTheme, pending}} props
 * @return {HTMLElement}
 */
export function Header({ eventName, online, theme, onToggleTheme, pending }) {
  const title = el('h1', { className: 'header__title', text: eventName || 'Wise EventFlow' });
  const actions = el('div', { className: 'header__actions' }, [
    pendingBadge(pending),
    statusPill(online),
    themeButton(theme, onToggleTheme)
  ]);
  return el('header', { className: 'header' }, [title, actions]);
}

function statusPill(online) {
  return el('span', {
    className: 'header__status ' + (online ? 'is-online' : 'is-offline'),
    text: online ? 'Live' : 'Offline Mode'
  });
}

function pendingBadge(pending) {
  if (!pending) {
    return null;
  }
  return el('span', { className: 'header__pending', text: pending + ' queued' });
}

function themeButton(theme, onToggleTheme) {
  const dark = theme === 'dark';
  return el('button', {
    className: 'header__theme',
    attrs: { type: 'button', 'aria-label': dark ? 'Switch to light mode' : 'Switch to dark mode' },
    text: dark ? '☀' : '☾',
    on: { click: onToggleTheme }
  });
}
