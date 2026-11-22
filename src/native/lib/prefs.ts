// The app's stand-in for the web's lib/prefs.ts: the settings the shared
// hooks read, from the app's prefs store (store/prefs.ts), and what's kept
// on this device alone (lib/deviceStore.ts)
import { usePrefs } from "@/store/prefs";

export { readLocal, writeLocal } from "@/lib/deviceStore";

// which to buy first: the next after theirs, or their gaps (Settings, Next
// in line)
export const useNextFor = () => usePrefs((s) => s.prefs.nextFor ?? "after");

// the shelf's layout, for Kenji's script (the web offers compact rows on a
// step; the app's shelf is rows only)
export const shelfViewNow = (): "rows" | "covers" => "rows";
