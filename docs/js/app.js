/**
 * app.js
 * Composition root: wires shell rendering, routing, the request banner, sync,
 * and the service worker. The only file that knows about all layers at once.
 */

import { isApiConfigured } from './config.js';
import { mount } from './utils/dom.js';
import { Header } from './components/header.js';
import { BottomNav } from './components/bottomNav.js';
import { RequestBanner } from './components/requestBanner.js';
import { showToast } from './components/toast.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderAddGroup } from './pages/addGroup.js';
import { renderPhotoQueue } from './pages/photoQueue.js';
import { renderFoodQueue } from './pages/foodQueue.js';
import { renderRequests } from './pages/requests.js';
import { startSync } from './sync.js';
import { resolveRequestAction } from './actions.js';
import * as state from './state.js';

const ROUTES = {
  dashboard: renderDashboard,
  photo: renderPhotoQueue,
  food: renderFoodQueue,
  requests: renderRequests,
  add: renderAddGroup
};

const shell = {
  header: document.getElementById('app-header'),
  banner: document.getElementById('app-banner'),
  view: document.getElementById('app-view'),
  nav: document.getElementById('app-nav')
};

let route = 'dashboard';
let current = null;

function start() {
  if (!isApiConfigured()) {
    showToast('Set API_URL and API_KEY in config.js to connect', 'warn');
  }
  state.subscribe(renderShell);
  renderShell();
  navigate('dashboard');
  startSync(showToast);
  registerServiceWorker();
}

/** Render header, banner, and nav from current state. View is owned by routing. */
function renderShell() {
  const settings = state.getSettings();
  mount(shell.header, Header({
    eventName: settings ? settings.EventName : 'Wise EventFlow',
    online: state.isOnline()
  }));
  mount(shell.banner, RequestBanner({
    requests: state.getRequests(),
    onResolve: (request) => resolveRequestAction(request, showToast)
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

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // PWA install is a progressive enhancement; ignore failures.
    });
  }
}

start();
