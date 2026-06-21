/**
 * dashboard.js
 * Operations home: live stats, service toggles, debounced client-side search,
 * and the group list. Subscribes to state; all data comes from existing sync.
 */

import { el, mount } from '../utils/dom.js';
import { GroupCard } from '../components/groupCard.js';
import { StatsBar } from '../components/statsBar.js';
import { ServiceToggles } from '../components/serviceToggles.js';
import { SearchBar } from '../components/searchBar.js';
import { togglePhotographyAction, toggleFoodAction } from '../actions.js';
import { showToast } from '../components/toast.js';
import * as state from '../state.js';

export function renderDashboard() {
  let query = '';
  const statsHost = el('div', { className: 'dashboard__stats' });
  const togglesHost = el('div', { className: 'dashboard__toggles' });
  const list = el('div', { className: 'group-list' });
  const count = el('p', { className: 'dashboard__count', attrs: { 'aria-live': 'polite' } });
  const search = SearchBar({
    value: '',
    onInput: (q) => { query = q; paintList(list, count, query); },
    onClear: () => { query = ''; paintList(list, count, query); }
  });
  const root = el('section', { className: 'page page--dashboard' }, [
    el('h2', { className: 'section-title', text: 'Dashboard' }),
    statsHost, togglesHost, search, count, list
  ]);

  const update = () => {
    mount(statsHost, StatsBar(computeStats()));
    mount(togglesHost, renderToggles());
    paintList(list, count, query);
  };
  const unsubscribe = state.subscribe(update);
  update();
  return { el: root, destroy: unsubscribe };
}

function renderToggles() {
  return ServiceToggles({ settings: state.getSettings(), onToggle: onToggle });
}

function onToggle(service, open) {
  if (service === 'photography') {
    togglePhotographyAction(open, showToast);
  } else {
    toggleFoodAction(open, showToast);
  }
}

function computeStats() {
  const groups = state.getGroups();
  return {
    total: groups.length,
    photoWaiting: countBy(groups, 'PhotoStatus', 'waiting'),
    photoDone: countBy(groups, 'PhotoStatus', 'done'),
    foodWaiting: countBy(groups, 'FoodStatus', 'waiting'),
    foodDone: countBy(groups, 'FoodStatus', 'done'),
    activeRequests: state.getRequests().length
  };
}

function countBy(groups, field, value) {
  return groups.filter((g) => String(g[field]).toLowerCase() === value).length;
}

function paintList(list, count, query) {
  const groups = filterGroups(state.getGroups(), query);
  count.textContent = label(groups.length, query);
  if (groups.length === 0) {
    mount(list, emptyState(query));
    return;
  }
  mount(list, groups.map((g) => GroupCard(g)));
}

function filterGroups(groups, query) {
  if (!query) {
    return groups;
  }
  const q = query.toLowerCase();
  return groups.filter((g) => matches(g, q));
}

function matches(group, q) {
  return field(group.GroupName).indexOf(q) !== -1 ||
    field(group.Category).indexOf(q) !== -1 ||
    field(group.SubCategory).indexOf(q) !== -1;
}

function field(value) {
  return String(value || '').toLowerCase();
}

function label(n, query) {
  if (query) {
    return n === 1 ? '1 match' : n + ' matches';
  }
  return n === 1 ? '1 group in queue' : n + ' groups in queue';
}

function emptyState(query) {
  const title = query ? 'No matches' : 'No groups yet';
  const hint = query ? 'Try a different name or category.' : 'Use the Add tab to register the first arrival.';
  return el('div', { className: 'empty-state' }, [
    el('p', { className: 'empty-state__title', text: title }),
    el('p', { className: 'empty-state__hint', text: hint })
  ]);
}
