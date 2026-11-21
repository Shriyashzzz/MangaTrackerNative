// The light theme's colours, for drawings that keep them in dark mode too
// (the web's .printed wrapper): Kenji and the profile pictures are printed
// on paper, and don't draw well in dark ink. The values are src/global.css's
// light theme: change both together
import type { Palette } from "./colors";

export const PRINTED: Palette = {
  ink: "#1d1a16",
  inkSoft: "#4a443b",
  muted: "#6f6758",
  accent: "#b14a3c",
  accentInk: "#963d31",
  onAccent: "#fffaf2",
  paper: "#f3eee2",
  paper2: "#e9e2d1",
  card: "#fbf8f0",
  line: "#1d1a16",
  lineSoft: "#d6ccb7",
  star: "#d99a00",
  starOff: "#7f7562",
};
