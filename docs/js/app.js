/**
 * app.js
 * Composition root: wires token bootstrap, shell rendering, routing, sync, and
 * the service worker. The only file that knows about all layers at once.
 */

import { isApiConfigured } from './config.js';
import { bootstrapToken, getToken } from './utils/token.js';
import { el, mount } from './utils/dom.js';
import { Header } from './components/header.js';
import { BottomNav } from './components/bottomNav.js';
import { showToast } from './components/toast.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAddGroup } from './pages/addGroup.js';
import { startSync } from './sync.js';
import * as state from './state.js';

const ROUTES = { dashboard: renderDashboard, add: renderAddGroup };

const shell = {
  header: document.getElementById('app-header'),
  view: document.getElementById('app-view'),
  nav: document.getElementById('app-nav')
};

let route = 'dashboard';
let current = null;

function start() {
  bootstrapToken();
  if (!getToken()) {
    return showBlockingMessage('Sign-in link required', 'Open the app using the link with your access token (…?t=…).');
  }
  if (!isApiConfigured()) {
    showToast('Set API_URL in config.js to connect', 'warn');
  }
  state.subscribe(renderShell);
  renderShell();
  navigate('dashboard');
  startSync(showToast);
  registerServiceWorker();
}

/** Render header + nav from current state. The view is owned by the router. */
function renderShell() {
  const settings = state.getSettings();
  mount(shell.header, Header({
    eventName: settings ? settings.EventName : 'Wise EventFlow',
    online: state.isOnline()
  }));
  mount(shell.nav, BottomNav({ active: route, onNavigate: navigate }));
}

/** Switch pages: tear down the old one, mount the new one. */
function navigate(next) {
  if (!ROUTES[next]) {
    return;
  }
  route = next;
  if (current && current.destroy) {
    current.destroy();
  }
  current = ROUTES[route]({ onNavigate: navigate });
  mount(shell.view, current.el);
  renderShell();
  shell.view.scrollTop = 0;
}

function showBlockingMessage(title, detail) {
  mount(shell.view, el('div', { className: 'blocking' }, [
    el('h2', { className: 'blocking__title', text: title }),
    el('p', { className: 'blocking__detail', text: detail })
  ]));
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // PWA install is a progressive enhancement; ignore failures.
    });
  }
}

start();
