// Anything tappable that isn't a Button: the one place that decides how a
// press is shown, so every link, row, icon and cover answers a finger the
// same way.
//   Android: the system's ripple in the soft accent, and nothing else (no
//     dimming: a dim there snaps, and flashes rows as a scroll starts)
//   iPhone: it dims while held, as the system's own rows and links do
// `feel="round"` is for a bare icon (back, ×, an arrow): the ripple is a
// circle around it. `feel="none"` is for a tap that isn't a button: outside
// a sheet to close it, the camera's view. Buttons and cards give under the
// finger as well (PressScale)
import { Platform, Pressable, type PressableProps } from "react-native";
import { useRipple } from "@/lib/press";
import { controlUsed } from "@/lib/tourGo";

const ANDROID = Platform.OS === "android";
// how far the round ripple reaches from the icon's middle
const ROUND_REACH = 22;

export default function Tap({
  feel = "ripple",
  className,
  android_ripple,
  style,
  ...pressable
}: PressableProps & {
  className?: string;
  feel?: "ripple" | "round" | "none";
}) {
  const ripple = useRipple(feel === "round");
  // (Kenji's tour steps aside when something is pressed: lib/tourGo.ts)
  const { onPress } = pressable;
  const pressed: PressableProps["onPress"] = onPress
    ? (event) => {
        controlUsed();
        onPress(event);
      }
    : undefined;
  if (ANDROID) {
    const shows = feel !== "none";
    // the ripple is the feedback: the dim and the tint written for a press
    // would be a second one on top of it
    const classes = shows
      ? (className ?? "").replace(/\bactive:(opacity|bg)-\S+/g, "")
      : className;
    // a ripple fills its box's rectangle: on a rounded thing it's cut to
    // the corners
    const clipped =
      shows && feel !== "round" && /\brounded/.test(classes ?? "")
        ? `${classes} overflow-hidden`
        : classes;
    return (
      <Pressable
        {...pressable}
        onPress={pressed}
        style={style}
        className={clipped}
        android_ripple={
          android_ripple ??
          (shows
            ? feel === "round"
              ? { ...ripple, radius: ROUND_REACH }
              : ripple
            : undefined)
        }
      />
    );
  }
  // an iPhone: dimmed while held, unless its own classes already say how
  const dims = feel !== "none" && !/\bactive:/.test(className ?? "");
  return (
    <Pressable
      {...pressable}
      onPress={pressed}
      className={className}
      style={(state) => [
        typeof style === "function" ? style(state) : style,
        dims && state.pressed ? { opacity: 0.6 } : null,
      ]}
    />
  );
}
