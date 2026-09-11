type HeaderValue = string | string[] | undefined;

function first(value: HeaderValue): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.split(",")[0]?.trim() || undefined;
}

/**
 * The origin the client actually used to reach us, from the proxy headers a
 * host like Vercel sets, falling back to the plain Host header. `null` when
 * there is no host at all. Localhost defaults to http, everything else to
 * https, unless a forwarded protocol says otherwise.
 */
export function requestOrigin(headers: Record<string, HeaderValue>): string | null {
  const host = first(headers["x-forwarded-host"]) ?? first(headers["host"]);
  if (!host) return null;
  const isLocal = /^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(host);
  const proto = first(headers["x-forwarded-proto"]) ?? (isLocal ? "http" : "https");
  return `${proto}://${host}`;
}
