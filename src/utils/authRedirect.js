const APP_ORIGIN = "https://app.local";

export function buildLoginPath(pathname, search = "") {
  return `/autenticacion/iniciar-sesion?returnTo=${encodeURIComponent(`${pathname}${search}`)}`;
}

export function resolveSafeReturnPath(search, fallback = "/dashboard") {
  const candidate = new URLSearchParams(search).get("returnTo");
  if (!candidate || !candidate.startsWith("/") || candidate.startsWith("//")) return fallback;
  if (candidate.includes("\\")) return fallback;

  try {
    const resolved = new URL(candidate, APP_ORIGIN);
    if (resolved.origin !== APP_ORIGIN) return fallback;
    return `${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return fallback;
  }
}
