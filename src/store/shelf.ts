// The shelf: every series they have, from /api/manga, as the web's
// store/shelf.ts keeps it. null while it loads
import { create } from "zustand";
import { getJson } from "@/core/lib/api";
import type { Manga } from "@/core/lib/types";

type ShelfState = {
  manga: Manga[] | null;
  failed: string | null;
  load: () => Promise<void>;
};

export const useShelf = create<ShelfState>()((set) => ({
  manga: null,
  failed: null,

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
}));
