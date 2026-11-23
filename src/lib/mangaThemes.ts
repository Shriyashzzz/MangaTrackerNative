// Premium's manga themes, on the iPhone: eight whole looks, each a genre,
// with its own palette (src/global.css), its own drawing behind the pages
// (components/ThemeBackdrop.tsx) and its own sound effect. Chosen on this
// phone only (the account's light or dark stays the website's), and worn
// only while Premium is theirs: without it the app is light or dark again
import { Platform } from "react-native";
import { readLocal, removeLocal, writeLocal } from "@/lib/deviceStore";
import { create } from "zustand";
import { usePlan } from "@/store/plan";

export type MangaTheme =
  | "shonen"
  | "shojo"
  | "seinen"
  | "isekai"
  | "cozy"
  | "horror"
  | "sports"
  | "mecha";

export const MANGA_THEMES: {
  id: MangaTheme;
  name: string;
  tagline: string;
  // its sound effect, lettered behind the pages
  sfx: string;
  // its stamp word
  stamp: string;
  dark: boolean;
  // for its card in Settings: paper, ink, accent
  swatch: [string, string, string];
}[] = [
  {
    id: "shonen",
    name: "Shōnen",
    tagline: "Hype, every chapter",
    sfx: "ドドド",
    stamp: "Hype!",
    dark: false,
    swatch: ["#fff4d6", "#141414", "#e8361c"],
  },
  {
    id: "shojo",
    name: "Shōjo",
    tagline: "Hearts in every panel",
    sfx: "キラキラ",
    stamp: "Kyun!",
    dark: false,
    swatch: ["#fdf0f3", "#4a2a36", "#d4567a"],
  },
  {
    id: "seinen",
    name: "Seinen",
    tagline: "Ink, rain and quiet",
    sfx: "ゴゴゴ",
    stamp: "…",
    dark: false,
    swatch: ["#e6e1d6", "#0f0e0c", "#7a1f14"],
  },
  {
    id: "isekai",
    name: "Isekai",
    tagline: "Your shelf, another world",
    sfx: "",
    stamp: "Level up!",
    dark: false,
    swatch: ["#f1e6cc", "#2b2016", "#2f5fa8"],
  },
  {
    id: "cozy",
    name: "Slice of life",
    tagline: "Tea, rain, one more chapter",
    sfx: "ほっ",
    stamp: "Cozy",
    dark: false,
    swatch: ["#f4efe6", "#3a3328", "#5f7f4d"],
  },
  {
    id: "horror",
    name: "Horror",
    tagline: "Read with the lights on",
    sfx: "ゾクッ",
    stamp: "ゾクッ",
    dark: true,
    swatch: ["#141210", "#e9e2d3", "#b3241f"],
  },
  {
    id: "sports",
    name: "Sports",
    tagline: "One more match, one more volume",
    sfx: "バシッ",
    stamp: "Nice!",
    dark: false,
    swatch: ["#eef3f7", "#0f2238", "#c94f0c"],
  },
  {
    id: "mecha",
    name: "Mecha",
    tagline: "Systems online. Shelf loaded.",
    sfx: "ガシャン",
    stamp: "Sync 100%",
    dark: true,
    swatch: ["#1b2026", "#dfe7ee", "#3fd0ff"],
  },
];

// themes are an iPhone thing
export const THEMES_HERE = Platform.OS === "ios";

const KEY = "mangaTheme";
const isTheme = (v: string | null): v is MangaTheme =>
  MANGA_THEMES.some((t) => t.id === v);

type LookState = {
  // the one picked on this phone, worn while Premium is theirs
  picked: MangaTheme | null;
  pick: (theme: MangaTheme | null) => void;
};

export const useLook = create<LookState>()((set) => ({
  picked: null,
  pick: (theme) => {
    if (theme) writeLocal(KEY, theme);
    else removeLocal(KEY);
    set({ picked: theme });
  },
}));

// once the device store is read (app/_layout.tsx)
export function loadLook() {
  const kept = readLocal(KEY);
  useLook.setState({ picked: isTheme(kept) ? kept : null });
}

export const themeOf = (id: MangaTheme | null) =>
  MANGA_THEMES.find((t) => t.id === id) ?? null;

// the theme being worn now: one picked here, on an iPhone, with Premium
// (where the limits hold, a free account wears none)
export function useWornTheme(): MangaTheme | null {
  const picked = useLook((s) => s.picked);
  const premium = usePlan((s) => !s.plan.limited);
  return THEMES_HERE && premium ? picked : null;
}
