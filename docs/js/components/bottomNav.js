/**
 * bottomNav.js
 * Fixed bottom navigation with large touch targets. Emits route changes via a
 * callback; it does not know about pages or state directly.
 */

import { el } from '../utils/dom.js';

const ITEMS = [
  { route: 'dashboard', label: 'Dashboard', icon: '▤' },
  { route: 'add', label: 'Add Group', icon: '＋' }
];

/**
 * @param {{active:string, onNavigate:(route:string)=>void}} props
 * @return {HTMLElement}
 */
export function BottomNav({ active, onNavigate }) {
  const buttons = ITEMS.map((item) => navButton(item, active, onNavigate));
  return el('nav', { className: 'bottom-nav', attrs: { 'aria-label': 'Primary' } }, buttons);
}

function navButton(item, active, onNavigate) {
  const isActive = item.route === active;
  return el('button', {
    className: 'bottom-nav__item' + (isActive ? ' is-active' : ''),
    attrs: { type: 'button', 'aria-current': isActive ? 'page' : 'false' },
    on: { click: () => onNavigate(item.route) }
  }, [
    el('span', { className: 'bottom-nav__icon', text: item.icon, attrs: { 'aria-hidden': 'true' } }),
    el('span', { className: 'bottom-nav__label', text: item.label })
  ]);
}
