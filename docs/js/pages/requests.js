/**
 * requests.js
 * Requests screen: raise a request for a group and resolve active ones. The
 * active list mirrors the global banner; both update via the sync mechanism.
 */

import { el, mount } from '../utils/dom.js';
import { createRequestAction, resolveRequestAction } from '../actions.js';
import { showToast } from '../components/toast.js';
import * as state from '../state.js';

export function renderRequests() {
  const select = el('select', { className: 'form__input', attrs: { 'aria-label': 'Group to request' } });
  const send = el('button', {
    className: 'btn btn--primary form__submit', attrs: { type: 'button' },
    text: 'Send request', on: { click: () => onSend(select) }
  });
  const list = el('div', { className: 'request-list' });
  const root = el('section', { className: 'page page--requests' }, [
    el('h2', { className: 'section-title', text: 'Requests' }),
    el('label', { className: 'form__field' }, [el('span', { className: 'form__label', text: 'Request a group' }), select]),
    send,
    el('h3', { className: 'request-list__heading', text: 'Active requests' }),
    list
  ]);
  const update = () => { fillGroupOptions(select); paintRequests(list); };
  const unsubscribe = state.subscribe(update);
  update();
  return { el: root, destroy: unsubscribe };
}

function onSend(select) {
  const id = select.value;
  if (!id) {
    showToast('Pick a group first', 'warn');
    return;
  }
  const group = state.getGroups().find((g) => String(g.ID) === id);
  if (group) {
    createRequestAction(group, showToast);
  }
}

function fillGroupOptions(select) {
  const previous = select.value;
  const groups = state.getGroups().filter((g) => String(g.CurrentStage) !== 'Completed');
  mount(select, [placeholderOption()].concat(groups.map(optionFor)));
  if (groups.some((g) => String(g.ID) === previous)) {
    select.value = previous;
  }
}

function paintRequests(list) {
  const requests = state.getRequests();
  if (requests.length === 0) {
    mount(list, el('p', { className: 'empty-state__hint', text: 'No active requests.' }));
    return;
  }
  mount(list, requests.map(requestRow));
}

function requestRow(request) {
  return el('div', { className: 'request-row' }, [
    el('span', { className: 'request-row__text', text: rowLabel(request) }),
    el('button', {
      className: 'btn btn--primary request-row__resolve', attrs: { type: 'button' },
      text: 'Resolve', on: { click: () => resolveRequestAction(request, showToast) }
    })
  ]);
}

function rowLabel(request) {
  const queue = request.QueueNo !== undefined && request.QueueNo !== '' ? 'Q' + request.QueueNo + ' · ' : '';
  return queue + (request.GroupName || 'Group');
}

function placeholderOption() {
  return el('option', { text: 'Select a group…', attrs: { value: '' } });
}

function optionFor(group) {
  return el('option', { text: 'Q' + group.QueueNo + ' · ' + group.GroupName, attrs: { value: String(group.ID) } });
}
