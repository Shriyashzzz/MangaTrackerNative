// COPIED from src/native/lib/offlineChanges.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/offlineChanges.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/offlineChanges.ts. The website keeps a
// change made offline and sends it once the connection is back; the app
// doesn't yet (phase 4), so the shelf goes back and says it didn't save
export async function keepOwnedChange(
  _mangaId: number,
  _started: number[],
  _ended: number[],
): Promise<void> {
  throw new Error("Not saved: you're offline. Try again when you're back.");
}
