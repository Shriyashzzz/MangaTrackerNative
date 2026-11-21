// The theme's colours as values, for what takes a colour rather than a class
// (icons, the status bar): the same tokens as src/global.css, light or dark
import { useCSSVariable } from "uniwind";

const NAMES = [
  "--color-ink",
  "--color-ink-soft",
  "--color-muted",
  "--color-accent",
  "--color-accent-ink",
  "--color-paper",
  "--color-card",
  "--color-line",
  "--color-star",
  "--color-star-off",
] as const;

export function useColors() {
  const [
    ink,
    inkSoft,
    muted,
    accent,
    accentInk,
    paper,
    card,
    line,
    star,
    starOff,
  ] = useCSSVariable([...NAMES]) as string[];
  return {
    ink,
    inkSoft,
    muted,
    accent,
    accentInk,
    paper,
    card,
    line,
    star,
    starOff,
  };
}
