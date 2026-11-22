// "Novel" across the foot of a cover, over the picture: said on the book
// itself wherever a series or one of its volumes is shown, so the prose
// book is never taken for the comic of the same name. One word for every
// kind (a Japanese light novel, a Chinese or Korean novel): always true,
// and short enough for a small cover. Sits inside the cover's own box
// (which must cut what overflows)
import { Text, View } from "react-native";

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
        Novel
      </Text>
    </View>
  );
}
