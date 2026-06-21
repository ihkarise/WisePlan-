/**
 * header.js
 * Top app bar: event name plus a live connectivity dot. Pure presentation —
 * it receives data and returns a node.
 */

import { el } from '../utils/dom.js';

/**
 * @param {{eventName:string, online:boolean}} props
 * @return {HTMLElement}
 */
export function Header({ eventName, online }) {
  const status = el('span', {
    className: 'header__status ' + (online ? 'is-online' : 'is-offline'),
    attrs: { title: online ? 'Online' : 'Offline' },
    text: online ? 'Live' : 'Offline'
  });
  const title = el('h1', { className: 'header__title', text: eventName || 'Wise EventFlow' });
  return el('header', { className: 'header' }, [title, status]);
}
