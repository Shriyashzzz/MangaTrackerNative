// What's kept on this device apart from the account: the web keeps these in
// the browser's storage (lib/prefs.ts readLocal / writeLocal), read in one
// go. The app loads every key once at start (app/_layout.tsx awaits it),
// then reads from memory and writes through, so the shared hooks can read a
// value without waiting
import AsyncStorage from "@react-native-async-storage/async-storage";

const kept = new Map<string, string>();
let loaded: Promise<void> | null = null;

export function loadDeviceStore() {
  loaded ??= (async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      for (const [key, value] of await AsyncStorage.multiGet(keys))
        if (value !== null) kept.set(key, value);
    } catch {
      // nothing kept yet, or storage unreadable: the defaults hold
    }
  })();
  return loaded;
}

export const readLocal = (key: string) => kept.get(key) ?? null;

export const writeLocal = (key: string, value: string) => {
  kept.set(key, value);
  AsyncStorage.setItem(key, value).catch(() => {});
};

export const removeLocal = (key: string) => {
  kept.delete(key);
  AsyncStorage.removeItem(key).catch(() => {});
};
