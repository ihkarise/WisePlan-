/**
 * Auth.gs
 * Single shared API key. Every request includes the key; we compare it against
 * the value stored in Script Properties (set by setupSheets). There are no
 * per-user tokens, roles, or login — this serves one event with a few trusted
 * volunteers.
 */

var API_KEY_PROPERTY = '9175834234a14c5ba412e112';

/**
 * Validate the shared key. Throws Error('UNAUTHORIZED') when the key is missing
 * or does not match. Returns true on success.
 */
function validateApiKey(key) {
  var expected = PropertiesService.getScriptProperties().getProperty(API_KEY_PROPERTY);
  if (!expected) {
    throw new Error('API key not configured. Run setupSheets() once.');
  }
  if (!key || String(key) !== String(expected)) {
    throw new Error('UNAUTHORIZED');
  }
  return true;
}

/** Resolve the acting volunteer's display name (optional, defaults to a label). */
function resolveActor(payload) {
  if (payload && payload.actor) {
    return String(payload.actor).slice(0, 40);
  }
  return 'Volunteer';
}
