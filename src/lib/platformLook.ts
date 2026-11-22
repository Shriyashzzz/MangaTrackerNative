// The few shapes that differ between the platforms, in one place, so each
// control looks like its own system's: Material 3 on Android (pill buttons,
// a ripple, outlined segmented buttons), UIKit on an iPhone (rounded
// rectangles that give under the finger, a sliding segmented pill)
import { Platform } from "react-native";

export const isAndroid = Platform.OS === "android";

export const look = {
  // a button's corner: Material's full pill, iOS's rounded rectangle
  buttonRadius: isAndroid ? "rounded-full" : "rounded-[12px]",
  // how far a pressed thing gives: Android shows its ripple instead
  pressScale: isAndroid ? 1 : 0.96,
  // the segmented bar's track and its picked pill
  segmentTrack: isAndroid
    ? "rounded-full border-[1.5px] border-line-soft"
    : "rounded-[12px] bg-ink/10 p-[3px]",
  segmentInset: isAndroid ? 0 : 3,
  segmentRadius: isAndroid ? 999 : 9,
};
