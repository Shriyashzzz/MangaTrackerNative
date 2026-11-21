// COPIED from src/native/lib/releaseCache.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/releaseCache.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/releaseCache.ts, which keeps release
// answers in the browser for a shelf with no signal. The app asks the server
// each time (store/shelf.ts), so nothing is kept here yet
export function savedLatestVolume(_id: number): number | null {
  return null;
}

// "Checked 6 h ago", under the New tab (the web's words)
export function checkedAgo(at: number, now = Date.now()) {
  const min = Math.max(0, Math.round((now - at) / 60000));
  if (min < 2) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  const d = Math.round(h / 24);
  return d === 1 ? "yesterday" : `${d} days ago`;
}
