/**
 * storage.js
 * Thin, safe wrapper over localStorage with JSON serialization. All access to
 * persistent storage goes through here so failures are handled in one place.
 */

/** Read and parse a JSON value, returning fallback on any error. */
export function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

/** Serialize and store a value. Returns true on success. */
export function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    return false;
  }
}

/** Read a raw string value (no JSON parsing). */
export function readString(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? (fallback || '') : raw;
  } catch (err) {
    return fallback || '';
  }
}

/** Store a raw string value. */
export function writeString(key, value) {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    return false;
  }
}
