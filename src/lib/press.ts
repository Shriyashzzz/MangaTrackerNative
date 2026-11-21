// How a press is shown: Android's ripple, drawn over the pressed thing in
// the accent, and nothing extra on an iPhone, where the row's own dimming
// (the `active:` classes) is what the system does
import { Platform, type PressableAndroidRippleConfig } from "react-native";
import { useColors } from "./colors";

export function useRipple(
  borderless = false,
): PressableAndroidRippleConfig | undefined {
  const c = useColors();
  if (Platform.OS !== "android") return undefined;
  return { color: `${c.accent}26`, foreground: !borderless, borderless };
}
