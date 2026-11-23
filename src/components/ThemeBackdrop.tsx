// The drawing behind the pages in a manga theme (lib/mangaThemes.ts): each
// genre's own, faint, with its sound effect lettered across it. Nothing
// here takes a touch
import { Text, useWindowDimensions, View } from "react-native";
import Svg, {
  Circle,
  Defs,
  Line,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { themeOf, type MangaTheme } from "@/lib/mangaThemes";
import { useColors } from "@/lib/colors";

// a sound effect, big and faint; `down` sets it top to bottom, a letter a
// line, as it would run down a page
function Sfx({
  text,
  color,
  size,
  at,
  tilt = 0,
  down = false,
}: {
  text: string;
  color: string;
  size: number;
  at: { right?: number; left?: number; top: number };
  tilt?: number;
  down?: boolean;
}) {
  return (
    <View
      style={{
        position: "absolute",
        ...at,
        // faint, as lettering printed behind the page
        opacity: 0.14,
        transform: [{ rotate: `${tilt}deg` }],
      }}
    >
      {(down ? [...text] : [text]).map((part, i) => (
        <Text
          key={i}
          style={{
            color,
            fontSize: size,
            lineHeight: size * 1.05,
            fontWeight: "900",
            textAlign: "center",
          }}
        >
          {part}
        </Text>
      ))}
    </View>
  );
}

// a four-pointed sparkle
const SPARKLE = "M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5z";

export default function ThemeBackdrop({ theme }: { theme: MangaTheme }) {
  const c = useColors();
  const { width: w, height: h } = useWindowDimensions();
  const sfx = themeOf(theme)!.sfx;
  const faint = (alpha: number) => ({ opacity: alpha });
  let art = null;
  if (theme === "shonen") {
    // speed rays bursting in from the right
    const cx = w * 1.1;
    const cy = h * 0.3;
    const reach = w + h;
    const rays = Array.from({ length: 40 }, (_, i) => {
      const a = (i / 40) * Math.PI * 2;
      const b = a + Math.PI / 40;
      return `${cx},${cy} ${cx + Math.cos(a) * reach},${cy + Math.sin(a) * reach} ${cx + Math.cos(b) * reach},${cy + Math.sin(b) * reach}`;
    });
    art = (
      <>
        <Svg width={w} height={h} style={faint(0.12)}>
          {rays.map((points, i) => (
            <Polygon key={i} points={points} fill={c.accent} />
          ))}
        </Svg>
        <Sfx
          text={sfx}
          color={c.accent}
          size={120}
          at={{ right: -4, top: h * 0.32 }}
          tilt={-10}
        />
      </>
    );
  } else if (theme === "shojo") {
    const sparks: [number, number, number][] = [
      [0.84, 0.18, 18],
      [0.78, 0.21, 10],
      [0.1, 0.62, 14],
      [0.82, 0.76, 22],
      [0.5, 0.11, 9],
      [0.2, 0.35, 12],
    ];
    art = (
      <>
        {sparks.map(([x, y, s], i) => (
          <Svg
            key={i}
            width={s}
            height={s}
            viewBox="0 0 24 24"
            style={{
              position: "absolute",
              left: w * x,
              top: h * y,
              opacity: 0.55,
            }}
          >
            <Path d={SPARKLE} fill={c.star} />
          </Svg>
        ))}
        <Sfx
          text={sfx}
          color={c.accent}
          size={56}
          at={{ right: 10, top: h * 0.46 }}
          down
        />
      </>
    );
  } else if (theme === "seinen") {
    // rain, and a brush circle half off the left
    art = (
      <>
        <Svg width={w} height={h} style={faint(0.06)}>
          {Array.from({ length: Math.ceil(w / 22) + 10 }, (_, i) => (
            <Line
              key={i}
              x1={i * 22}
              y1={0}
              x2={i * 22 - h * 0.18}
              y2={h}
              stroke={c.ink}
              strokeWidth={1}
            />
          ))}
        </Svg>
        <Svg
          width={320}
          height={320}
          style={{
            position: "absolute",
            left: -70,
            top: h * 0.45,
            opacity: 0.1,
          }}
        >
          <Circle
            cx={160}
            cy={160}
            r={140}
            fill="none"
            stroke={c.ink}
            strokeWidth={26}
            strokeDasharray="700 200"
            strokeLinecap="round"
          />
        </Svg>
        <Sfx
          text={sfx}
          color={c.ink}
          size={74}
          at={{ right: 12, top: h * 0.54 }}
          down
        />
      </>
    );
  } else if (theme === "isekai") {
    art = (
      <Svg
        width={300}
        height={300}
        viewBox="0 0 100 100"
        style={{
          position: "absolute",
          right: -80,
          top: h * 0.42,
          opacity: 0.16,
        }}
      >
        <Circle
          cx={50}
          cy={50}
          r={46}
          fill="none"
          stroke={c.accent}
          strokeWidth={1.5}
        />
        <Circle
          cx={50}
          cy={50}
          r={38}
          fill="none"
          stroke={c.accent}
          strokeWidth={0.8}
        />
        <Polygon
          points="50,6 88,72 12,72"
          fill="none"
          stroke={c.accent}
          strokeWidth={1}
        />
        <Polygon
          points="50,94 12,28 88,28"
          fill="none"
          stroke={c.accent}
          strokeWidth={1}
        />
      </Svg>
    );
  } else if (theme === "cozy") {
    art = (
      <>
        <View
          style={{
            position: "absolute",
            left: -60,
            top: h * 0.6,
            width: 240,
            height: 240,
            borderRadius: 120,
            backgroundColor: c.accent,
            opacity: 0.08,
          }}
        />
        <View
          style={{
            position: "absolute",
            right: -50,
            top: h * 0.16,
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: c.star,
            opacity: 0.1,
          }}
        />
        <Sfx
          text={sfx}
          color={c.accent}
          size={52}
          at={{ right: 22, top: h * 0.72 }}
        />
      </>
    );
  } else if (theme === "horror") {
    const drips: [number, number, number][] = [
      [0.1, 6, 60],
      [0.33, 4, 34],
      [0.64, 7, 80],
      [0.85, 5, 46],
    ];
    art = (
      <>
        <Svg width={w} height={h}>
          <Defs>
            <RadialGradient id="dark" cx="50%" cy="40%" r="75%">
              <Stop offset="0.55" stopColor="#000" stopOpacity={0} />
              <Stop offset="1" stopColor="#000" stopOpacity={0.55} />
            </RadialGradient>
          </Defs>
          <Rect width={w} height={h} fill="url(#dark)" />
        </Svg>
        {drips.map(([x, size, long], i) => (
          <View
            key={i}
            style={{
              position: "absolute",
              left: w * x,
              top: 0,
              width: size,
              height: long,
              backgroundColor: c.accent,
              opacity: 0.55,
              borderBottomLeftRadius: size,
              borderBottomRightRadius: size,
            }}
          />
        ))}
        <Sfx
          text={sfx}
          color={c.accent}
          size={80}
          at={{ right: 12, top: h * 0.52 }}
          down
        />
      </>
    );
  } else if (theme === "sports") {
    art = (
      <>
        <Svg width={w} height={h} style={faint(0.06)}>
          {Array.from({ length: Math.ceil(w / 76) }, (_, i) => (
            <Line
              key={i}
              x1={76 * (i + 1)}
              y1={0}
              x2={76 * (i + 1)}
              y2={h}
              stroke={c.ink}
              strokeWidth={2}
            />
          ))}
        </Svg>
        <View
          style={{
            position: "absolute",
            left: -40,
            top: h * 0.5,
            width: 240,
            height: 240,
            borderRadius: 120,
            borderWidth: 3,
            borderColor: c.accent,
            opacity: 0.25,
          }}
        />
        <Sfx
          text={sfx}
          color={c.accent}
          size={92}
          at={{ right: 6, top: h * 0.62 }}
          tilt={-8}
        />
      </>
    );
  } else {
    // mecha: a blueprint grid
    art = (
      <>
        <Svg width={w} height={h} style={faint(0.07)}>
          {Array.from({ length: Math.ceil(w / 26) }, (_, i) => (
            <Line
              key={`v${i}`}
              x1={26 * i}
              y1={0}
              x2={26 * i}
              y2={h}
              stroke={c.accent}
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: Math.ceil(h / 26) }, (_, i) => (
            <Line
              key={`h${i}`}
              x1={0}
              y1={26 * i}
              x2={w}
              y2={26 * i}
              stroke={c.accent}
              strokeWidth={1}
            />
          ))}
        </Svg>
        <Sfx
          text={sfx}
          color={c.accent}
          size={96}
          at={{ right: -10, top: h * 0.56 }}
          tilt={-6}
        />
      </>
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
        left: 0,
        width: w,
        height: h,
        overflow: "hidden",
      }}
    >
      {art}
    </View>
  );
}
