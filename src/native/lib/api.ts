// The app's stand-in for the web's lib/api.ts (scripts/sync-core.mjs copies it
// into src/core in its place): talking to the same API, with the same names.
// Android's networking keeps the session cookie the server sets at sign-in and
// sends it back, as a browser does. While developing it's the local server
// (the phone's localhost:8080, passed to the Mac by adb reverse); a release
// build uses the real site. EXPO_PUBLIC_API_URL overrides either
import { Platform } from "react-native";
import { keepAnswer, keptAnswer } from "@/lib/keptAnswers";
import { withCountry } from "./country";
import { demoResponse, isDemo } from "./demo";
import {
  isOffline,
  noteAnswer,
  offlineAnswer,
  orOffline,
  setOffline,
  setProbe,
} from "./offline";
import type { ApiError } from "./types";

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? "http://localhost:8080" : "https://mangatracker.xyz");

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

// while offline, lib/offline.ts asks this now and then: any answer from the
// server, whatever it says, means the connection is back
setProbe(() =>
  fetch(`${API_URL}/api/auth/me`, { credentials: "include" }).then(() => true),
);

// a request that hasn't answered in this long is given up on, so a screen
// never waits for ever on a bad connection (the slowest answers, a live
// price check or a big import, take well under it)
const GIVE_UP_AFTER_MS = 60_000;

// told when the server says the session is gone (a 401 on anything but the
// sign-in routes themselves): the auth store sends them to sign in again
let signedOut: (() => void) | null = null;
export const whenSignedOut = (run: () => void) => {
  signedOut = run;
};

// fetch that always sends the session cookie and serialises JSON bodies
// a 402 from a Collector limit opens the Collector sheet, saying what was
// full (its answer: { code: "collector", what: "series" })
let collectorOffer: ((what: string | null) => void) | null = null;
export const whenCollectorNeeded = (run: (what: string | null) => void) => {
  collectorOffer = run;
};
async function offerCollector(res: Response) {
  const body = (await res.json().catch(() => null)) as {
    code?: string;
    what?: string;
  } | null;
  if (body?.code === "collector") collectorOffer?.(body.what ?? null);
}

export function apiFetch(
  path: string,
  { body, headers, ...options }: FetchOptions = {},
) {
  // the practice shelf never touches the real server (core lib/demo.ts)
  if (isDemo())
    return demoResponse(
      path,
      options.method,
      body !== undefined ? JSON.stringify(body) : undefined,
    );
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" && isOffline()) return Promise.resolve(offlineAnswer());
  // the caller's own cancel still works: it stops this one too
  const limit = new AbortController();
  const timer = setTimeout(() => limit.abort(), GIVE_UP_AFTER_MS);
  const theirs = options.signal;
  if (theirs?.aborted) limit.abort();
  else theirs?.addEventListener("abort", () => limit.abort(), { once: true });
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    signal: limit.signal,
    // which app is asking: the server holds the Collector tier's limits only
    // where they're switched on, platform by platform (server src/plan/)
    headers: {
      "X-App": Platform.OS === "ios" ? "ios" : "android",
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(
    (res) => {
      clearTimeout(timer);
      // any answer at all: there's a connection
      setOffline(false);
      noteAnswer(res);
      if (res.status === 401 && !path.startsWith("/api/auth/")) signedOut?.();
      // refused for want of Collector: its sheet says what it adds
      if (res.status === 402) void offerCollector(res.clone());
      // kept on the phone, for opening this page with no connection
      if (method === "GET" && res.ok) void keepAnswer(path, res.clone());
      return res;
    },
    async (e: unknown) => {
      clearTimeout(timer);
      // gave up waiting (not the caller's own cancel): said as no answer
      if (limit.signal.aborted && !theirs?.aborted)
        throw new TypeError(orOffline("The server took too long. Try again."), {
          cause: e,
        });
      // the caller's own cancel: theirs to handle
      if (theirs?.aborted) throw e;
      // anything else never reached the server (a fetch fails for nothing
      // else, and Android words it its own way, not always as a TypeError):
      // offline, until something answers
      setOffline(true);
      // a page opened before shows as it last was
      const kept = method === "GET" ? await keptAnswer(path) : null;
      if (kept) return kept;
      throw new TypeError(orOffline("Couldn't reach the server. Try again."), {
        cause: e,
      });
    },
  );
}

// a failed request, with the server's message and its status
export class HttpError extends Error {
  readonly status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// GET as JSON; throws with the server's own message
export async function getJson<T>(
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const res = await apiFetch(withCountry(path), { signal });
  const data = await res.json().catch((e: Error) => {
    if (signal?.aborted) throw e;
    return null;
  });
  if (!res.ok) {
    throw new HttpError(
      (data as ApiError | null)?.error?.[0]?.msg ??
        orOffline("Something went wrong. Try again."),
      res.status,
    );
  }
  return data as T;
}

// the messages in an error response, for showing under a form
export async function errorMessages(res: Response): Promise<string[]> {
  const data = (await res.json().catch(() => null)) as ApiError | null;
  return (
    data?.error?.map((e) => e.msg) ?? [
      orOffline("Something went wrong, please try again!"),
    ]
  );
}
