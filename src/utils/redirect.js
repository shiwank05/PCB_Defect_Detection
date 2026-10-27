// Default page after signing in or registering
export const DEFAULT_AFTER_LOGIN = "/detect";

// Pages that make no sense as a "return to" target after login
// (/result needs the scan data that only exists in router state).
const EXCLUDED = ["/login", "/register", "/oauth-success", "/result"];

/**
 * Where to send the user once they are authenticated: the page they originally
 * asked for (ProtectedRoute passes it as `location.state.from`), or /detect.
 */
export function getRedirectTarget(location) {
  const from = location?.state?.from;
  if (!from || typeof from.pathname !== "string" || EXCLUDED.includes(from.pathname)) {
    return DEFAULT_AFTER_LOGIN;
  }
  return `${from.pathname}${from.search || ""}${from.hash || ""}`;
}
