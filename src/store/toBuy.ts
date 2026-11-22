// The To buy list (the bag in the top bar), as the web's store/toBuy.ts
import { create } from "zustand";
import {
  addToBuy,
  clearToBuy,
  getToBuy,
  removeToBuy,
  saveToBuyAlert,
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
  // one item off the list on screen at once, before the server has
  // answered. Hands back the way to put it back, for when the server refuses
  drop: (isbn13: string) => () => void;
  clear: () => Promise<void>;
  // their own note on one item, and their own order for the list: shown at
  // once, put back if the server doesn't take it (the error is thrown on)
  setNote: (isbn13: string, note: string) => Promise<void>;
  // the price to be told at, in cents; null takes it off
  setAlert: (isbn13: string, alertCents: number | null) => Promise<void>;
  setOrder: (isbns: string[]) => Promise<void>;
  reset: () => void;
};

// the list's totals, added up here as the server adds them (its toBuy.ts
// toBuyTotals): each kind over the volumes that have a price of that kind
function totalsOf(items: ToBuyList["items"]): ToBuyList["totals"] {
  const sum = (kind: "new" | "used") => {
    const priced = items.flatMap((item) => (item[kind] ? [item[kind]] : []));
    return {
      cents: priced.reduce((total, price) => total + price.cents, 0),
      volumes: priced.length,
    };
  };
  return { volumes: items.length, new: sum("new"), used: sum("used") };
}

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
  drop: (isbn13) => {
    const was = get().list;
    if (!was) return () => {};
    const items = was.items.filter((item) => item.isbn13 !== isbn13);
    set({ list: { items, totals: totalsOf(items) } });
    // only if nothing else has changed the list since
    return () => {
      if (get().list?.items === items) set({ list: was });
      else void get().load();
    };
  },
  // gone from the screen at once; back if the server doesn't take it
  remove: async (isbn13) => {
    const putBack = get().drop(isbn13);
    try {
      await removeToBuy(isbn13);
    } catch (e) {
      putBack();
      throw e;
    }
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
  setAlert: async (isbn13, alertCents) => {
    const was = get().list;
    if (!was) return;
    set({
      list: {
        ...was,
        items: was.items.map((item) =>
          item.isbn13 === isbn13 ? { ...item, alertCents } : item,
        ),
      },
    });
    try {
      await saveToBuyAlert(isbn13, alertCents);
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
