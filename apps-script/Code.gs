/**
 * Code.gs
 * Web-app entry points. doGet handles reads; doPost handles writes via a
 * text/plain action router. Every request carries the shared API key, which is
 * validated before any work. Keep routing here only — logic lives in modules.
 */

/**
 * Reads. Routes on ?action= : ping | settings | sync.
 * All responses are JSON. Errors are returned, never thrown to the client.
 */
function doGet(e) {
  var params = (e && e.parameter) ? e.parameter : {};
  var action = params.action || 'ping';
  try {
    if (action === 'ping') {
      return ok({ pong: true, serverTime: nowIso() });
    }
    validateApiKey(params.key);
    switch (action) {
      case 'settings':
        return ok({ settings: getSettings() });
      case 'sync':
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
 * { action, key, payload }. We parse it and route on action. text/plain avoids
 * a CORS preflight Apps Script cannot answer.
 */
function doPost(e) {
  var body = parseBody(e);
  if (!body) {
    return fail('Invalid or empty request body', 'BAD_BODY');
  }
  try {
    validateApiKey(body.key);
    var actor = resolveActor(body.payload);
    return routeWrite(body.action, actor, body.payload || {});
  } catch (err) {
    return errorResponse(err);
  }
}

/** Dispatch a validated write action to its handler. */
function routeWrite(action, actor, payload) {
  switch (action) {
    case 'addGroup':
      return ok({ group: addGroup(actor, payload) });
    case 'photoDone':
      return ok({ group: photoDone(actor, payload) });
    case 'photoSkip':
      return ok({ group: photoSkip(actor, payload) });
    case 'foodDone':
      return ok({ group: foodDone(actor, payload) });
    case 'foodSkip':
      return ok({ group: foodSkip(actor, payload) });
    case 'requestGroup':
      return ok({ request: requestGroup(actor, payload) });
    case 'resolveRequest':
      return ok({ request: resolveRequest(actor, payload) });
    case 'togglePhotography':
      return ok({ settings: togglePhotography(actor, payload) });
    case 'toggleFood':
      return ok({ settings: toggleFood(actor, payload) });
    default:
      return fail('Unknown POST action: ' + action, 'BAD_ACTION');
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
    return fail('Invalid API key', 'UNAUTHORIZED');
  }
  return fail(message, 'SERVER_ERROR');
}
