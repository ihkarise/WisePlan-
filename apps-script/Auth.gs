/**
 * Auth.gs
 * Token-in-URL authentication. The client sends a token with every call; we
 * resolve Name + Role from the Users sheet and reject unknown/inactive tokens.
 */

/**
 * Resolve a token to a user record.
 * @return {{userId:string, name:string, role:string}} on success.
 * @throws Error('UNAUTHORIZED') when the token is missing, unknown, or inactive.
 */
function resolveUser(token) {
  if (!token) {
    throw new Error('UNAUTHORIZED');
  }
  var users = readObjects(SHEETS.USERS);
  for (var i = 0; i < users.length; i++) {
    var u = users[i];
    if (String(u.Token) === String(token) && isActive(u.Active)) {
      return { userId: String(u.UserID), name: String(u.Name), role: String(u.Role) };
    }
  }
  throw new Error('UNAUTHORIZED');
}

/** Treat TRUE, true, "TRUE", "yes", 1 as active; everything else inactive. */
function isActive(value) {
  if (value === true) {
    return true;
  }
  var normalized = String(value).trim().toLowerCase();
  return normalized === 'true' || normalized === 'yes' || normalized === '1';
}
