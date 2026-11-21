// Who's signed in, as the web's store/auth.ts: the session cookie and
// /api/auth/me decide. null while asking
import { create } from "zustand";
import { apiFetch, errorMessages } from "@/core/lib/api";

type AuthState = {
  isSignedIn: boolean | null;
  check: () => Promise<void>;
  // the server's messages when it says no; none when it's done
  signIn: (username: string, password: string) => Promise<string[]>;
  // a new account, signed in once made; the server's messages when it says no
  signUp: (
    username: string,
    password: string,
    email: string,
  ) => Promise<string[]>;
  logOut: () => Promise<void>;
};

export const useAuth = create<AuthState>()((set) => ({
  isSignedIn: null,

  check: async () => {
    try {
      const res = await apiFetch("/api/auth/me");
      set({ isSignedIn: res.ok });
    } catch {
      // the server didn't answer, which says nothing about their session
      set({ isSignedIn: false });
    }
  },

  signIn: async (username, password) => {
    const res = await apiFetch("/api/auth/login", {
      method: "POST",
      body: { username, password },
    });
    if (res.status === 200) {
      set({ isSignedIn: true });
      return [];
    }
    return errorMessages(res);
  },

  signUp: async (username, password, email) => {
    const res = await apiFetch("/api/auth/signup", {
      method: "POST",
      body: { username, password, ...(email ? { email } : {}) },
    });
    if (res.ok) {
      set({ isSignedIn: true });
      return [];
    }
    return errorMessages(res);
  },

  logOut: async () => {
    const res = await apiFetch("/api/auth/logout", { method: "POST" });
    if (res.ok) set({ isSignedIn: false });
  },
}));
