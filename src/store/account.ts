// Who's signed in: their profile and settings (GET /api/account), as the
// web's store/account.ts keeps them. The calls are the web's (core lib/account)
import { create } from "zustand";
import {
  getAccount,
  linkGoogle,
  saveAccount,
  setFirstPassword,
  setWeeklyEmail,
  type Account,
} from "@/core/lib/account";

type AccountState = {
  account: Account | null;
  loadFailed: boolean;
  load: () => Promise<void>;
  save: (patch: Parameters<typeof saveAccount>[0]) => Promise<void>;
  weeklyEmail: (on: boolean) => Promise<void>;
  linkGoogle: (credential: string) => Promise<void>;
  firstPassword: (password: string) => Promise<void>;
  clear: () => void;
};

export const useAccount = create<AccountState>()((set) => ({
  account: null,
  loadFailed: false,
  load: async () => {
    try {
      set({ account: await getAccount(), loadFailed: false });
    } catch {
      set({ loadFailed: true });
    }
  },
  save: async (patch) => {
    set({ account: await saveAccount(patch) });
  },
  weeklyEmail: async (on) => {
    set({ account: await setWeeklyEmail(on) });
  },
  linkGoogle: async (credential) => {
    set({ account: await linkGoogle(credential) });
  },
  firstPassword: async (password) => {
    set({ account: await setFirstPassword(password) });
  },
  clear: () => set({ account: null, loadFailed: false }),
}));
