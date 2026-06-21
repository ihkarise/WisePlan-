/**
 * dom.js
 * Tiny DOM helpers so components can build markup without inline HTML strings
 * or innerHTML. Keeps rendering declarative and XSS-safe (text is set via
 * textContent, never interpolated into HTML).
 */

/**
 * Create an element.
 * @param {string} tag
 * @param {Object} [props] className, text, attrs, dataset, on (event map).
 * @param {Array<Node|string>} [children]
 */
export function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  if (props.className) {
    node.className = props.className;
  }
  if (props.text != null) {
    node.textContent = String(props.text);
  }
  applyAttrs(node, props.attrs);
  applyDataset(node, props.dataset);
  applyEvents(node, props.on);
  appendChildren(node, children);
  return node;
}

function applyAttrs(node, attrs) {
  if (!attrs) {
    return;
  }
  Object.keys(attrs).forEach((key) => node.setAttribute(key, attrs[key]));
}

function applyDataset(node, dataset) {
  if (!dataset) {
    return;
  }
  Object.keys(dataset).forEach((key) => {
    node.dataset[key] = dataset[key];
  });
}

function applyEvents(node, on) {
  if (!on) {
    return;
  }
  Object.keys(on).forEach((event) => node.addEventListener(event, on[event]));
}

function appendChildren(node, children) {
  const list = Array.isArray(children) ? children : [children];
  list.forEach((child) => {
    if (child == null) {
      return;
    }
    node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
  });
}

/** Remove all children of a node. */
export function clear(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}

/** Replace the contents of a node with a single child (or list). */
export function mount(node, content) {
  clear(node);
  appendChildren(node, content);
}
