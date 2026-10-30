/**
 * The Portal's public origin for server-side redirects, read at runtime.
 * APP_URL is not a NEXT_PUBLIC_ variable, so Next doesn't bake it into the
 * build: moving hostnames (e.g. portal → portals) is an .env edit, not a rebuild.
 */
export function appUrl(): string {
  return process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}
