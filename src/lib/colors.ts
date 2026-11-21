// The theme's colours as values, for what takes a colour rather than a class
// (icons, the drawings, the status bar): the same tokens as src/global.css,
// light or dark
import { useCSSVariable } from "uniwind";

const NAMES = [
  "--color-ink",
  "--color-ink-soft",
  "--color-muted",
  "--color-accent",
  "--color-accent-ink",
  "--color-on-accent",
  "--color-paper",
  "--color-paper-2",
  "--color-card",
  "--color-line",
  "--color-line-soft",
  "--color-star",
  "--color-star-off",
] as const;

export type Palette = {
  ink: string;
  inkSoft: string;
  muted: string;
  accent: string;
  accentInk: string;
  onAccent: string;
  paper: string;
  paper2: string;
  card: string;
  line: string;
  lineSoft: string;
  star: string;
  starOff: string;
};

export function useColors(): Palette {
  const [
    ink,
    inkSoft,
    muted,
    accent,
    accentInk,
    onAccent,
    paper,
    paper2,
    card,
    line,
    lineSoft,
    star,
    starOff,
  ] = useCSSVariable([...NAMES]) as string[];
  return {
    ink,
    inkSoft,
    muted,
    accent,
    accentInk,
    onAccent,
    paper,
    paper2,
    card,
    line,
    lineSoft,
    star,
    starOff,
  } as Palette;
}
