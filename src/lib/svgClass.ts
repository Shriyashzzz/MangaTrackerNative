// The web's drawings colour their shapes with Tailwind classes ("fill-card
// stroke-line stroke-[3]"). Converted for the app (scripts/sync-core.mjs),
// each class string comes here and becomes the shape's props, in the theme's
// colours. The palette is set by whoever draws (components/Mascot.tsx,
// components/Avatar.tsx) from useColors, before the shapes render
import type { Palette } from "./colors";

let palette: Palette | null = null;
export const setSvgPalette = (next: Palette) => {
  palette = next;
};

// "paper-2" → palette.paper2, "ink-soft" → inkSoft
const colorOf = (token: string): string | undefined => {
  if (!palette) return undefined;
  const key = token.replace(/-([a-z0-9])/g, (_, ch: string) =>
    ch.toUpperCase(),
  ) as keyof Palette;
  return palette[key];
};

// #rrggbb mixed: "color-mix(in srgb, var(--accent) 45%, var(--card))"
function mix(a: string, b: string, shareOfA: number) {
  const hex = (s: string) =>
    s
      .replace("#", "")
      .match(/.{2}/g)!
      .map((h) => parseInt(h, 16));
  const [ra, ga, ba] = hex(a);
  const [rb, gb, bb] = hex(b);
  const part = (x: number, y: number) =>
    Math.round(x * shareOfA + y * (1 - shareOfA));
  return `rgb(${part(ra!, rb!)}, ${part(ga!, gb!)}, ${part(ba!, bb!)})`;
}
const colorMix = (inside: string) => {
  const m = inside.match(/var\(--([a-z0-9-]+)\)_(\d+)%,var\(--([a-z0-9-]+)\)/);
  if (!m) return undefined;
  const a = colorOf(m[1]!);
  const b = colorOf(m[3]!);
  return a && b && /^#/.test(a) && /^#/.test(b)
    ? mix(a, b, Number(m[2]) / 100)
    : a;
};

type ShapeProps = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  strokeLinecap?: "round";
  strokeLinejoin?: "round";
  opacity?: number;
  fontFamily?: string;
  fontSize?: number;
};

const cache = new Map<string, ShapeProps>();

export function svgClass(classes: string): ShapeProps {
  const key = `${palette?.ink ?? ""}|${classes}`;
  const had = cache.get(key);
  if (had) return had;
  const props: ShapeProps = {};
  for (const token of classes.split(/\s+/)) {
    let m: RegExpMatchArray | null;
    if (token === "fill-none") props.fill = "none";
    else if ((m = token.match(/^fill-\[color-mix\((.+)\)\]$/)))
      props.fill = colorMix(m[1]!);
    else if ((m = token.match(/^fill-([a-z0-9-]+)$/)))
      props.fill = colorOf(m[1]!);
    else if ((m = token.match(/^stroke-\[([\d.]+)\]$/)))
      props.strokeWidth = Number(m[1]);
    else if ((m = token.match(/^stroke-(\d+(?:\.\d+)?)$/)))
      props.strokeWidth = Number(m[1]);
    else if ((m = token.match(/^stroke-([a-z0-9-]+)$/)))
      props.stroke = colorOf(m[1]!);
    else if (token === "[stroke-linecap:round]") props.strokeLinecap = "round";
    else if (token === "[stroke-linejoin:round]")
      props.strokeLinejoin = "round";
    else if ((m = token.match(/^opacity-(\d+)$/)))
      props.opacity = Number(m[1]) / 100;
    else if (token === "font-brand") props.fontFamily = "Bangers_400Regular";
    else if ((m = token.match(/^text-\[(\d+)px\]$/)))
      props.fontSize = Number(m[1]);
    // size and layout classes mean nothing to a shape
  }
  cache.set(key, props);
  return props;
}
