// The shelf: every series they have (/api/manga), and what each one's
// release check found, as the web's store/shelf.ts keeps them. null while
// the shelf loads
import { create } from "zustand";
import { apiFetch, getJson } from "@/core/lib/api";
import { restorable, restorePieces } from "@/core/lib/restorePieces";
import {
  getReleases,
  getSavedReleases,
  RELEASE_CHECK_TIMEOUT_MS,
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
  load: () => Promise<void>;
  // the server's saved answers first (one request), then every series it has
  // none for, one at a time, as the web does
  checkReleases: () => Promise<void>;
  // Hide on New: off the list at once (the server's answer agrees once saved),
  // as the web's markSeen
  hide: (id: number, kind: "volumes" | "chapters" | "japan") => void;
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

// one series, given up on after a while so one stuck title can't stop the rest
async function askAbout(id: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RELEASE_CHECK_TIMEOUT_MS);
  try {
    return await getReleases(id, controller.signal);
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const useShelf = create<ShelfState>()((set, get) => ({
  manga: null,
  failed: null,
  releases: {},
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

  load: async () => {
    try {
      const data = await getJson<{ manga: Manga[] } | Manga[]>("/api/manga");
      set({ manga: Array.isArray(data) ? data : data.manga, failed: null });
    } catch (e) {
      set({
        failed: e instanceof Error ? e.message : "The shelf didn't load.",
      });
    }
  },

  hide: (id, kind) => {
    const found = get().releases[id];
    if (!found) return;
    const flag = {
      volumes: "hasNewVolume",
      chapters: "hasNewChapter",
      japan: "hasNewJapaneseVolume",
    }[kind];
    set({ releases: { ...get().releases, [id]: { ...found, [flag]: false } } });
  },

  checkReleases: async () => {
    if (checking) return;
    checking = true;
    try {
      const saved = await getSavedReleases().catch(() => null);
      if (saved) {
        const releases = { ...get().releases };
        for (const [id, answer] of Object.entries(saved.answers))
          releases[Number(id)] = answer.releaseStatus;
        set({ releases });
      }
      for (const m of get().manga ?? []) {
        if (m.id in get().releases) continue;
        const found = await askAbout(m.id);
        if (!found) continue;
        set({ releases: { ...get().releases, [m.id]: found.releaseStatus } });
      }
    } finally {
      checking = false;
    }
  },
}));
