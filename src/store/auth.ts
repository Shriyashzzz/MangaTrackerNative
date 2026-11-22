// Who's signed in, as the web's store/auth.ts: the session cookie and
// /api/auth/me decide. null while asking
import { loadDeviceStore, readLocal, writeLocal } from "@/lib/deviceStore";
import { create } from "zustand";
import { apiFetch, errorMessages, whenSignedOut } from "@/core/lib/api";
import { forgetGoogle } from "@/lib/googleSignIn";
import { forgetThisPhone } from "@/lib/phoneAlerts";

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
  // Google's token for the server to check; the response, for its words
  signInWithGoogle: (credential: string) => Promise<Response>;
  logOut: () => Promise<void>;
};

const SIGNED_IN = "signedInBefore";

export const useAuth = create<AuthState>()((set) => ({
  isSignedIn: null,

  check: async () => {
    // what this phone remembers must be read first (it's asked below)
    await loadDeviceStore();
    try {
      const res = await apiFetch("/api/auth/me");
      set({ isSignedIn: res.ok });
    } catch {
      // The server didn't answer, which says nothing about their session:
      // they're taken as they were last time. Signed in before, they get
      // their kept shelf and can go on offline; calling it signed out here
      // would throw that shelf and their unsent changes away
      set({ isSignedIn: readLocal(SIGNED_IN) === "yes" });
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

  signInWithGoogle: async (credential) => {
    const res = await apiFetch("/api/auth/google", {
      method: "POST",
      body: { credential },
    });
    if (res.ok) set({ isSignedIn: true });
    return res;
  },

  logOut: async () => {
    // while still signed in: the server forgets this phone, so the next
    // person on it gets none of this account's alerts
    await forgetThisPhone();
    const res = await apiFetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      set({ isSignedIn: false });
      void forgetGoogle();
    }
  },
}));

// whether they were signed in is remembered on the phone, for a start with
// no connection (check, above)
useAuth.subscribe((state) => {
  if (state.isSignedIn !== null)
    writeLocal(SIGNED_IN, state.isSignedIn ? "yes" : "no");
});

// the server says the session is gone (it lapsed, or the account was signed
// out everywhere): the app goes back to its signed-out screens, where a
// request that needs an account would only fail again
whenSignedOut(() => {
  if (useAuth.getState().isSignedIn) useAuth.setState({ isSignedIn: false });
});
