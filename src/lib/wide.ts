// A wide screen (an iPad, a tablet, a phone on its side): the app keeps its
// reading width there rather than stretching across it. Content sits in a
// centred column; sheets are a card in the middle, not a drawer as wide as
// the screen. On a phone none of this changes anything
import { useWindowDimensions } from "react-native";

// the column most screens keep to: a phone's width and a bit
export const COLUMN = 720;
// a sheet's widest
export const SHEET = 560;

// from this wide up, the screen counts as wide
const WIDE_FROM = 760;

export function useWide() {
  const { width } = useWindowDimensions();
  const wide = width >= WIDE_FROM;
  return {
    wide,
    width,
    // the room left either side of a centred column of the given width
    sideFor: (column: number) => (wide ? Math.max(0, (width - column) / 2) : 0),
  };
}

// a style for a list's or a page's content: centred, at most the column
export const columnStyle = {
  width: "100%",
  maxWidth: COLUMN,
  alignSelf: "center",
} as const;
