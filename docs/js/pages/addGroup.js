/**
 * addGroup.js
 * The Add Group form. Category and subcategory are chosen with touch chips
 * populated dynamically from synced categories (no hardcoded values). Submits
 * via the actions layer (optimistic UI). Never calls api.js directly.
 */

import { el, mount } from '../utils/dom.js';
import { addGroupAction } from '../actions.js';
import { Chips } from '../components/chips.js';
import { showToast } from '../components/toast.js';
import * as state from '../state.js';

export function renderAddGroup(ctx) {
  const selection = { category: '', sub: '' };
  const name = textField('Group name', 'groupName', { required: true, autofocus: true });
  const members = textField('Members (count)', 'members', { type: 'number', inputmode: 'numeric' });
  const notes = textArea('Notes', 'notes');
  const catHost = el('div', { className: 'form__field' });
  const subHost = el('div', { className: 'form__field' });
  const submit = el('button', { className: 'btn btn--primary form__submit', attrs: { type: 'submit' }, text: 'Add to queue' });

  const form = el('form', { className: 'form', attrs: { novalidate: 'novalidate' } },
    [name.field, members.field, catHost, subHost, notes.field, submit]);
  const renderChips = () => paintChips(catHost, subHost, selection, renderChips);
  form.addEventListener('submit', (event) => onSubmit(event, { name, members, notes, selection }, submit, ctx));

  const unsubscribe = state.subscribe(renderChips);
  renderChips();
  const root = el('section', { className: 'page page--add' }, [titleBar('Add Group'), form]);
  return { el: root, destroy: unsubscribe };
}

function paintChips(catHost, subHost, selection, rerender) {
  const categories = state.getCategories();
  mount(catHost, [
    el('span', { className: 'form__label', text: 'Category' }),
    Chips({
      options: categories.map((c) => c.name), selected: selection.category, ariaLabel: 'Category',
      onSelect: (value) => { selection.category = value; selection.sub = ''; rerender(); }
    })
  ]);
  const current = categories.find((c) => c.name === selection.category);
  if (current && current.subCategories.length) {
    mount(subHost, [
      el('span', { className: 'form__label', text: 'Subcategory' }),
      Chips({
        options: current.subCategories, selected: selection.sub, ariaLabel: 'Subcategory',
        onSelect: (value) => { selection.sub = value; rerender(); }
      })
    ]);
  } else {
    mount(subHost, []);
  }
}

async function onSubmit(event, fields, submit, ctx) {
  event.preventDefault();
  const payload = collect(fields);
  if (!payload.groupName) {
    showToast('Group name is required', 'warn');
    fields.name.input.focus();
    return;
  }
  setBusy(submit, true);
  await addGroupAction(payload, showToast);
  setBusy(submit, false);
  ctx.onNavigate('dashboard');
}

function collect(fields) {
  return {
    groupName: fields.name.input.value.trim(),
    members: fields.members.input.value.trim(),
    category: fields.selection.category,
    subCategory: fields.selection.sub,
    notes: fields.notes.input.value.trim()
  };
}

function setBusy(button, busy) {
  button.disabled = busy;
  button.textContent = busy ? 'Adding…' : 'Add to queue';
}

function textField(label, nameAttr, options = {}) {
  const input = el('input', { className: 'form__input', attrs: inputAttrs(nameAttr, options) });
  return { field: wrapField(label, input), input };
}

function textArea(label, nameAttr) {
  const input = el('textarea', { className: 'form__input form__input--area', attrs: { name: nameAttr, rows: '3' } });
  return { field: wrapField(label, input), input };
}

function inputAttrs(nameAttr, options) {
  const attrs = { name: nameAttr, type: options.type || 'text' };
  if (options.inputmode) { attrs.inputmode = options.inputmode; }
  if (options.required) { attrs.required = 'required'; }
  if (options.autofocus) { attrs.autofocus = 'autofocus'; }
  return attrs;
}

function wrapField(label, input) {
  return el('label', { className: 'form__field' }, [
    el('span', { className: 'form__label', text: label }),
    input
  ]);
}

function titleBar(text) {
  return el('h2', { className: 'section-title', text });
}
