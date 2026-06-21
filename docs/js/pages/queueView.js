/**
 * queueView.js
 * Reusable queue screen shared by the Photography and Food queues. Lists groups
 * whose status field equals "Waiting" and offers a Done and a Skip action per
 * card. Photo/Food pages are thin wrappers that pass a config.
 */

import { el, mount } from '../utils/dom.js';
import { GroupCard } from '../components/groupCard.js';
import { updateStatusAction } from '../actions.js';
import { showToast } from '../components/toast.js';
import * as state from '../state.js';

/**
 * @param {{title, statusField, doneAction, skipAction, doneLabel, emptyHint}} config
 * @return {{el:HTMLElement, destroy:Function}}
 */
export function renderQueue(config) {
  const list = el('div', { className: 'group-list' });
  const count = el('p', { className: 'dashboard__count', attrs: { 'aria-live': 'polite' } });
  const root = el('section', { className: 'page page--queue' }, [
    el('h2', { className: 'section-title', text: config.title }),
    count,
    list
  ]);
  const update = () => paint(list, count, config);
  const unsubscribe = state.subscribe(update);
  update();
  return { el: root, destroy: unsubscribe };
}

function paint(list, count, config) {
  const groups = waitingGroups(config.statusField);
  count.textContent = groups.length === 1 ? '1 group waiting' : groups.length + ' groups waiting';
  if (groups.length === 0) {
    mount(list, emptyState(config.emptyHint));
    return;
  }
  mount(list, groups.map((group) => GroupCard(group, actionsFor(group, config))));
}

function waitingGroups(statusField) {
  return state.getGroups().filter((g) => String(g[statusField]).toLowerCase() === 'waiting');
}

function actionsFor(group, config) {
  return [
    { label: config.doneLabel, kind: 'primary', onClick: () => updateStatusAction(config.doneAction, group, showToast) },
    { label: 'Skip', kind: 'ghost', onClick: () => updateStatusAction(config.skipAction, group, showToast) }
  ];
}

function emptyState(hint) {
  return el('div', { className: 'empty-state' }, [
    el('p', { className: 'empty-state__title', text: 'All clear' }),
    el('p', { className: 'empty-state__hint', text: hint })
  ]);
}
