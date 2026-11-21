// The app's stand-in for the web's lib/recentSearches.ts: the last series
// searched for, kept on this device (lib/deviceStore)
import { readLocal, writeLocal } from "@/lib/deviceStore";

const KEY = "recentSearches";
const MOST = 6;

export const recentSearches = (): string[] => {
  try {
    const list = JSON.parse(readLocal(KEY) ?? "[]") as unknown;
    return Array.isArray(list)
      ? list.filter((s): s is string => typeof s === "string")
      : [];
  } catch {
    return [];
  }
};

export const rememberSearch = (name: string) => {
  const list = [name, ...recentSearches().filter((s) => s !== name)].slice(
    0,
    MOST,
  );
  writeLocal(KEY, JSON.stringify(list));
};
