/**
 * announcementBanner.js
 * Fixed top banner showing the event announcement. Hidden when empty. The CSS
 * animates it in when present (smooth transition on mount).
 */

import { el } from '../utils/dom.js';

/**
 * @param {{text:string}} props
 * @return {HTMLElement}
 */
export function AnnouncementBanner({ text }) {
  const message = (text || '').trim();
  if (!message) {
    return el('div', { className: 'announce is-empty' });
  }
  return el('div', { className: 'announce', attrs: { role: 'status' } }, [
    el('span', { className: 'announce__icon', text: '📣', attrs: { 'aria-hidden': 'true' } }),
    el('span', { className: 'announce__text', text: message })
  ]);
}
