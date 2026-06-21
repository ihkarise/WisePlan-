/**
 * chips.js
 * Touch-friendly single-select chip group with horizontal scroll. Tapping the
 * selected chip clears it. Pure presentation: receives options + callback.
 */

import { el } from '../utils/dom.js';

/**
 * @param {{options:string[], selected:string, onSelect:(v:string)=>void, ariaLabel:string}} props
 * @return {HTMLElement}
 */
export function Chips({ options, selected, onSelect, ariaLabel }) {
  return el('div', { className: 'chips', attrs: { role: 'group', 'aria-label': ariaLabel || 'Choose one' } },
    options.map((value) => chip(value, selected, onSelect)));
}

function chip(value, selected, onSelect) {
  const active = value === selected;
  return el('button', {
    className: 'chip-btn' + (active ? ' is-selected' : ''),
    attrs: { type: 'button', 'aria-pressed': active ? 'true' : 'false' },
    text: value,
    on: { click: () => onSelect(active ? '' : value) }
  });
}
