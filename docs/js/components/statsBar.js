/**
 * statsBar.js
 * Read-only dashboard stat cards. Pure presentation: receives a stats object
 * (computed from existing sync data) and returns a node. No API calls.
 */

import { el } from '../utils/dom.js';

/**
 * @param {{total, photoWaiting, photoDone, foodWaiting, foodDone, activeRequests}} stats
 * @return {HTMLElement}
 */
export function StatsBar(stats) {
  const cards = [
    ['Groups', stats.total],
    ['Photo Waiting', stats.photoWaiting],
    ['Photo Done', stats.photoDone],
    ['Food Waiting', stats.foodWaiting],
    ['Food Done', stats.foodDone],
    ['Requests', stats.activeRequests]
  ];
  return el('div', { className: 'stats' }, cards.map(statCard));
}

function statCard(entry) {
  return el('div', { className: 'stats__card' }, [
    el('span', { className: 'stats__value', text: String(entry[1]) }),
    el('span', { className: 'stats__label', text: entry[0] })
  ]);
}
