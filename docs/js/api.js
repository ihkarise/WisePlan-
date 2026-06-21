/**
 * api.js
 * The ONLY module that talks to the backend. Reads use GET query params;
 * writes use POST with Content-Type:text/plain and a { action, key, payload }
 * body so Apps Script does not receive a CORS preflight. Every call handles
 * network failure, invalid responses, and retries idempotent reads.
 */

import { CONFIG, isApiConfigured } from './config.js';

/** Thrown for any API failure; carries a user-friendly message and a code. */
export class ApiError extends Error {
  constructor(message, code) {
    super(message);
    this.name = 'ApiError';
    this.code = code || 'ERROR';
  }
}

/** Delta sync: pass the last server timestamp the client saw. */
export async function fetchSync(since) {
  return getJson({ action: 'sync', since: since || '' }, { retry: true });
}

/** Create a group. Write path — not retried to avoid duplicate rows. */
export async function addGroup(payload) {
  const data = await postJson('addGroup', payload);
  return data.group;
}

/** Advance a group's photo/food status. Returns the updated group. */
export async function updateGroupStatus(action, groupId) {
  const data = await postJson(action, { groupId });
  return data.group;
}

/** Raise a request for a group. Returns the created request. */
export async function requestGroup(groupId) {
  const data = await postJson('requestGroup', { groupId });
  return data.request;
}

/** Resolve an active request. Returns the updated request. */
export async function resolveRequest(requestId) {
  const data = await postJson('resolveRequest', { requestId });
  return data.request;
}

/** Open/close photography. Returns the updated settings. */
export async function togglePhotography(open) {
  const data = await postJson('togglePhotography', { open });
  return data.settings;
}

/** Open/close food service. Returns the updated settings. */
export async function toggleFood(open) {
  const data = await postJson('toggleFood', { open });
  return data.settings;
}

/** Build the GET URL with action, key, and extra params. */
function buildUrl(params) {
  const url = new URL(CONFIG.API_URL);
  url.searchParams.set('key', CONFIG.API_KEY);
  Object.keys(params).forEach((key) => url.searchParams.set(key, params[key]));
  return url.toString();
}

/** Perform a GET request, optionally retrying transient network failures. */
async function getJson(params, options = {}) {
  assertConfigured();
  const url = buildUrl(params);
  const attempts = options.retry ? CONFIG.RETRY_ATTEMPTS : 1;
  return withRetry(attempts, () => request(url, { method: 'GET' }));
}

/** Perform a POST write with the text/plain envelope. Never auto-retried. */
async function postJson(action, payload) {
  assertConfigured();
  const body = JSON.stringify({ action, key: CONFIG.API_KEY, payload: payload || {} });
  return request(CONFIG.API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body
  });
}

/** Single fetch with timeout, JSON parsing, and envelope checking. */
async function request(url, init) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, Object.assign({ signal: controller.signal }, init));
    if (!response.ok) {
      throw new ApiError('Server returned ' + response.status, 'HTTP_' + response.status);
    }
    return parseEnvelope(await response.text());
  } catch (err) {
    throw normalizeError(err);
  } finally {
    clearTimeout(timer);
  }
}

/** Parse and validate the { ok, ... } JSON envelope. */
function parseEnvelope(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (err) {
    throw new ApiError('Unexpected server response', 'BAD_JSON');
  }
  if (!data || data.ok !== true) {
    throw new ApiError(data && data.error ? data.error : 'Request failed', data && data.code);
  }
  return data;
}

/** Retry a request factory with exponential backoff. */
async function withRetry(attempts, factory) {
  let lastError;
  for (let i = 0; i < attempts; i++) {
    try {
      return await factory();
    } catch (err) {
      lastError = err;
      if (!isRetryable(err) || i === attempts - 1) {
        break;
      }
      await delay(CONFIG.RETRY_BASE_DELAY_MS * Math.pow(2, i));
    }
  }
  throw lastError;
}

/** Only network/timeout errors are worth retrying; auth/validation are not. */
function isRetryable(err) {
  return err instanceof ApiError && (err.code === 'NETWORK' || err.code === 'TIMEOUT');
}

/** Convert raw fetch failures into a friendly ApiError. */
function normalizeError(err) {
  if (err instanceof ApiError) {
    return err;
  }
  if (err && err.name === 'AbortError') {
    return new ApiError('The request timed out', 'TIMEOUT');
  }
  return new ApiError('Network problem — check your connection', 'NETWORK');
}

function assertConfigured() {
  if (!isApiConfigured()) {
    throw new ApiError('App not configured: set API_URL in config.js', 'NO_CONFIG');
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
