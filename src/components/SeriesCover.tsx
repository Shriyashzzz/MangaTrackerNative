// A series' cover, as the web's components/cover (SeriesPicture and Cover):
// asked of the server at the width it's drawn, for this screen's density
// (the web's srcSet does this in the browser), the English cover where the
// server knows it. One that won't load gives way to the series' name
// lettered on a paper cover, as the web's drawn stand-in. Plain styles, not
// classes: the picture's size has to hold
import { Image } from "expo-image";
import { useState } from "react";
import { PixelRatio, Text, View } from "react-native";
import { coverChoices } from "@/core/lib/coverSizes";
import { coverSrc, priceName } from "@/core/lib/prices";
import { useColors } from "@/lib/colors";

type Props = {
  name: string;
  lightNovel?: boolean;
  url: string | null | undefined;
  // how wide it's drawn, in the screen's points
  width: number;
  // the ink border's width: 1.5 on a row, 2 on a series' page
  border?: number;
};

export default function SeriesCover({
  name,
  lightNovel,
  url,
  width,
  border = 1.5,
}: Props) {
  const c = useColors();
  const choices = coverChoices(url, { name: priceName({ name, lightNovel }) });
  const wanted = width * PixelRatio.get();
  const choice =
    choices.find((x) => x.width >= wanted) ?? choices[choices.length - 1];
  const src = coverSrc(choice?.url);
  const [failed, setFailed] = useState<string | null>(null);
  const box = {
    width,
    aspectRatio: 2 / 3,
    borderWidth: border,
    borderColor: c.line,
    backgroundColor: c.paper,
    overflow: "hidden" as const,
  };
  if (!src || failed === src)
    return (
      <View
        style={[
          box,
          { alignItems: "center", justifyContent: "center", padding: 4 },
        ]}
      >
        <Text
          numberOfLines={4}
          className="text-center font-brand pr-[4px] text-[11px] text-ink-soft uppercase"
        >
          {name}
          {"\u00A0"}
        </Text>
      </View>
    );
  return (
    <Image
      source={{ uri: src }}
      style={box}
      contentFit="cover"
      transition={180}
      onError={() => setFailed(src)}
    />
  );
}
