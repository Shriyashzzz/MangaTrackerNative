// A cover's address at the size it's drawn. The server makes each cover in
// a few widths (core lib/coverSizes.ts); asked for plainly it sends the
// whole picture, which for a grid of small covers is many times the bytes
// and the memory the screen can show. This picks the narrowest width that
// still fills the drawn size on this phone's screen (SeriesCover does the
// same for a series' cover, by the series' name). A cover the server can't
// resize comes back as it is
import { PixelRatio } from "react-native";
import { coverChoices } from "@/core/lib/coverSizes";
import { coverSrc } from "@/core/lib/prices";

export function coverAt(url: string | null | undefined, width: number) {
  const choices = coverChoices(url);
  const wanted = width * PixelRatio.get();
  const choice =
    choices.find((one) => one.width >= wanted) ?? choices[choices.length - 1];
  return coverSrc(choice?.url ?? url ?? "");
}
