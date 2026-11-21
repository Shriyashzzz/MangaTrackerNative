// The account's settings (GET /api/prefs), as the web's lib/prefs.ts reads
// them on sign-in: the defaults, then whatever the account chose. Prices'
// country is passed on to core's country stand-in
import { create } from "zustand";
import { apiFetch } from "@/core/lib/api";
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
};

export const usePrefs = create<PrefsState>()((set) => ({
  prefs: DEFAULTS,
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
