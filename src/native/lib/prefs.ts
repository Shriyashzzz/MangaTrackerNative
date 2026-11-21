// The app's stand-in for the web's lib/prefs.ts: the settings the shared
// hooks read, from the app's prefs store (store/prefs.ts)
import { usePrefs } from "@/store/prefs";

// which to buy first: the next after theirs, or their gaps (Settings, Next
// in line)
export const useNextFor = () => usePrefs((s) => s.prefs.nextFor ?? "after");
