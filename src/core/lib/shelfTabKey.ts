// COPIED from src/native/lib/shelfTabKey.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/shelfTabKey.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/shelfTabKey.ts: the shelf's keys, kept
// for the names the shared code uses. The app keeps its own tab in its router
export const SHELF_TAB_KEY = "libraryStatus";
export const VOLUMES_OPEN_KEY = "volumesOpen";
export const shelfResets = () => 0;
export function forgetShelfPlace() {}
