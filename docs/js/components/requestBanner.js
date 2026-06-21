/**
 * requestBanner.js
 * Fixed banner listing active requests across every screen. Pure presentation:
 * it receives the active requests and a resolve callback, and returns a node.
 */

import { el } from '../utils/dom.js';

/**
 * @param {{requests:Array, onResolve:(request:Object)=>void}} props
 * @return {HTMLElement}
 */
export function RequestBanner({ requests, onResolve }) {
  if (!requests || requests.length === 0) {
    return el('div', { className: 'request-banner is-empty' });
  }
  return el('div', { className: 'request-banner', attrs: { role: 'alert' } },
    requests.map((request) => bannerItem(request, onResolve)));
}

function bannerItem(request, onResolve) {
  return el('div', { className: 'request-banner__item' }, [
    el('span', { className: 'request-banner__text', text: bannerLabel(request) }),
    el('button', {
      className: 'btn btn--light request-banner__resolve',
      attrs: { type: 'button' },
      text: 'Resolve',
      on: { click: () => onResolve(request) }
    })
  ]);
}

function bannerLabel(request) {
  const queue = request.QueueNo !== undefined && request.QueueNo !== '' ? 'Q' + request.QueueNo + ' · ' : '';
  return '🔔 ' + queue + (request.GroupName || 'Group') + ' requested';
}
