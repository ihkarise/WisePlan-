/**
 * groupCard.js
 * Renders a single group as a card: queue number, name, members, and photo/food
 * status chips. Pure presentation — receives a group object, returns a node.
 */

import { el } from '../utils/dom.js';

/**
 * @param {Object} group a serialized Groups row.
 * @return {HTMLElement}
 */
export function GroupCard(group) {
  const card = el('article', {
    className: 'group-card' + (group._optimistic ? ' is-pending' : ''),
    dataset: { id: group.ID }
  }, [
    queueBadge(group.QueueNo),
    body(group)
  ]);
  return card;
}

function queueBadge(queueNo) {
  return el('div', { className: 'group-card__queue' }, [
    el('span', { className: 'group-card__queue-label', text: 'Q' }),
    el('span', { className: 'group-card__queue-no', text: queueNo == null ? '—' : String(queueNo) })
  ]);
}

function body(group) {
  return el('div', { className: 'group-card__body' }, [
    el('h3', { className: 'group-card__name', text: group.GroupName || 'Unnamed group' }),
    meta(group),
    chips(group)
  ]);
}

function meta(group) {
  const parts = [];
  if (group.Members) {
    parts.push(group.Members + (Number(group.Members) === 1 ? ' member' : ' members'));
  }
  if (group.Category) {
    parts.push(group.Category);
  }
  return el('p', { className: 'group-card__meta', text: parts.join(' · ') || '—' });
}

function chips(group) {
  return el('div', { className: 'group-card__chips' }, [
    statusChip('Photo', group.PhotoStatus),
    statusChip('Food', group.FoodStatus)
  ]);
}

function statusChip(label, status) {
  const value = status || 'Pending';
  const kind = value.toLowerCase() === 'done' ? 'done' : 'pending';
  return el('span', { className: 'chip chip--' + kind, text: label + ': ' + value });
}
