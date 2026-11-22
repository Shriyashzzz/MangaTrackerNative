// The page backgrounds of the Android app (the web's styles/backdrop.css and
// the markup in its index.html), drawn behind every screen: the comic
// lettering "ドン" (the default), an ink brush circle, a stack of pages, or manga
// panels. Which one is the account's choice (Settings, Appearance). Nothing
// here takes a touch
import { useWindowDimensions, View } from "react-native";
import Svg, {
  ClipPath,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Pattern,
  Polygon,
  Rect,
  Stop,
} from "react-native-svg";
import type { Background } from "@/core/lib/types";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";

export const BACKGROUNDS: { value: Background; label: string }[] = [
  { value: "sfx", label: "Comic lettering" },
  { value: "ink", label: "Ink brush" },
  { value: "pages", label: "Stack of pages" },
  { value: "panels", label: "Panels" },
];
export const DEFAULT_BACKGROUND: Background = "sfx";

// ド and ン as outlines, from the web's own two-glyph cut of Dela Gothic One
// (SIL Open Font License): 1000 units to the em, y pointing up
const DO =
  "M879 183Q673 257 395 313V-5H113Q120 163 121.5 331.0Q123 499 123 751H395V544Q527 528 683.5 496.0Q840 464 971 427Q937 373 919.0 320.5Q901 268 879 183ZM850 531Q834 601 793 686L873 711Q910 637 931 557ZM746 498Q727 576 688 653L768 678Q808 599 826 524Z";
const N =
  "M23 243Q210 243 332.5 267.5Q455 292 543 348Q623 399 667.0 495.0Q711 591 728 738Q788 717 846.5 701.5Q905 686 990 666Q966 480 899.5 364.0Q833 248 717 166Q613 92 474.0 52.0Q335 12 130 -7Q108 74 86.5 129.5Q65 185 23 243ZM422 401Q298 447 222.0 469.0Q146 491 10 518Q57 563 106.0 623.5Q155 684 178 724Q304 689 403.0 656.0Q502 623 603 581Z";
const EM = 1000;

// a hex colour is dark when its channels average under half
function isDark(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex.trim());
  if (!m) return false;
  return (
    (parseInt(m[1]!, 16) + parseInt(m[2]!, 16) + parseInt(m[3]!, 16)) / 3 < 128
  );
}

export default function Backdrop({
  soft = false,
}: {
  // behind a list read line by line (the shelf): fainter, so it stays back
  soft?: boolean;
}) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const picked = usePrefs((s) => s.prefs.background ?? DEFAULT_BACKGROUND);
  const dark = isDark(c.paper);

  let drawing = null;
  if (picked === "sfx") {
    // one giant sound effect, outlined and hatched like printed lettering,
    // tilted, near the right edge at mid height
    const size = Math.min(height * 0.45, width * 0.28);
    const scale = size / EM;
    const ink = dark ? "#2c2820" : "#e0d7c3";
    const wide = size * 2 * 0.96;
    const left = width - width * 0.02 - wide;
    const top = height / 2 - size / 2;
    // the hatching is sized in the letters' own units (they're drawn scaled
    // down from 1000 to the em), so it comes out 2 points every 10
    const unit = 1 / scale;
    const place = `rotate(-7 ${left + wide / 2} ${height / 2}) translate(${left} ${top + size * 0.86}) scale(${scale} ${-scale})`;
    drawing = (
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id="hatch"
            width={10 * unit}
            height={10 * unit}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <Rect width={10 * unit} height={2 * unit} fill={ink} />
          </Pattern>
        </Defs>
        <G transform={place}>
          {[DO, N].map((d, i) => (
            <G key={i} transform={`translate(${i * EM * 0.96} 0)`}>
              <Path d={d} fill="url(#hatch)" />
              <Path d={d} fill="none" stroke={ink} strokeWidth={2 * unit} />
            </G>
          ))}
        </G>
      </Svg>
    );
  } else if (picked === "ink") {
    // a single brush circle, half off the left edge
    const size = Math.min(width * 0.78, 1000);
    drawing = (
      <Svg
        width={size}
        height={size}
        viewBox="0 0 1000 1000"
        opacity={dark ? 0.08 : 0.11}
        style={{
          position: "absolute",
          left: Math.max(-width * 0.34, -420),
          top: height / 2 - size * 0.46,
        }}
      >
        <Defs>
          <LinearGradient id="load" x1="0.2" y1="1" x2="0.8" y2="0">
            <Stop offset="0" stopColor={c.ink} />
            <Stop offset="0.6" stopColor={c.ink} stopOpacity={0.85} />
            <Stop offset="1" stopColor={c.ink} stopOpacity={0.45} />
          </LinearGradient>
        </Defs>
        <Path
          fill="url(#load)"
          d="M331.0 862.5 A400 400 0 1 1 569.5 893.9 Q591.7 863.1 594.0 860.2 A330 330 0 1 0 388.5 785.1 Z"
        />
      </Svg>
    );
  } else if (picked === "pages") {
    // a phone is one sheet of the stack, edge to edge
    drawing = <View style={{ flex: 1, backgroundColor: c.card }} />;
  } else {
    // the screen cut into four panels by slanted gutters, each with its tone
    const rule = dark ? "rgba(238, 230, 212, 0.16)" : "rgba(29, 26, 22, 0.32)";
    const x = (part: number, by = 0) => width * part + by;
    const y = (part: number, by = 0) => height * part + by;
    const pts = (list: [number, number][]) =>
      list.map(([px, py]) => `${px},${py}`).join(" ");
    const one = pts([
      [0, 0],
      [x(0.46, -8), 0],
      [x(0.41, -8), y(0.4, -8)],
      [0, y(0.44, -8)],
    ]);
    const two = pts([
      [x(0.46, 8), 0],
      [width, 0],
      [width, y(0.34, -8)],
      [x(0.41, 8), y(0.4, -8)],
    ]);
    const three = pts([
      [0, y(0.44, 8)],
      [x(0.62, -8), y(0.38, 8)],
      [x(0.58, -8), height],
      [0, height],
    ]);
    const four = pts([
      [x(0.62, 8), y(0.38, 8)],
      [width, y(0.34, 8)],
      [width, height],
      [x(0.58, 8), height],
    ]);
    // speed lines fanning from the top right corner, for the second panel
    const fan = Array.from({ length: 23 }, (_, i) => {
      const angle = (Math.PI / 2) * (i / 22);
      const reach = width + height;
      return [
        width - Math.cos(angle) * reach,
        Math.sin(angle) * reach,
      ] as const;
    });
    drawing = (
      <Svg width={width} height={height}>
        <Defs>
          <Pattern
            id="tone"
            width={7}
            height={7}
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(-45)"
          >
            <Rect width={7} height={1} fill={c.lineSoft} />
          </Pattern>
          <ClipPath id="second">
            <Polygon points={two} />
          </ClipPath>
        </Defs>
        <Polygon points={one} fill={c.paper2} stroke={rule} strokeWidth={1.5} />
        <Polygon points={two} fill={c.card} stroke={rule} strokeWidth={1.5} />
        <G clipPath="url(#second)">
          {fan.map(([fx, fy], i) => (
            <Line
              key={i}
              x1={width}
              y1={0}
              x2={fx}
              y2={fy}
              stroke={c.lineSoft}
              strokeWidth={1}
              opacity={0.6}
            />
          ))}
        </G>
        <Polygon points={three} fill={c.paper} />
        <Polygon
          points={three}
          fill="url(#tone)"
          stroke={rule}
          strokeWidth={1.5}
        />
        <Polygon
          points={four}
          fill={c.paper2}
          stroke={rule}
          strokeWidth={1.5}
        />
      </Svg>
    );
  }
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        opacity: soft ? 0.45 : 1,
      }}
    >
      {drawing}
    </View>
  );
}
