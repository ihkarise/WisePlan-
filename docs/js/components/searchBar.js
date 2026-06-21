/**
 * searchBar.js
 * Debounced search input with a clear button. Filtering happens client-side in
 * the page; this component only debounces keystrokes and emits the query.
 */

import { el } from '../utils/dom.js';

const DEBOUNCE_MS = 300;

/**
 * @param {{value:string, onInput:(q:string)=>void, onClear:()=>void}} props
 * @return {HTMLElement}
 */
export function SearchBar({ value, onInput, onClear }) {
  let timer = null;
  const input = el('input', {
    className: 'search-bar__input',
    attrs: { type: 'search', placeholder: 'Search groups…', 'aria-label': 'Search groups', value: value || '' }
  });
  input.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => onInput(input.value.trim()), DEBOUNCE_MS);
  });
  const clear = el('button', {
    className: 'search-bar__clear',
    attrs: { type: 'button', 'aria-label': 'Clear search' },
    text: '✕',
    on: { click: () => { input.value = ''; clearTimeout(timer); onClear(); input.focus(); } }
  });
  return el('div', { className: 'search-bar' }, [input, clear]);
}
