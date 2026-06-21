/**
 * Code.gs
 * Web-app entry points. doGet handles reads; doPost handles writes via a
 * text/plain action router. Keep routing here only — logic lives in modules.
 */

/**
 * Reads. Routes on ?action= : ping | settings | sync.
 * All responses are JSON. Errors are returned, never thrown to the client.
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || 'ping';
  try {
    switch (action) {
      case 'ping':
        return ok({ pong: true, serverTime: nowIso() });
      case 'settings':
        resolveUser(params.token);
        return ok({ settings: getSettings() });
      case 'sync':
        resolveUser(params.token);
        return ok(getSync(params.since || ''));
      default:
        return fail('Unknown GET action: ' + action, 'BAD_ACTION');
    }
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * Writes. The client posts Content-Type:text/plain with a JSON body
 * { action, token, payload }. We parse it and route on action.
 * text/plain avoids a CORS preflight Apps Script cannot answer.
 */
function doPost(e) {
  var body = parseBody(e);
  if (!body) {
    return fail('Invalid or empty request body', 'BAD_BODY');
  }
  try {
    var user = resolveUser(body.token);
    switch (body.action) {
      case 'addGroup':
        return ok({ group: addGroup(user, body.payload || {}) });
      default:
        return fail('Unknown POST action: ' + body.action, 'BAD_ACTION');
    }
  } catch (err) {
    return errorResponse(err);
  }
}

/** Safely parse the text/plain JSON body. Returns null on failure. */
function parseBody(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return null;
    }
    return JSON.parse(e.postData.contents);
  } catch (err) {
    return null;
  }
}

/** Translate thrown errors into the standard failure envelope. */
function errorResponse(err) {
  var message = (err && err.message) ? err.message : String(err);
  if (message === 'UNAUTHORIZED') {
    return fail('Unknown or inactive token', 'UNAUTHORIZED');
  }
  return fail(message, 'SERVER_ERROR');
}
