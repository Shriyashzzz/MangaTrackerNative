// "Light novel" across the foot of a cover, over the picture: said on the
// book itself wherever a series or one of its volumes is shown, so a novel
// is never taken for the manga of the same name. Sits inside the cover's
// own box (which must cut what overflows). A small cover says "Novel": the
// two words don't fit it
import { Text, View } from "react-native";

// under this width (in points) the short word is used
const TWO_WORDS_FROM = 60;

export default function LightNovelBand({ width }: { width: number }) {
  const size = Math.min(Math.max(width * 0.13, 7), 11);
  return (
    <View
      pointerEvents="none"
      className="absolute inset-x-0 bottom-0 items-center bg-ink px-[2px]"
      style={{ zIndex: 1, paddingVertical: size * 0.22 }}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
        className="font-mono-medium text-paper uppercase"
        style={{ fontSize: size, lineHeight: size * 1.3, letterSpacing: 0.5 }}
      >
        {width >= TWO_WORDS_FROM ? "Light novel" : "Novel"}
      </Text>
    </View>
  );
}
