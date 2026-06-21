/**
 * addGroup.js
 * The Add Group form. Collects fields, submits via the actions layer (optimistic
 * UI), and returns to the dashboard. Never calls api.js directly.
 */

import { el } from '../utils/dom.js';
import { addGroupAction } from '../actions.js';
import { showToast } from '../components/toast.js';

/**
 * @param {{onNavigate:(route:string)=>void}} ctx
 * @return {{el:HTMLElement, destroy:Function}}
 */
export function renderAddGroup(ctx) {
  const name = textField('Group name', 'groupName', { required: true, autofocus: true });
  const members = textField('Members (count)', 'members', { type: 'number', inputmode: 'numeric' });
  const category = textField('Category', 'category', { placeholder: 'e.g. Bride side' });
  const notes = textArea('Notes', 'notes');
  const submit = el('button', {
    className: 'btn btn--primary form__submit', attrs: { type: 'submit' }, text: 'Add to queue'
  });

  const form = el('form', { className: 'form', attrs: { novalidate: 'novalidate' } },
    [name.field, members.field, category.field, notes.field, submit]);
  form.addEventListener('submit', (event) => onSubmit(event, { name, members, category, notes }, submit, ctx));

  const root = el('section', { className: 'page page--add' }, [titleBar('Add Group'), form]);
  return { el: root, destroy: () => {} };
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
    category: fields.category.input.value.trim(),
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
  if (options.placeholder) { attrs.placeholder = options.placeholder; }
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
