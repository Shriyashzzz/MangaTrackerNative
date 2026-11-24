// What floats at the shelf's foot: the + button (where it sits, whether
// it's on screen now) and the dock of Select's buttons, so what else
// floats there (Kenji's tour) keeps clear of them
import { create } from "zustand";

export const PLUS_SIZE = 56;
// from the screen's right edge: an iPad's corners are rounder, so more room
export const PLUS_RIGHT = 16;
export const PLUS_RIGHT_PAD = 36;

// set by the shelf page; false on every other page. `top`: where the +
// starts on the screen, as measured there (null until it is)
export const usePlusShown = create<{
  shown: boolean;
  dock: boolean;
  top: number | null;
}>(() => ({ shown: false, dock: false, top: null }));
