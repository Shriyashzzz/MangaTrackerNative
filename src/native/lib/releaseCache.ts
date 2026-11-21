// The app's stand-in for the web's lib/releaseCache.ts: the web keeps each
// series' last release check in the browser; the app doesn't yet (phase 3)
export const savedLatestVolume = (_id: number, _now = Date.now()) => null;
