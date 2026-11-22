// The shelf: every series they have (/api/manga), and what each one's
// release check found, as the web's store/shelf.ts keeps them. null while
// the shelf loads
import { isDemo } from "@/core/lib/demo";
import { isNetworkError } from "@/core/lib/offline";
import {
  onChangesSent,
  waitingChanges,
  withChanges,
} from "@/core/lib/offlineChanges";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import { checkOrder, laneOf } from "@/core/lib/releaseOrder";
import { create } from "zustand";
import { apiFetch, getJson } from "@/core/lib/api";
import { restorable, restorePieces } from "@/core/lib/restorePieces";
import {
  isStillNew,
  type ReleaseOutcome,
  type SeenKind,
} from "@/core/lib/releaseMath";
import {
  getReleases,
  getSavedReleases,
  RELEASE_CHECK_TIMEOUT_MS,
  saveSeen,
} from "@/core/lib/shelf";
import type { Manga, ReleaseStatus } from "@/core/lib/types";

export type ShelfMove = "finished" | "planned" | "reading";
export type ShelfPlace = Pick<Manga, "id" | "status" | "planned" | "bookmark">;

// the move's undo goes back in pieces this big (the server takes 2000)
const PLACE_PIECE = 2000;

// a series brought back by Undo, under its new id: its old address leads to
// it while the app is open (the web keeps this for the browser tab)
const restoredIds = new Map<number, number>();
export const restoredAs = (oldId: number) => restoredIds.get(oldId) ?? null;

type ShelfState = {
  manga: Manga[] | null;
  failed: string | null;
  // each series' release check: what's out past theirs; null when it found
  // nothing to say. A series not in here hasn't been checked yet
  releases: Record<number, ReleaseStatus | null>;
  // how each check went: news, nothing known, or it failed (asked again
  // next time), and when, for "Checked 6 h ago"
  outcomes: Record<number, ReleaseOutcome>;
  checkedAt: Record<number, number>;
  load: () => Promise<void>;
  // the server's saved answers first (one request), then every series it has
  // none for, one at a time, as the web does
  checkReleases: () => Promise<void>;
  // Hide on New (and its undo), as the web's markSeen: the series is marked
  // seen up to that number at once, and put back if the save fails. Says
  // whether it saved
  markSeen: (
    id: number,
    kind: SeenKind,
    number: number | null,
    hiddenVolumes?: number[],
  ) => Promise<boolean>;
  // the settings changed: every answer is asked for again
  recheckReleases: () => void;
  // it's been deleted: gone at once, not after the next refresh
  remove: (ids: number | number[]) => void;
  // several deleted at once with Select, all or none. Says whether it
  // worked; on success their undo is on offer
  removeMany: (ids: number[]) => Promise<boolean>;
  // Select's Move to. Gives where each was, for the undo; null if it didn't save
  moveMany: (ids: number[], to: ShelfMove) => Promise<ShelfPlace[] | null>;
  // that undo: each back where it was. Says whether it all saved
  placeMany: (places: ShelfPlace[]) => Promise<boolean>;
  // the last ones deleted, while their undo is on offer
  lastDeleted: Manga[] | null;
  setLastDeleted: (manga: Manga | Manga[] | null) => void;
  // puts them back as they were, unless they've been added again since
  undoDelete: () => Promise<void>;
  undoing: boolean;
  // how the last undo went, when there's something to say
  undoMessage: string;
  clearUndoMessage: () => void;
  // on signing out: it's someone else's shelf next
  reset: () => void;
};

// a check under way: a second one waits for it rather than doubling up
let checking = false;

// where each kind of "Hide" lives on a manga, and the flag it switches off
const SEEN = {
  volume: { field: "seenVolume", flag: "hasNewVolume" },
  chapter: { field: "seenChapter", flag: "hasNewChapter" },
  japan: { field: "seenJapanVolume", flag: "hasNewJapaneseVolume" },
} as const;

// one series, given up on after a while so one stuck title can't stop the rest
// It says which lane it waits in on the server (core lib/releaseOrder.ts):
// "now" for a series someone is waiting on news for, "later" for the rest,
// so a series page opened meanwhile (always "now") is never stuck behind a
// whole shelf's checks
async function askAbout(m: Manga) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELEASE_CHECK_TIMEOUT_MS);
  try {
    return await getReleases(m.id, controller.signal, laneOf(m));
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

// the last shelf the server sent, kept on the phone for when there's no
// connection (forgotten at sign-out: lib/forgetAccount.ts)
export const KEPT_SHELF = "keptShelf";
function readKeptShelf(): Manga[] | null {
  try {
    const kept = JSON.parse(readLocal(KEPT_SHELF) ?? "null") as unknown;
    return Array.isArray(kept) ? (kept as Manga[]) : null;
  } catch {
    return null;
  }
}

export const useShelf = create<ShelfState>()((set, get) => ({
  manga: null,
  failed: null,
  releases: {},
  outcomes: {},
  checkedAt: {},
  lastDeleted: null,
  undoing: false,
  undoMessage: "",

  remove: (ids) => {
    const gone = new Set(Array.isArray(ids) ? ids : [ids]);
    set((state) => ({
      manga: state.manga?.filter((m) => !gone.has(m.id)) ?? null,
    }));
  },

  clearUndoMessage: () => set({ undoMessage: "" }),
  setLastDeleted: (manga) =>
    set({
      lastDeleted: manga && (Array.isArray(manga) ? manga : [manga]),
      ...(manga ? { undoMessage: "" } : {}),
    }),

  undoDelete: async () => {
    const { lastDeleted, load } = get();
    if (!lastDeleted?.length || get().undoing) return;
    set({ undoing: true, undoMessage: "" });
    const said = (undoMessage: string) => set({ undoing: false, undoMessage });
    if (lastDeleted.length === 1) {
      try {
        const res = await apiFetch("/api/manga/restore", {
          method: "POST",
          body: restorable(lastDeleted[0]!),
        });
        if (res.status === 409) {
          set({ lastDeleted: null });
          return said("It's already back on your shelf.");
        }
        if (!res.ok) throw new Error(res.statusText);
        const { id } = (await res.json().catch(() => ({}))) as { id?: number };
        if (id) restoredIds.set(lastDeleted[0]!.id, id);
      } catch {
        return said("That didn't bring it back. Try again.");
      }
      await load();
      set({ lastDeleted: null });
      return said("");
    }
    // in pieces under the server's size limit; a piece that's back comes off
    // the list, so trying again carries on from there
    let restored = 0;
    let lost = 0;
    try {
      let left = lastDeleted;
      for (const piece of restorePieces(lastDeleted)) {
        const res = await apiFetch("/api/manga/restore-many", {
          method: "POST",
          body: { manga: piece.map(restorable) },
        });
        if (!res.ok) throw new Error(res.statusText);
        const answer = (await res.json()) as {
          restored: number;
          invalid: number;
        };
        restored += answer.restored;
        lost += answer.invalid;
        left = left.slice(piece.length);
        set({ lastDeleted: left.length ? left : null });
      }
    } catch {
      if (restored) await load();
      return said("That didn't bring them all back. Try again.");
    }
    await load();
    set({ lastDeleted: null });
    said(
      lost
        ? `${lost} of them couldn't come back. The rest are on your shelf.`
        : restored
          ? ""
          : "They're already back on your shelf.",
    );
  },

  removeMany: async (ids) => {
    let deleted: Manga[];
    try {
      const res = await apiFetch("/api/manga/delete-many", {
        method: "POST",
        body: { ids },
      });
      if (!res.ok) throw new Error(res.statusText);
      // exactly what went, as the server had it: what the undo puts back
      deleted = ((await res.json()) as { manga: Manga[] }).manga;
    } catch {
      return false;
    }
    get().remove(ids);
    set({ lastDeleted: deleted.length ? deleted : null, undoMessage: "" });
    return true;
  },

  moveMany: async (ids, to) => {
    let was: ShelfPlace[];
    try {
      const res = await apiFetch("/api/manga/move-many", {
        method: "POST",
        body: { ids, to },
      });
      if (!res.ok) throw new Error(res.statusText);
      was = ((await res.json()) as { was: ShelfPlace[] }).was;
    } catch {
      return null;
    }
    // as the server did it: Reading puts one that hadn't started at chapter 1
    const moving = new Set(was.map((p) => p.id));
    set((state) => ({
      manga:
        state.manga?.map((m) =>
          !moving.has(m.id)
            ? m
            : to === "finished"
              ? { ...m, status: true, planned: false }
              : to === "planned"
                ? { ...m, planned: true, status: false }
                : {
                    ...m,
                    status: false,
                    planned: false,
                    bookmark: m.planned && m.bookmark == null ? 1 : m.bookmark,
                  },
        ) ?? null,
    }));
    return was;
  },

  placeMany: async (places) => {
    let ok = true;
    for (let i = 0; i < places.length; i += PLACE_PIECE) {
      const piece = places.slice(i, i + PLACE_PIECE);
      try {
        const res = await apiFetch("/api/manga/place-many", {
          method: "POST",
          body: { places: piece },
        });
        if (!res.ok) throw new Error(res.statusText);
      } catch {
        ok = false;
        continue;
      }
      const back = new Map(piece.map((p) => [p.id, p]));
      set((state) => ({
        manga: state.manga?.map((m) => ({ ...m, ...back.get(m.id) })) ?? null,
      }));
    }
    return ok;
  },

  reset: () =>
    set({
      manga: null,
      failed: null,
      releases: {},
      lastDeleted: null,
      undoMessage: "",
    }),

  // The shelf, with any changes still waiting to be sent drawn on it, so it
  // shows as it is on this phone. Each good answer is kept on the phone;
  // with no connection that kept shelf is what's shown, not an error
  load: async () => {
    const shownWith = async (manga: Manga[]) => {
      const changes = await waitingChanges();
      return changes.length ? manga.map((m) => withChanges(m, changes)) : manga;
    };
    try {
      const data = await getJson<{ manga: Manga[] } | Manga[]>("/api/manga");
      const manga = Array.isArray(data) ? data : data.manga;
      // (never the practice shelf: it isn't theirs to come back to)
      if (!isDemo()) writeLocal(KEPT_SHELF, JSON.stringify(manga));
      set({ manga: await shownWith(manga), failed: null });
    } catch (e) {
      const keptShelf = isNetworkError(e) ? readKeptShelf() : null;
      if (keptShelf) {
        set({ manga: await shownWith(keptShelf), failed: null });
        return;
      }
      set({
        failed: e instanceof Error ? e.message : "The shelf didn't load.",
      });
    }
  },

  markSeen: async (id, kind, number, hiddenVolumes) => {
    const { field, flag } = SEEN[kind];
    const apply = (seen: number | null, hiddenList?: number[]) =>
      set((state) => {
        const manga =
          state.manga?.map((m) =>
            m.id === id
              ? {
                  ...m,
                  [field]: seen,
                  ...(hiddenList ? { hiddenVolumes: hiddenList } : {}),
                }
              : m,
          ) ?? null;
        const release = state.releases[id];
        const changed = manga?.find((m) => m.id === id);
        return {
          manga,
          releases:
            release && changed
              ? {
                  ...state.releases,
                  [id]: {
                    ...release,
                    [flag]: isStillNew(kind, changed, release),
                  },
                }
              : state.releases,
        };
      });
    const before = get().manga?.find((m) => m.id === id);
    const previous = before?.[field] ?? null;
    const previousList = before?.hiddenVolumes ?? [];
    apply(number, hiddenVolumes);
    try {
      await saveSeen(id, kind, number, hiddenVolumes);
      return true;
    } catch {
      apply(previous, hiddenVolumes ? previousList : undefined);
      return false;
    }
  },

  checkReleases: async () => {
    if (checking) return;
    checking = true;
    try {
      const saved = await getSavedReleases().catch(() => null);
      if (saved) {
        const now = Date.now();
        const releases = { ...get().releases };
        const outcomes = { ...get().outcomes };
        const checkedAt = { ...get().checkedAt };
        for (const [key, answer] of Object.entries(saved.answers)) {
          const id = Number(key);
          releases[id] = answer.releaseStatus;
          outcomes[id] = answer.releaseStatus ? "news" : "notFound";
          checkedAt[id] = now;
        }
        set({ releases, outcomes, checkedAt });
      }
      // the ones most likely to have news first (checkOrder)
      for (const m of checkOrder(get().manga ?? [])) {
        if (m.id in get().releases) continue;
        const found = await askAbout(m);
        const outcome: ReleaseOutcome = !found
          ? "failed"
          : found.releaseStatus
            ? "news"
            : found.complete
              ? "notFound"
              : "failed";
        set({
          releases: { ...get().releases, [m.id]: found?.releaseStatus ?? null },
          outcomes: { ...get().outcomes, [m.id]: outcome },
          checkedAt: { ...get().checkedAt, [m.id]: Date.now() },
        });
      }
    } finally {
      checking = false;
    }
  },

  recheckReleases: () => set({ releases: {}, outcomes: {}, checkedAt: {} }),
}));

// kept changes just went to the server: the shelf is asked for again, so
// it shows what the server now has
onChangesSent(() => void useShelf.getState().load());
