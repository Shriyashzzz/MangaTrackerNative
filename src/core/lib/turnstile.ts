// COPIED from src/native/lib/turnstile.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/turnstile.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/turnstile.ts. The website proves a
// person is there (Cloudflare Turnstile) before a live price check; the app
// can't run that, so it sends no token and the server answers with the
// stored prices, as it does for a page without one. (Later: Play Integrity)
export const humanQuery = async (
  _joiner: "?" | "&" = "?",
  _signal?: AbortSignal,
) => "";
