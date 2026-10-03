const DEFAULT_SITE_URL = "https://wilwa.ug";

/**
 * Returns the public origin used in canonical tags, robots.txt and sitemaps.
 * A localhost value must never be published from a production deployment.
 */
export function getSiteUrl(fallback = DEFAULT_SITE_URL) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_BASE_URL;

  if (!configuredUrl) return fallback;

  try {
    const url = new URL(configuredUrl);
    const isLocalhost = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";

    if (process.env.NODE_ENV === "production" && isLocalhost) {
      return fallback;
    }

    return url.origin;
  } catch {
    return fallback;
  }
}
