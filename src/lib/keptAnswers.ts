// What the server last said, kept on the phone for when there's no
// connection: the web's service worker does this for the website. Every
// page the reader has opened (a series, its volumes, the New tab, To buy,
// the calendar, a price page) opens again offline as it last was, with no
// code of its own: lib/api.ts keeps each good answer here and hands it back
// when a request can't reach the server.
//
// The phone's storage is small (about 6 MB on Android for the whole app),
// so one answer is kept only up to a size, and the oldest go when they add
// up to too much
import AsyncStorage from "@react-native-async-storage/async-storage";
import { KEPT_ANSWER } from "./deviceStore";

const ONE_MOST = 300_000;
const ALL_MOST = 3_000_000;
const INDEX = `${KEPT_ANSWER}#index`;

// the shelf keeps its own copy (store/shelf.ts, with unsent changes on it);
// the sign-in routes must never answer from the past
const worthKeeping = (path: string) =>
  path !== "/api/manga" &&
  !path.startsWith("/api/manga?") &&
  !path.startsWith("/api/auth/");

type Entry = { path: string; size: number; at: number };
let index: Map<string, Entry> | null = null;
async function entries() {
  if (index) return index;
  const found = new Map<string, Entry>();
  try {
    const saved = await AsyncStorage.getItem(INDEX);
    for (const entry of JSON.parse(saved ?? "[]") as Entry[])
      found.set(entry.path, entry);
  } catch {
    // none kept, or unreadable: start empty
  }
  index ??= found;
  return index;
}

// a good answer to a GET, kept (a copy of the response: the page reads the
// real one)
export async function keepAnswer(path: string, copy: Response) {
  if (!worthKeeping(path)) return;
  if (!copy.headers.get("content-type")?.includes("json")) return;
  try {
    const text = await copy.text();
    if (text.length > ONE_MOST) return;
    const all = await entries();
    all.set(path, { path, size: text.length, at: Date.now() });
    await AsyncStorage.setItem(KEPT_ANSWER + path, text);
    // too much kept: the ones asked for longest ago go
    let total = 0;
    for (const entry of all.values()) total += entry.size;
    const oldestFirst = [...all.values()].sort((a, b) => a.at - b.at);
    const gone: string[] = [];
    for (const entry of oldestFirst) {
      if (total <= ALL_MOST) break;
      if (entry.path === path) continue;
      all.delete(entry.path);
      gone.push(KEPT_ANSWER + entry.path);
      total -= entry.size;
    }
    if (gone.length) await AsyncStorage.multiRemove(gone);
    await AsyncStorage.setItem(INDEX, JSON.stringify([...all.values()]));
  } catch {
    // no room, or storage refused: nothing's kept, and nothing breaks
  }
}

// the answer kept for a path, as the response it was; null when there's none
export async function keptAnswer(path: string): Promise<Response | null> {
  if (!worthKeeping(path)) return null;
  try {
    if (!(await entries()).has(path)) return null;
    const text = await AsyncStorage.getItem(KEPT_ANSWER + path);
    if (text === null) return null;
    return new Response(text, {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return null;
  }
}

// all of them, gone: once they've signed out
export async function forgetAnswers() {
  index = new Map();
  try {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(
      keys.filter((key) => key.startsWith(KEPT_ANSWER)),
    );
  } catch {
    // nothing to remove
  }
}
