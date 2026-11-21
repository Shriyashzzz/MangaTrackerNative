// The To buy list (the bag in the top bar), as the web's store/toBuy.ts
import { create } from "zustand";
import {
  addToBuy,
  clearToBuy,
  getToBuy,
  removeToBuy,
  type ToBuyList,
} from "@/core/lib/toBuy";

type ToBuyState = {
  list: ToBuyList | null;
  loadFailed: boolean;
  load: () => Promise<void>;
  add: (isbn13: string) => Promise<void>;
  remove: (isbn13: string) => Promise<void>;
  clear: () => Promise<void>;
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
  reset: () => set({ list: null, loadFailed: false }),
}));

export const loadToBuyOnce = () => {
  const { list, load } = useToBuy.getState();
  if (!list) void load();
};
