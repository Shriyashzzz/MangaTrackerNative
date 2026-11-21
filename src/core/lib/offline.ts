// COPIED from src/native/lib/offline.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/offline.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/offline.ts: whether there's a
// connection, and the words for when there isn't. setOffline is called by
// the app's connection watcher (to come: @react-native-community/netinfo)
let offline = false;
export const setOffline = (value: boolean) => {
  offline = value;
};
export const isOffline = () => offline;

export const OFFLINE_SAID = "You're offline. Try again when you're back.";
// the words for a failure: "you're offline" when that's why
export const orOffline = (said: string) => (offline ? OFFLINE_SAID : said);

// a request that never reached the server
export const isNetworkError = (e: unknown) => e instanceof TypeError;

// the web notes answers its service worker kept; the app has none
export function noteAnswer(_res: Response) {}

// a change asked for while offline, answered at once
export const offlineAnswer = () =>
  new Response(JSON.stringify({ error: [{ msg: OFFLINE_SAID }] }), {
    status: 503,
    headers: { "Content-Type": "application/json" },
  });

// the web's event name for the connection coming back (kept for the names)
export const CONNECTION_BACK = "connectionback";
