// The account's settings (GET /api/prefs), as the web's lib/prefs.ts reads
// them on sign-in: the defaults, then whatever the account chose. Prices'
// country is passed on to core's country stand-in
import { create } from "zustand";
import { apiFetch } from "@/core/lib/api";
import { useAuth } from "./auth";
import { setCountry } from "@/core/lib/country";
import type { Prefs } from "@/core/lib/types";

// what's never been chosen counts as these (the web's syncPrefs)
const DEFAULTS: Prefs = {
  releaseChecks: "on",
  trackBy: "series",
  nextFor: "after",
};

type PrefsState = {
  prefs: Prefs;
  load: () => Promise<void>;
  // applies a change right away, and keeps it on the account (the web's
  // savePrefs). Throws when the server turns it down
  save: (patch: Prefs) => Promise<void>;
  // on signing out: the next account starts from the defaults
  reset: () => void;
};

export const usePrefs = create<PrefsState>()((set, get) => ({
  prefs: DEFAULTS,
  save: async (patch) => {
    const was = get().prefs;
    const prefs = { ...was, ...patch };
    if (patch.country) setCountry(patch.country === "ca" ? "ca" : "us");
    set({ prefs });
    // no account: the choice holds for this visit, nothing to save it to
    if (!useAuth.getState().isSignedIn) return;
    try {
      const res = await apiFetch("/api/prefs", { method: "PUT", body: patch });
      if (!res.ok) throw new Error("That didn't save. Try again.");
    } catch (e) {
      set({ prefs: was });
      throw e;
    }
  },
  reset: () => set({ prefs: DEFAULTS }),
  load: async () => {
    try {
      const res = await apiFetch("/api/prefs");
      if (!res.ok) return;
      const stored = (await res.json()) as Prefs;
      const prefs = { ...DEFAULTS, ...stored };
      setCountry(prefs.country === "ca" ? "ca" : "us");
      set({ prefs });
    } catch {
      // the defaults hold until it answers
    }
  },
}));
