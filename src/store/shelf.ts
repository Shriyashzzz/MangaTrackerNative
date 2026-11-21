// The shelf: every series they have (/api/manga), and what each one's
// release check found, as the web's store/shelf.ts keeps them. null while
// the shelf loads
import { create } from "zustand";
import { getJson } from "@/core/lib/api";
import {
  getReleases,
  getSavedReleases,
  RELEASE_CHECK_TIMEOUT_MS,
} from "@/core/lib/shelf";
import type { Manga, ReleaseStatus } from "@/core/lib/types";

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
