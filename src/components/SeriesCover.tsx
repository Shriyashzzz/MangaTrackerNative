// A series' cover, as the web's components/cover (SeriesPicture and Cover):
// asked of the server at the width it's drawn, for this screen's density
// (the web's srcSet does this in the browser), the English cover where the
// server knows it. One that won't load gives way to the series' name
// drawn as a printed cover (DrawnCover), as on the web. Plain styles, not
// classes: the picture's size has to hold
import { Image } from "expo-image";
import { useState } from "react";
import { PixelRatio, View } from "react-native";
import { coverChoices } from "@/core/lib/coverSizes";
import { coverSrc, novelParts, priceName } from "@/core/lib/prices";
import { useColors } from "@/lib/colors";
import DrawnCover from "./DrawnCover";
import LightNovelBand from "./LightNovelBand";

type Props = {
  name: string;
  lightNovel?: boolean;
  url: string | null | undefined;
  // tried when `url` is missing or doesn't load: the series' own cover
  // behind a volume's (Mieruko-chan's volume 1 has a link that's dead)
  fallbackUrl?: string | null;
  // how wide it's drawn, in the screen's points
  width: number;
  // the ink border's width: 1.5 on a row, 2 on a series' page
  border?: number;
};

export default function SeriesCover({
  name,
  lightNovel,
  url,
  fallbackUrl,
  width,
  border = 1.5,
}: Props) {
  const c = useColors();
  const wanted = width * PixelRatio.get();
  // the sharpest size that's enough for this width, of one cover
  const srcOf = (cover: string | null | undefined) => {
    if (!cover) return undefined;
    const choices = coverChoices(cover, {
      name: priceName({ name, lightNovel }),
    });
    const choice =
      choices.find((x) => x.width >= wanted) ?? choices[choices.length - 1];
    return coverSrc(choice?.url);
  };
  const [failed, setFailed] = useState<string[]>([]);
  // the first of the two that hasn't failed to load
  const src = [srcOf(url), srcOf(fallbackUrl)].find(
    (x) => x && !failed.includes(x),
  );
  const box = {
    width,
    aspectRatio: 2 / 3,
    borderWidth: border,
    borderColor: c.line,
    backgroundColor: c.paper,
    overflow: "hidden" as const,
  };
  // a light novel says so on its cover: told by the caller, or by a name
  // that says it ("Spice and Wolf Light Novel")
  const novel = lightNovel || novelParts(name).lightNovel;
  const drawn = !src;
  return (
    <View style={box}>
      {drawn ? (
        <DrawnCover title={name} width={width - border * 2} />
      ) : (
        <Image
          source={{ uri: src }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
          transition={180}
          onError={() => setFailed((was) => [...was, src])}
        />
      )}
      {novel ? <LightNovelBand width={width} /> : null}
    </View>
  );
}
