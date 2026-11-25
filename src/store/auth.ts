// Who's signed in, as the web's store/auth.ts: the session cookie and
// /api/auth/me decide. null while asking
import { endDemo, isDemo } from "@/core/lib/demo";
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
  // Apple's identity token, and the first name Apple gave (first time only)
  signInWithApple: (
    identityToken: string,
    name: string | null,
  ) => Promise<Response>;
  logOut: () => Promise<void>;
  // the account was just deleted: signed out on this phone at once
  accountDeleted: () => void;
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

  signInWithApple: async (identityToken, name) => {
    const res = await apiFetch("/api/auth/apple", {
      method: "POST",
      body: { identityToken, name },
    });
    if (res.ok) set({ isSignedIn: true });
    return res;
  },

  logOut: async () => {
    // "signing out" of the practice shelf is leaving it (lib/practice.ts
    // hears of it and takes the app back to its front)
    if (isDemo()) return endDemo("/");
    // while still signed in: the server forgets this phone, so the next
    // person on it gets none of this account's alerts
    await forgetThisPhone();
    const res = await apiFetch("/api/auth/logout", { method: "POST" });
    if (res.ok) {
      set({ isSignedIn: false });
      void forgetGoogle();
    }
  },

  // The server has already ended the session and removed this phone's alerts
  // with the account, so nothing is asked of it: the phone forgets the account
  // straight away. Waiting on a request first left a moment where closing the
  // app kept the account remembered here, and it opened as if still signed in
  accountDeleted: () => {
    set({ isSignedIn: false });
    void forgetThisPhone();
    void forgetGoogle();
  },
}));

// whether they were signed in is remembered on the phone, for a start with
// no connection (check, above)
// (the practice shelf isn't an account: it's never remembered as one)
useAuth.subscribe((state) => {
  if (state.isSignedIn !== null && !isDemo())
    writeLocal(SIGNED_IN, state.isSignedIn ? "yes" : "no");
});

// the server says the session is gone (it lapsed, or the account was signed
// out everywhere): the app goes back to its signed-out screens, where a
// request that needs an account would only fail again
whenSignedOut(() => {
  if (useAuth.getState().isSignedIn) useAuth.setState({ isSignedIn: false });
});
