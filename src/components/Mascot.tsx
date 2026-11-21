// Kenji, the app's chibi reader, as the web draws him (core components/
// mascot/Mascot.tsx, converted): in the theme's ink, at the size given
import { View } from "react-native";
import KenjiArt from "@/core/components/mascot/Mascot";
import { useColors } from "@/lib/colors";
import { setSvgPalette } from "@/lib/svgClass";

type Mood = "confused" | "panic" | "happy" | "curious" | "reading";

export default function Mascot({
  mood = "happy",
  width = 120,
}: {
  mood?: Mood;
  width?: number;
}) {
  setSvgPalette(useColors());
  return (
    <View style={{ width, aspectRatio: 140 / 160 }}>
      <KenjiArt mood={mood} />
    </View>
  );
}
