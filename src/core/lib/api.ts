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

// fetch that always sends the session cookie and serialises JSON bodies
export function apiFetch(
  path: string,
  { body, headers, ...options }: FetchOptions = {},
) {
  const method = (options.method ?? "GET").toUpperCase();
  if (method !== "GET" && isOffline()) return Promise.resolve(offlineAnswer());
  return fetch(`${API_URL}${path}`, {
    credentials: "include",
    ...options,
    headers:
      body !== undefined
        ? { "Content-Type": "application/json", ...headers }
        : headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(
    (res) => {
      noteAnswer(res);
      return res;
    },
    (e: unknown) => {
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
