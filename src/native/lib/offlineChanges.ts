// The app's stand-in for the web's lib/offlineChanges.ts: changes made with
// no connection, kept on this phone until they can be sent. The same rules
// as the website (core lib/offlineChangeRules.ts) and the same server route
// (POST /api/manga/offline-changes); only where they're kept differs: the
// phone's storage, in place of the browser's database.
//
// Each series keeps one change of each kind, however many taps went into
// it: where it started (the first tap's "before") and where it ended up
// (the last tap's "after"). The server applies only what changed between
// the two, so another device's changes since are never undone
import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { apiFetch } from "./api";
import { isNetworkError, isOffline, onConnectionBack } from "./offline";
import {
  changesNothing,
  combinedChange,
  combinedOwned,
  inOrder,
  sentNote,
  toSend,
  type ChangeKind,
  type ChangeValue,
  type OfflineChange,
} from "./offlineChangeRules";

// the rules themselves, for the pages that show changes
export { withChanges, type OfflineChange } from "./offlineChangeRules";

// ---------- where they're kept ----------
// one entry on the phone holding them all, by key ("812:bookmark"): read
// once, then kept in memory and written through, so nothing is lost if the
// app is closed before they're sent
const STORE_KEY = "offlineChanges";
let kept: Map<string, OfflineChange> | null = null;

async function store() {
  if (kept) return kept;
  const found = new Map<string, OfflineChange>();
  try {
    const saved = await AsyncStorage.getItem(STORE_KEY);
    for (const change of JSON.parse(saved ?? "[]") as OfflineChange[])
      found.set(change.key, change);
  } catch {
    // nothing kept, or unreadable: start empty
  }
  kept ??= found;
  return kept;
}
const write = (changes: Map<string, OfflineChange>) =>
  AsyncStorage.setItem(STORE_KEY, JSON.stringify([...changes.values()])).catch(
    () => {},
  );

const allChanges = async () => [...(await store()).values()];
const changeOf = async (key: string) => (await store()).get(key);
const keep = async (change: OfflineChange) => {
  const changes = await store();
  changes.set(change.key, change);
  await write(changes);
};
const drop = async (key: string) => {
  const changes = await store();
  if (changes.delete(key)) await write(changes);
};

// ---------- what the offline bar shows ----------
type ChangesState = {
  // changes waiting to be sent
  waiting: number;
  sending: boolean;
  // how the last send went, in words; null when there's nothing to say
  note: string | null;
};
export const useOfflineChanges = create<ChangesState>()(() => ({
  waiting: 0,
  sending: false,
  note: null,
}));
const recount = async () =>
  useOfflineChanges.setState({ waiting: (await allChanges()).length });

// ---------- keeping a change ----------

// the volumes ticked on a series' shelf: what they owned before, and now
export async function keepOwnedChange(
  mangaId: number,
  started: number[],
  ended: number[],
) {
  const had = await changeOf(`${mangaId}:owned`);
  await keep(combinedOwned(had, mangaId, started, ended, Date.now()));
  await recount();
}

// the chapter, the volume read, finished, To read, the rating or the
// notes, changed from one value to another. Changed back to where it
// started: nothing's left to send
export async function keepChange(
  mangaId: number,
  kind: ChangeKind,
  from: ChangeValue,
  to: ChangeValue,
) {
  const key = `${mangaId}:${kind}`;
  const had = await changeOf(key);
  const change = combinedChange(had, mangaId, kind, from, to, Date.now());
  if (changesNothing(change)) await drop(key);
  else await keep(change);
  await recount();
}

// Saved now if there's a connection; kept on this phone to go when there's
// one again if not. `send` is the ordinary save. Throws when the server
// refuses it (that one isn't kept)
export async function saveOrKeep(
  mangaId: number,
  kind: ChangeKind,
  from: ChangeValue,
  to: ChangeValue,
  send: () => Promise<Response>,
): Promise<"saved" | "kept"> {
  const keepIt = async () => {
    await keepChange(mangaId, kind, from, to);
    return "kept" as const;
  };
  if (isOffline()) return keepIt();
  let res: Response;
  try {
    res = await send();
  } catch (e) {
    if (isNetworkError(e)) return keepIt();
    throw e;
  }
  if (!res.ok) throw new Error(`answered ${res.status}`);
  // saved over one still waiting from offline: that one's out of date now,
  // and sent later it would undo this
  const key = `${mangaId}:${kind}`;
  if (await changeOf(key)) {
    await drop(key);
    await recount();
  }
  return "saved";
}

// what a change kept on this device says
export const KEPT_NOTE = "Kept on this device. It saves when you're back.";

// ---------- showing them ----------

// the changes not sent yet, for drawing a series as it is on this phone
export const waitingChanges = allChanges;

// ---------- sending them ----------

// told when they've been sent: the shelf is asked for again
const whenSent = new Set<() => void>();
export const onChangesSent = (run: () => void) => {
  whenSent.add(run);
  return () => {
    whenSent.delete(run);
  };
};

type Answer = { saved: true } | { saved: false; reason: string };

// the most the server takes in one go (server offline/offlineChanges.ts
// MOST_CHANGES): any more go in the next send
export const MOST_PER_SEND = 200;

export async function sendChanges(): Promise<void> {
  if (useOfflineChanges.getState().sending || isOffline()) return;
  const waiting = inOrder(await allChanges());
  if (!waiting.length) return;
  const changes = waiting.slice(0, MOST_PER_SEND);
  let sentAll = false;
  useOfflineChanges.setState({ sending: true, note: null });
  try {
    const res = await apiFetch("/api/manga/offline-changes", {
      method: "POST",
      body: { changes: changes.map(toSend) },
    });
    // signed out since (the session ran out): kept for when they sign in
    if (!res.ok) return;
    const { answers } = (await res.json()) as { answers: Answer[] };
    let refused = 0;
    for (const [i, change] of changes.entries()) {
      if (!answers[i]?.saved) refused++;
      // sent, unless it was changed again while this was on its way
      const now = await changeOf(change.key);
      if (now?.at === change.at) await drop(change.key);
    }
    const saved = changes.length - refused;
    useOfflineChanges.setState({ note: sentNote(saved, refused) });
    for (const run of whenSent) run();
    sentAll = true;
  } catch {
    // the connection dropped again: they stay, and go next time
  } finally {
    useOfflineChanges.setState({ sending: false });
    await recount();
  }
  // more than one send's worth: the rest go now
  if (sentAll && waiting.length > changes.length) return sendChanges();
}

// as the app starts: anything waiting goes, and goes whenever the
// connection is back
let started = false;
export function startSendingChanges() {
  if (started) return;
  started = true;
  onConnectionBack(() => void sendChanges());
  void recount();
  void sendChanges();
}

// all of them, gone: once they've signed out
export async function forgetChanges() {
  kept = new Map();
  await AsyncStorage.removeItem(STORE_KEY).catch(() => {});
  useOfflineChanges.setState({ waiting: 0, note: null });
}

export const clearChangesNote = () =>
  useOfflineChanges.setState({ note: null });
