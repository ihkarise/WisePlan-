/**
 * config.js
 * Central runtime configuration. After deploying the Apps Script web app, set
 * API_URL to the /exec URL and API_KEY to the shared key shown by setupSheets().
 * One shared key is used by all volunteers — there is no per-user login.
 */

export const CONFIG = {
  // Paste your Apps Script web-app deployment URL here (ends with /exec).
  API_URL: 'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE',

  // Paste the shared API key shown by setupSheets() here.
  API_KEY: 'PASTE_YOUR_SHARED_API_KEY_HERE',

  // Polling cadence: fast while the tab is visible, slower when hidden.
  SYNC_INTERVAL_MS: 5000,
  SYNC_INTERVAL_HIDDEN_MS: 15000,

  // Network resilience for a single request.
  REQUEST_TIMEOUT_MS: 12000,
  RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 600,

  // localStorage keys (namespaced to avoid collisions).
  STORAGE: {
    GROUPS: 'wef.groups',
    REQUESTS: 'wef.requests',
    SETTINGS: 'wef.settings',
    CATEGORIES: 'wef.categories',
    PENDING: 'wef.pending',
    THEME: 'wef.theme',
    LAST_SYNC: 'wef.lastSync'
  }
};

/** True when the API URL has been set to a real deployment URL. */
export function isApiConfigured() {
  return CONFIG.API_URL.indexOf('PASTE_') === -1 && CONFIG.API_URL.indexOf('http') === 0;
}
