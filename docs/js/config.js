/**
 * config.js
 * Central runtime configuration. Set API_URL once after deploying the Apps
 * Script web app (Deploy > New deployment > Web app > copy the /exec URL).
 */

export const CONFIG = {
  // Paste your Apps Script web-app deployment URL here (ends with /exec).
  API_URL: 'PASTE_YOUR_APPS_SCRIPT_EXEC_URL_HERE',

  // Polling cadence: fast while the tab is visible, slower when hidden.
  SYNC_INTERVAL_MS: 5000,
  SYNC_INTERVAL_HIDDEN_MS: 15000,

  // Network resilience for a single request.
  REQUEST_TIMEOUT_MS: 12000,
  RETRY_ATTEMPTS: 3,
  RETRY_BASE_DELAY_MS: 600,

  // localStorage keys (namespaced to avoid collisions).
  STORAGE: {
    TOKEN: 'wef.token',
    GROUPS: 'wef.groups',
    SETTINGS: 'wef.settings',
    LAST_SYNC: 'wef.lastSync'
  }
};

/** True when the API URL still holds its placeholder value. */
export function isApiConfigured() {
  return CONFIG.API_URL.indexOf('PASTE_') === -1 && CONFIG.API_URL.indexOf('http') === 0;
}
