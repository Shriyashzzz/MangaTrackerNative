// A cover drawn from the series' name, for one with no picture (or one that
// won't load, as with no connection): the web's components/drawnCover. A
// printed panel with the title lettered on it. Each title gets its own paper
// tint, screen pattern and layout, picked from its name, so a shelf of them
// still reads as different books, and the same series always looks the
// same. Printed paper in every theme, dimmed a little in the dark one
import { Text, View } from "react-native";
import Svg, { Circle, Defs, Line, Pattern, Rect } from "react-native-svg";
import { useUniwind } from "uniwind";

// muted print paper: cream, warm, cool, rose, sage, straw
const TINTS = [
  "#fbf8f0",
  "#f3e3cf",
  "#e3eaec",
  "#f1dfdc",
  "#e4ecda",
  "#f2ebcc",
];
// the print's own ink and red, whatever the theme
const INK = "#1d1a16";
const RED = "#b14a3c";
const SCREEN = "rgba(29, 26, 22, 0.28)";
// the screens printed over the paper; the last is bare paper
const SCREENS = ["dots", "slant", "lines", "big dots", "none"] as const;
type Screen = (typeof SCREENS)[number];

// a stable number from the title
const hash = (text: string) => {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

// one tile of a screen, repeated across the cover
function Tile({ screen }: { screen: Exclude<Screen, "none"> }) {
  if (screen === "dots")
    return (
      <Pattern id="screen" patternUnits="userSpaceOnUse" width={7} height={7}>
        <Circle cx={3.5} cy={3.5} r={1} fill={SCREEN} />
      </Pattern>
    );
  if (screen === "big dots")
    return (
      <Pattern id="screen" patternUnits="userSpaceOnUse" width={11} height={11}>
        <Circle cx={5.5} cy={5.5} r={1.4} fill={SCREEN} />
      </Pattern>
    );
  if (screen === "lines")
    return (
      <Pattern id="screen" patternUnits="userSpaceOnUse" width={9} height={9}>
        <Line x1={0} y1={0.5} x2={9} y2={0.5} stroke={SCREEN} strokeWidth={1} />
      </Pattern>
    );
  return (
    <Pattern
      id="screen"
      patternUnits="userSpaceOnUse"
      width={7}
      height={7}
      patternTransform="rotate(45)"
    >
      <Line x1={0} y1={0.5} x2={7} y2={0.5} stroke={SCREEN} strokeWidth={1} />
    </Pattern>
  );
}

// the lettering's size for a cover this wide: the web's clamp(0.45rem, 15cqw, 2.2rem)
const letterSize = (width: number) => Math.min(Math.max(width * 0.15, 7.2), 35);

export default function DrawnCover({
  title,
  width,
}: {
  title: string;
  // how wide the cover is drawn, in points: everything on it scales with it
  width: number;
}) {
  const { theme } = useUniwind();
  const h = hash(title.trim().toLowerCase());
  const tint = TINTS[h % TINTS.length]!;
  const screen = SCREENS[(h >>> 3) % SCREENS.length]!;
  // where the lettering sits, and whether the top band is ink or red
  const low = ((h >>> 6) & 1) === 1;
  const red = ((h >>> 7) & 3) === 0;
  const bandWide = ((h >>> 9) & 1) === 1;
  const size = letterSize(width);
  return (
    <View
      accessible={false}
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: tint,
        opacity: theme === "dark" ? 0.82 : 1,
      }}
    >
      {screen !== "none" ? (
        <Svg style={{ position: "absolute", width: "100%", height: "100%" }}>
          <Defs>
            <Tile screen={screen} />
          </Defs>
          <Rect width="100%" height="100%" fill="url(#screen)" />
        </Svg>
      ) : null}
      <View
        style={{
          flex: 1,
          padding: width * 0.08,
          justifyContent: low ? "space-between" : "flex-start",
          gap: low ? 0 : width * 0.1,
        }}
      >
        {/* a printed band across the top, like a volume's publisher strip */}
        <View
          style={{
            height: width * 0.05,
            width: bandWide ? "100%" : "45%",
            backgroundColor: red ? RED : INK,
          }}
        />
        <Text
          numberOfLines={5}
          className="font-brand uppercase"
          style={{
            color: INK,
            fontSize: size,
            lineHeight: size * 1.02,
            letterSpacing: size * 0.02,
            // Bangers leans past its own box: room on the right, or Android
            // clips each line's last letter
            paddingRight: size * 0.18,
          }}
        >
          {title}
          {" "}
        </Text>
        <View
          style={{
            height: Math.max(width * 0.02, 1),
            backgroundColor: INK,
            marginTop: low ? 0 : "auto",
          }}
        />
      </View>
    </View>
  );
}
