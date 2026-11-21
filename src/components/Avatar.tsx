// A profile picture, as the web's components/avatar/Avatar.tsx: one of the
// cast (core avatarArt, converted), or Kenji in a mood, on its own panel
// colour, in a round frame. The three drawn here are the web's own too
import type { ReactNode } from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import * as Art from "@/core/components/avatar/avatarArt";
import KenjiArt from "@/core/components/mascot/Mascot";
import { DEFAULT_AVATAR } from "@/core/lib/content/avatars";
import { useColors, type Palette } from "@/lib/colors";
import { setSvgPalette, svgClass } from "@/lib/svgClass";

const INK =
  "fill-none stroke-line stroke-[3.5] [stroke-linecap:round] [stroke-linejoin:round]";
const PAPER = "fill-card stroke-line stroke-[3.5] [stroke-linejoin:round]";
const RED = "fill-accent stroke-line stroke-[3.5] [stroke-linejoin:round]";

const Tower = () => (
  <Svg viewBox="0 0 100 100">
    <Rect
      {...svgClass(PAPER)}
      x="24"
      y="72"
      width="54"
      height="14"
      rx="1"
      transform="rotate(-3 50 79)"
    />
    <Rect
      {...svgClass(RED)}
      x="20"
      y="58"
      width="56"
      height="14"
      rx="1"
      transform="rotate(2 50 65)"
    />
    <Rect
      {...svgClass(PAPER)}
      x="27"
      y="44"
      width="48"
      height="14"
      rx="1"
      transform="rotate(-5 50 51)"
    />
    <Rect
      {...svgClass(RED)}
      x="23"
      y="16"
      width="50"
      height="28"
      rx="1"
      transform="rotate(3 50 30)"
    />
    <Circle {...svgClass("fill-line")} cx="41" cy="28" r="3" />
    <Circle {...svgClass("fill-line")} cx="58" cy="29" r="3" />
    <Path {...svgClass(INK)} d="M44 37q5-4 11 0" />
    <Path
      {...svgClass("fill-paper stroke-line stroke-2")}
      d="M76 12c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z"
    />
  </Svg>
);

const InkBlot = () => (
  <Svg viewBox="0 0 100 100">
    <Path
      {...svgClass("fill-line stroke-line stroke-2")}
      d="M50 13c10-2 13 7 21 8 9 2 15 9 12 18-2 7 5 12 3 21-2 8-11 9-15 15-3 5 0 12-7 13s-7-8-14-8c-8 0-14 6-21 1-6-4-1-11-5-17-4-7-12-10-10-19 1-8 10-9 13-16 3-8 12-15 23-16Z"
    />
    <Circle {...svgClass("fill-card")} cx="39" cy="44" r="9" />
    <Circle {...svgClass("fill-card")} cx="63" cy="44" r="9" />
    <Circle {...svgClass("fill-line")} cx="41" cy="46" r="4" />
    <Circle {...svgClass("fill-line")} cx="61" cy="46" r="4" />
    <Path
      {...svgClass("fill-none stroke-card stroke-[3.5] [stroke-linecap:round]")}
      d="M42 65q9 7 18 0"
    />
  </Svg>
);

const Onigiri = () => (
  <Svg viewBox="0 0 100 100">
    <Path
      {...svgClass(PAPER)}
      d="M50 13c6 0 10 4 14 11l20 36c5 10 0 22-12 22H28c-12 0-17-12-12-22l20-36c4-7 8-11 14-11Z"
    />
    <Path {...svgClass("fill-line")} d="M34 62h32v20H34z" />
    <Circle {...svgClass("fill-line")} cx="39" cy="44" r="3.5" />
    <Circle {...svgClass("fill-line")} cx="61" cy="44" r="3.5" />
    <Path {...svgClass(INK)} d="M45 50q5 5 10 0" />
    <Circle {...svgClass("fill-accent opacity-60")} cx="31" cy="51" r="4.5" />
    <Circle {...svgClass("fill-accent opacity-60")} cx="69" cy="51" r="4.5" />
  </Svg>
);

// Kenji, cropped to his head and shoulders
const crop = (mood: "happy" | "panic" | "confused"): ReactNode => (
  <View style={{ width: "86%", aspectRatio: 140 / 160, marginTop: "6%" }}>
    <KenjiArt mood={mood} />
  </View>
);

// the panel behind each: the web's dot and line textures, as plain colours
type Panel = "tone" | "lines" | "plain" | "wash" | "sun" | "night";
const panelColor = (panel: Panel, c: Palette) =>
  ({
    tone: c.paper2,
    lines: c.paper,
    plain: c.paper2,
    wash: `${c.accent}38`,
    sun: `${c.star}59`,
    night: c.line,
  })[panel];

const ART: Record<string, { art: ReactNode; panel: Panel }> = {
  kenji: { art: crop("happy"), panel: "plain" },
  panic: { art: crop("panic"), panel: "lines" },
  lost: { art: crop("confused"), panel: "tone" },
  tower: { art: <Tower />, panel: "sun" },
  ink: { art: <InkBlot />, panel: "wash" },
  onigiri: { art: <Onigiri />, panel: "tone" },
  mangaka: { art: <Art.Mangaka />, panel: "lines" },
  librarian: { art: <Art.Librarian />, panel: "sun" },
  punk: { art: <Art.PunkBob />, panel: "tone" },
  grandma: { art: <Art.Grandma />, panel: "wash" },
  twintails: { art: <Art.TwinTails />, panel: "sun" },
  rival: { art: <Art.SilentRival />, panel: "tone" },
  training: { art: <Art.TrainingArc />, panel: "lines" },
  regular: { art: <Art.BookstoreRegular />, panel: "wash" },
  nook: { art: <Art.ReadingNook />, panel: "sun" },
  cool: { art: <Art.TooCool />, panel: "tone" },
  crying: { art: <Art.NotCrying />, panel: "lines" },
  onemore: { art: <Art.OneMoreChapter />, panel: "night" },
  edgy: { art: <Art.EdgyArc />, panel: "wash" },
  master: { art: <Art.OldMaster />, panel: "tone" },
  strategist: { art: <Art.Strategist />, panel: "lines" },
  threeam: { art: <Art.ThreeAM />, panel: "night" },
  cat: { art: <Art.ShelfCat />, panel: "wash" },
  tanuki: { art: <Art.Tanuki />, panel: "tone" },
  ghost: { art: <Art.BacklogGhost />, panel: "night" },
  kappa: { art: <Art.Kappa />, panel: "sun" },
  oni: { art: <Art.LittleOni />, panel: "tone" },
  kitsune: { art: <Art.Kitsune />, panel: "sun" },
  daruma: { art: <Art.Daruma />, panel: "plain" },
  ramen: { art: <Art.RamenBowl />, panel: "lines" },
  dango: { art: <Art.Dango />, panel: "plain" },
  tea: { art: <Art.TeaBreak />, panel: "tone" },
  bubble: { art: <Art.SpeechBubble />, panel: "wash" },
  shock: { art: <Art.BigShock />, panel: "lines" },
  bookmark: { art: <Art.LiveBookmark />, panel: "sun" },
  nib: { art: <Art.PenNib />, panel: "tone" },
};

export default function Avatar({
  id,
  size = 36,
  border = 2.5,
}: {
  id?: string | null;
  size?: number;
  border?: number;
}) {
  const c = useColors();
  setSvgPalette(c);
  const { art, panel } = ART[id ?? DEFAULT_AVATAR] ?? ART[DEFAULT_AVATAR]!;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: border,
        borderColor: c.line,
        backgroundColor: panelColor(panel, c),
        overflow: "hidden",
        alignItems: "center",
        justifyContent: "flex-end",
      }}
    >
      <View
        style={{
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "flex-end",
        }}
      >
        {art}
      </View>
    </View>
  );
}
