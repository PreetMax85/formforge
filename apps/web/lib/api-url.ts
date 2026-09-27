/**
 * Base URL the browser uses to reach the API.
 *
 * Unset means same origin: in production, Vercel routes /trpc, /api/v1 and
 * /docs on the site's own domain to the API service, which is what lets the
 * HttpOnly refresh cookie work. Local dev runs the API on its own port and
 * sets NEXT_PUBLIC_API_URL=http://localhost:8080 in .env.
 */
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

/**
 * Base URL for server-side fetches (SSR), which need an absolute URL.
 *
 * On Vercel, API_ORIGIN is injected by the service binding in vercel.json and
 * points at the API privately, without a round trip through the public edge.
 * Only read this from server code: it is not available in the browser.
 */
export const SERVER_API_URL =
  process.env.API_ORIGIN ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080';
