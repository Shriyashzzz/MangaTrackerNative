// Who's signed in, as the web's store/auth.ts: the session cookie and
// /api/auth/me decide. null while asking
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

// the server says the session is gone (it lapsed, or the account was signed
// out everywhere): the app goes back to its signed-out screens, where a
// request that needs an account would only fail again
whenSignedOut(() => {
  if (useAuth.getState().isSignedIn) useAuth.setState({ isSignedIn: false });
});
