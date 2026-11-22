// A cover's address at the size it's drawn. The server makes each cover in
// a few widths (core lib/coverSizes.ts); asked for plainly it sends the
// whole picture, which for a grid of small covers is many times the bytes
// and the memory the screen can show. This picks the narrowest width that
// still fills the drawn size on this phone's screen (SeriesCover does the
// same for a series' cover, by the series' name). A cover the server can't
// resize comes back as it is
import { PixelRatio } from "react-native";
import { coverChoices, isVolumeCover } from "@/core/lib/coverSizes";
import { coverSrc } from "@/core/lib/prices";

export function coverAt(url: string | null | undefined, width: number) {
  const choices = coverChoices(url);
  const wanted = width * PixelRatio.get();
  const choice =
    choices.find((one) => one.width >= wanted) ?? choices[choices.length - 1];
  const src = coverSrc(choice?.url ?? url ?? "");
  return src && isVolumeCover(url ?? "") ? `${src}&${RULES}` : src;
}

// Put on every volume cover's address, and raised when the server's rules
// for what counts as a cover change (2: a blank white page no longer does).
// A picture is kept a month by the phone and by the network in front of the
// server under its exact address, so without this an old "cover" that the
// server now refuses would go on showing until then
const RULES = "v=2";

// A store's "No image available" picture loads fine, so nothing fails: its
// shape gives it away. Covers are tall; those are square or wide (the web's
// lib/prices.ts hidePlaceholderCover has the same rule). A picture that
// isn't portrait is not shown, and the stand-in behind it is
export const isNotACover = (source: { width: number; height: number }) =>
  source.width > 0 && source.width >= source.height * 0.95;
