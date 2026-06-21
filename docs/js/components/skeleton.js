/**
 * skeleton.js
 * Loading placeholders shown before the first sync completes. Mirrors the group
 * card shape so the layout does not jump when real data arrives.
 */

import { el } from '../utils/dom.js';

const DEFAULT_ROWS = 4;

/** @param {number} [count] @return {HTMLElement} */
export function SkeletonList(count) {
  const rows = [];
  const total = count || DEFAULT_ROWS;
  for (let i = 0; i < total; i++) {
    rows.push(skeletonCard());
  }
  return el('div', { className: 'group-list', attrs: { 'aria-hidden': 'true' } }, rows);
}

function skeletonCard() {
  return el('div', { className: 'skeleton-card' }, [
    el('div', { className: 'skeleton skeleton--badge' }),
    el('div', { className: 'skeleton-card__body' }, [
      el('div', { className: 'skeleton skeleton--line' }),
      el('div', { className: 'skeleton skeleton--line skeleton--short' })
    ])
  ]);
}
