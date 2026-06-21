/**
 * Sync.gs
 * Delta sync endpoint. Returns only the groups changed since the client's
 * lastSync timestamp, plus a version hash and a fresh server timestamp.
 */

/**
 * @param {string} since ISO timestamp from the client (empty on first load).
 * @return {{version:string, since:string, serverTime:string, changed:Array}}
 */
function getSync(since) {
  var groups = readObjects(SHEETS.GROUPS);
  var serverTime = nowIso();
  var sinceTime = since ? Date.parse(since) : 0;
  var changed = [];
  for (var i = 0; i < groups.length; i++) {
    var g = groups[i];
    if (!since || changedSince(g.LastModified, sinceTime)) {
      changed.push(g);
    }
  }
  return {
    version: computeVersion(groups),
    since: since || '',
    serverTime: serverTime,
    changed: changed
  };
}

/** True when a row's LastModified is newer than the client's cutoff. */
function changedSince(lastModified, sinceTime) {
  if (!lastModified) {
    return true;
  }
  var t = Date.parse(lastModified);
  return isNaN(t) ? true : t > sinceTime;
}

/**
 * Cheap version fingerprint: row count plus the newest LastModified value.
 * Lets the client detect "nothing changed" without diffing payloads.
 */
function computeVersion(groups) {
  var newest = '';
  for (var i = 0; i < groups.length; i++) {
    var lm = String(groups[i].LastModified || '');
    if (lm > newest) {
      newest = lm;
    }
  }
  return groups.length + ':' + newest;
}
