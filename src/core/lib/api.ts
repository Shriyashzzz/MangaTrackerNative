// COPIED from src/native/lib/api.ts (the app's own stand-in for the web's) by scripts/sync-core.mjs.
// Do not edit here: change src/native/lib/api.ts, then run `npm run sync-core`.
// The app's stand-in for the web's lib/api.ts (scripts/sync-core.mjs copies it
// into src/core in its place): talking to the same API, with the same names.
// Android's networking keeps the session cookie the server sets at sign-in and
// sends it back, as a browser does. While developing it's the local server
// (the phone's localhost:8080, passed to the Mac by adb reverse); a release
// build uses the real site. EXPO_PUBLIC_API_URL overrides either
import { withCountry } from "./country";
import { isOffline, noteAnswer, offlineAnswer, orOffline } from "./offline";
import type { ApiError } from "./types";

export const API_URL: string =
  process.env.EXPO_PUBLIC_API_URL ??
  (__DEV__ ? "http://localhost:8080" : "https://mangatracker.xyz");

type FetchOptions = Omit<RequestInit, "body"> & { body?: unknown };

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
export function apiFetch(
  path: string,
  { body, headers, ...options }: FetchOptions = {},
) {
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
    headers:
      body !== undefined
        ? { "Content-Type": "application/json", ...headers }
        : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(
    (res) => {
      clearTimeout(timer);
      noteAnswer(res);
      if (res.status === 401 && !path.startsWith("/api/auth/")) signedOut?.();
      return res;
    },
    (e: unknown) => {
      clearTimeout(timer);
      // gave up waiting (not the caller's own cancel): said as no answer
      if (limit.signal.aborted && !theirs?.aborted)
        throw new TypeError(orOffline("The server took too long. Try again."), {
          cause: e,
        });
      if (e instanceof TypeError)
        throw new TypeError(
          orOffline("Couldn't reach the server. Try again."),
          { cause: e },
        );
      throw e;
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
