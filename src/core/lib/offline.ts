// COPIED from src/native/lib/offline.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/offline.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/offline.ts: whether there's a
// connection, and the words for when there isn't. A phone has no browser to
// say "offline", so the app learns it from its own requests: one that never
// reaches the server means offline (lib/api.ts says so here), and any
// answer at all means it's back. While offline it asks again every few
// seconds, and when the app comes back to the front
import { create } from "zustand";

type OfflineState = { online: boolean };
export const useOffline = create<OfflineState>()(() => ({ online: true }));
export const useIsOffline = () => useOffline((s) => !s.online);
export const isOffline = () => !useOffline.getState().online;

// asked while offline: does anything answer yet? Given by lib/api.ts, which
// knows the server (this file can't ask for itself: api.ts imports it)
let probe: (() => Promise<boolean>) | null = null;
export const setProbe = (ask: () => Promise<boolean>) => {
  probe = ask;
};
const ASK_AGAIN_MS = 8_000;
let asking: ReturnType<typeof setInterval> | null = null;

// told when the connection comes back (kept changes are sent then)
const whenBack = new Set<() => void>();
export const onConnectionBack = (run: () => void) => {
  whenBack.add(run);
  return () => {
    whenBack.delete(run);
  };
};

export function setOffline(offline: boolean) {
  const was = isOffline();
  if (was === offline) return;
  useOffline.setState({ online: !offline });
  if (offline) {
    asking ??= setInterval(() => void checkConnection(), ASK_AGAIN_MS);
    return;
  }
  if (asking) clearInterval(asking);
  asking = null;
  for (const run of whenBack) run();
}

// asks once whether the server answers (the app coming to the front, or the
// timer above)
export async function checkConnection() {
  if (!probe) return;
  setOffline(!(await probe().catch(() => false)));
}

export const OFFLINE_SAID = "You're offline. Try again when you're back.";
// the words for a failure: "you're offline" when that's why
export const orOffline = (said: string) => (isOffline() ? OFFLINE_SAID : said);

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
