/**
 * dashboard.js
 * Live group list. Subscribes to state and re-renders the list on every change
 * (sync delta, optimistic add). Reads from cache so it works offline.
 */

import { el, mount } from '../utils/dom.js';
import { GroupCard } from '../components/groupCard.js';
import * as state from '../state.js';

/**
 * @param {{onNavigate:(route:string)=>void}} ctx
 * @return {{el:HTMLElement, destroy:Function}}
 */
export function renderDashboard(ctx) {
  const list = el('div', { className: 'group-list' });
  const count = el('p', { className: 'dashboard__count', attrs: { 'aria-live': 'polite' } });
  const root = el('section', { className: 'page page--dashboard' }, [
    sectionTitle('Groups'),
    count,
    list,
    addButton(ctx)
  ]);

  const update = () => paint(list, count);
  const unsubscribe = state.subscribe(update);
  update();

  return { el: root, destroy: unsubscribe };
}

function paint(list, count) {
  const groups = state.getGroups();
  count.textContent = groups.length === 1 ? '1 group in queue' : groups.length + ' groups in queue';
  if (groups.length === 0) {
    mount(list, emptyState());
    return;
  }
  mount(list, groups.map(GroupCard));
}

function emptyState() {
  return el('div', { className: 'empty-state' }, [
    el('p', { className: 'empty-state__title', text: 'No groups yet' }),
    el('p', { className: 'empty-state__hint', text: 'Tap “Add Group” to register the first arrival.' })
  ]);
}

function addButton(ctx) {
  return el('button', {
    className: 'btn btn--primary dashboard__add',
    attrs: { type: 'button' },
    text: '＋ Add Group',
    on: { click: () => ctx.onNavigate('add') }
  });
}

function sectionTitle(text) {
  return el('h2', { className: 'section-title', text });
}
