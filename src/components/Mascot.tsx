// Kenji, the app's chibi reader, as the web draws him (core components/
// mascot/Mascot.tsx, converted), at the size given. Printed: his colours
// stay the light theme's in dark mode, as on the web (.printed)
import { View } from "react-native";
import KenjiArt from "@/core/components/mascot/Mascot";
import { PRINTED } from "@/lib/printed";
import { setSvgPalette } from "@/lib/svgClass";

type Mood = "confused" | "panic" | "happy" | "curious" | "reading";

export default function Mascot({
  mood = "happy",
  width = 120,
}: {
  mood?: Mood;
  width?: number;
}) {
  setSvgPalette(PRINTED);
  return (
    <View style={{ width, aspectRatio: 140 / 160 }}>
      <KenjiArt mood={mood} />
    </View>
  );
}
