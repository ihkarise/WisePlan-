/**
 * groupCard.js
 * Renders a single group as a card: queue number, name, members, and photo/food
 * status chips. Pure presentation — receives a group object, returns a node.
 */

import { el } from '../utils/dom.js';

/**
 * @param {Object} group a serialized Groups row.
 * @param {Array<{label:string, kind?:string, onClick:Function}>} [actions]
 * @return {HTMLElement}
 */
export function GroupCard(group, actions = []) {
  return el('article', {
    className: 'group-card' + (group._optimistic ? ' is-pending' : ''),
    dataset: { id: group.ID }
  }, [
    queueBadge(group.QueueNo),
    body(group, actions)
  ]);
}

function queueBadge(queueNo) {
  return el('div', { className: 'group-card__queue' }, [
    el('span', { className: 'group-card__queue-label', text: 'Q' }),
    el('span', { className: 'group-card__queue-no', text: queueNo == null ? '—' : String(queueNo) })
  ]);
}

function body(group, actions) {
  const children = [
    el('h3', { className: 'group-card__name', text: group.GroupName || 'Unnamed group' }),
    meta(group),
    chips(group)
  ];
  if (actions && actions.length) {
    children.push(actionRow(actions));
  }
  return el('div', { className: 'group-card__body' }, children);
}

function actionRow(actions) {
  return el('div', { className: 'group-card__actions' }, actions.map(actionButton));
}

function actionButton(action) {
  const attrs = { type: 'button' };
  if (action.disabled) {
    attrs.disabled = 'disabled';
  }
  return el('button', {
    className: 'btn btn--' + (action.kind || 'ghost') + ' group-card__action',
    attrs: attrs,
    text: action.label,
    on: { click: action.disabled ? () => {} : action.onClick }
  });
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
  return el('span', { className: 'chip chip--' + chipKind(value), text: label + ': ' + value });
}

function chipKind(value) {
  const v = value.toLowerCase();
  if (v === 'done') {
    return 'done';
  }
  if (v === 'waiting') {
    return 'waiting';
  }
  if (v === 'skipped') {
    return 'skipped';
  }
  return 'pending';
}
