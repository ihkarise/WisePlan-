/**
 * serviceToggles.js
 * Photography and Food open/closed switches. Pure presentation: receives the
 * settings and an onToggle callback (service, nextOpen).
 */

import { el } from '../utils/dom.js';

/**
 * @param {{settings:Object, onToggle:(service:string, open:boolean)=>void}} props
 * @return {HTMLElement}
 */
export function ServiceToggles({ settings, onToggle }) {
  const s = settings || {};
  return el('div', { className: 'toggles' }, [
    toggle('Photography', !!s.PhotographyOpen, (next) => onToggle('photography', next)),
    toggle('Food', !!s.FoodOpen, (next) => onToggle('food', next))
  ]);
}

function toggle(label, open, onChange) {
  return el('div', { className: 'toggle' }, [
    el('span', { className: 'toggle__label', text: label }),
    el('button', {
      className: 'btn toggle__btn ' + (open ? 'btn--success' : 'btn--ghost'),
      attrs: { type: 'button', 'aria-pressed': open ? 'true' : 'false' },
      text: open ? 'OPEN' : 'CLOSED',
      on: { click: () => onChange(!open) }
    })
  ]);
}
