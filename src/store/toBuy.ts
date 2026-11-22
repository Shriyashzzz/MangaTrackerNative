// The To buy list (the bag in the top bar), as the web's store/toBuy.ts
import { create } from "zustand";
import {
  addToBuy,
  clearToBuy,
  getToBuy,
  removeToBuy,
  saveToBuyNote,
  saveToBuyOrder,
  type ToBuyList,
} from "@/core/lib/toBuy";

type ToBuyState = {
  list: ToBuyList | null;
  loadFailed: boolean;
  load: () => Promise<void>;
  add: (isbn13: string) => Promise<void>;
  remove: (isbn13: string) => Promise<void>;
  clear: () => Promise<void>;
  // their own note on one item, and their own order for the list: shown at
  // once, put back if the server doesn't take it (the error is thrown on)
  setNote: (isbn13: string, note: string) => Promise<void>;
  setOrder: (isbns: string[]) => Promise<void>;
  reset: () => void;
};

export const useToBuy = create<ToBuyState>()((set, get) => ({
  list: null,
  loadFailed: false,
  load: async () => {
    try {
      set({ list: await getToBuy(), loadFailed: false });
    } catch {
      set({ loadFailed: true });
    }
  },
  add: async (isbn13) => {
    await addToBuy(isbn13);
    await get().load();
  },
  remove: async (isbn13) => {
    await removeToBuy(isbn13);
    await get().load();
  },
  clear: async () => {
    await clearToBuy();
    await get().load();
  },
  setNote: async (isbn13, note) => {
    const was = get().list;
    if (!was) return;
    set({
      list: {
        ...was,
        items: was.items.map((item) =>
          item.isbn13 === isbn13
            ? { ...item, note: note.trim() || null }
            : item,
        ),
      },
    });
    try {
      await saveToBuyNote(isbn13, note);
    } catch (e) {
      set({ list: was });
      throw e;
    }
  },
  setOrder: async (isbns) => {
    const was = get().list;
    if (!was) return;
    const place = new Map(isbns.map((isbn, at) => [isbn, at]));
    set({
      list: {
        ...was,
        items: was.items.map((item) => ({
          ...item,
          position: place.get(item.isbn13) ?? item.position ?? null,
        })),
      },
    });
    try {
      await saveToBuyOrder(isbns);
    } catch (e) {
      set({ list: was });
      throw e;
    }
  },
  reset: () => set({ list: null, loadFailed: false }),
}));

export const loadToBuyOnce = () => {
  const { list, load } = useToBuy.getState();
  if (!list) void load();
};
