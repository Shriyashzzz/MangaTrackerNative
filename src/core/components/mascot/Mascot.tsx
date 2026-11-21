// CONVERTED from inventoryApp/client/src/components/mascot/Mascot.tsx by scripts/sync-core.mjs.
// Do not edit here: change the web app, then run `npm run sync-core`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Svg, { Circle, Ellipse, G, Line, Path, Polygon, Polyline, Rect, Text as SvgText } from "react-native-svg";
import { svgClass } from "@/lib/svgClass";
// Kenji, the app's chibi reader: a shonen-style boy in a hoodie with his
// nose in a manga (an original character, drawn here so it themes with the
// page). `mood` swaps the face and the little extras.
// moods: confused | panic | happy | curious | reading (the app's swipe to
// refresh: components/pullRefresh/PullRefresh.tsx)
// the ink styles of each part of the drawing; colors follow the theme tokens
const S = {
  skin: "fill-card stroke-line stroke-3 [stroke-linejoin:round]",
  hair: "fill-line stroke-line stroke-2 [stroke-linejoin:round]",
  book: "fill-accent stroke-line stroke-3",
  ink: "fill-none stroke-line stroke-[3.5] [stroke-linecap:round] [stroke-linejoin:round]",
  line: "fill-none stroke-line stroke-[3.5] [stroke-linecap:round] [stroke-linejoin:round]",
  // thick, expressive shonen eyebrows
  brow: "fill-none stroke-line stroke-5 [stroke-linecap:round] [stroke-linejoin:round]",
  // hoodie drawstrings
  thin: "fill-none stroke-line stroke-2 [stroke-linecap:round]",
  eye: "fill-line",
  shine: "fill-card",
  mouth: "fill-accent stroke-line stroke-3 [stroke-linejoin:round]",
  sweat: "fill-paper stroke-line stroke-[2.5]",
  spark: "fill-star stroke-line stroke-[1.5] [stroke-linejoin:round]",
  sfx: "fill-accent stroke-line stroke-[1.5] font-brand text-[34px] [paint-order:stroke_fill]",
};

type Mood = "confused" | "panic" | "happy" | "curious" | "reading";

export default function Mascot({
  mood = "happy",
  className = "",
}: {
  mood?: Mood;
  className?: string;
}) {
  return (
    <Svg
      {...svgClass(`block h-auto w-full overflow-visible ${className}`)}
      viewBox="0 0 140 160"
    >
      {/* hoodie, collar and drawstrings */}
      <Path {...svgClass(S.skin)} d="M34 158c2-24 16-36 36-36s34 12 36 36Z" />
      <Path {...svgClass(S.line)} d="M56 126l14 12 14-12" />
      <Path {...svgClass(S.thin)} d="M63 132v14M77 132v14" />

      {/* the manga volume being read */}
      <Rect
        {...svgClass(S.book)}
        x="44"
        y="118"
        width="52"
        height="36"
        rx="2"
        transform="rotate(-6 70 136)"
      />
      <Path {...svgClass(S.ink)} d="M70 121v31" transform="rotate(-6 70 136)" />

      {/* ears, then the head over them */}
      <Circle {...svgClass(S.skin)} cx="29" cy="78" r="7" />
      <Circle {...svgClass(S.skin)} cx="111" cy="78" r="7" />
      <Circle {...svgClass(S.skin)} cx="70" cy="70" r="42" />

      {/* short spiky shonen hair: spikes up top, a jagged fringe, short sides */}
      <Path
        {...svgClass(S.hair)}
        d="M28 70C24 46 34 30 46 26L40 9l18 13 4-18 12 16 12-14 2 18 16-10-6 18c12 8 16 22 14 38l-8-12-6 8-6-14-8 10-8-12-8 10-8-12-8 12-6-10-8 14Z"
      />

      {mood === "confused" && (
        <G>
          {/* one brow up, one down; one eye wide, one squinting */}
          <Path {...svgClass(S.brow)} d="M45 60q9-8 18-2" />
          <Path {...svgClass(S.brow)} d="M78 64l16-3" />
          <Ellipse {...svgClass(S.eye)} cx="54" cy="76" rx="7" ry="9" />
          <Circle {...svgClass(S.shine)} cx="56" cy="72" r="2.5" />
          <Path {...svgClass(S.line)} d="M80 76h14" />
          <Path {...svgClass(S.line)} d="M62 98c4-3 8 3 12 0s6 2 8 0" />
          <SvgText {...svgClass(S.sfx)} x="106" y="40">
            ?
          </SvgText>
        </G>
      )}

      {mood === "panic" && (
        <G>
          {/* worried brows, spiral eyes, wobbly mouth, sweat drop */}
          <Path {...svgClass(S.brow)} d="M44 62l17-6" />
          <Path {...svgClass(S.brow)} d="M79 56l17 6" />
          <Path
            {...svgClass(S.line)}
            d="M54 76m-8 0a8 8 0 1 0 8-8a5 5 0 1 0 4 5"
          />
          <Path
            {...svgClass(S.line)}
            d="M86 76m-8 0a8 8 0 1 0 8-8a5 5 0 1 0 4 5"
          />
          <Path {...svgClass(S.mouth)} d="M58 100q4-6 8 0t8 0t8 0v6q-12 6-24 0Z" />
          <Path
            {...svgClass(S.sweat)}
            d="M112 54c4 6 6 10 6 13a6 6 0 0 1-12 0c0-3 2-7 6-13Z"
          />
          <SvgText {...svgClass(S.sfx)} x="10" y="40">
            !?
          </SvgText>
        </G>
      )}

      {mood === "curious" && (
        <G>
          {/* brows up, two round wide eyes, a small "oh" */}
          <Path {...svgClass(S.brow)} d="M45 60q9-8 18-2" />
          <Path {...svgClass(S.brow)} d="M78 60q9-8 18-2" />
          <Ellipse {...svgClass(S.eye)} cx="54" cy="78" rx="6" ry="8" />
          <Ellipse {...svgClass(S.eye)} cx="86" cy="78" rx="6" ry="8" />
          <Circle {...svgClass(S.shine)} cx="56" cy="74" r="2.2" />
          <Circle {...svgClass(S.shine)} cx="88" cy="74" r="2.2" />
          <Path {...svgClass(S.line)} d="M64 100q6 4 12 0" />
        </G>
      )}

      {mood === "reading" && (
        <G>
          {/* calm brows, eyes down on the book, a content little smile */}
          <Path {...svgClass(S.brow)} d="M45 62q9-4 18 0" />
          <Path {...svgClass(S.brow)} d="M77 62q9-4 18 0" />
          <Path {...svgClass(S.line)} d="M47 84h14" />
          <Path {...svgClass(S.line)} d="M79 84h14" />
          <Path {...svgClass(S.line)} d="M64 100q6 3 12 0" />
        </G>
      )}

      {mood === "happy" && (
        <G>
          {/* raised brows, closed happy eyes, big grin, sparkles */}
          <Path {...svgClass(S.brow)} d="M44 64q9-6 18-1" />
          <Path {...svgClass(S.brow)} d="M78 63q9-5 18 1" />
          <Path {...svgClass(S.line)} d="M46 80q8-10 16 0" />
          <Path {...svgClass(S.line)} d="M78 80q8-10 16 0" />
          <Path {...svgClass(S.mouth)} d="M56 96h28q-2 14-14 14t-14-14Z" />
          <Path {...svgClass(S.spark)} d="M118 30l3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
          <Path {...svgClass(S.spark)} d="M18 48l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        </G>
      )}
    </Svg>
  );
}
