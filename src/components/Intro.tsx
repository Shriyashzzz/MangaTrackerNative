// The opening moment, right after the phone's own splash (which can only
// be one small picture on a plain colour): speed lines bursting from the
// logo in its round badge, the name under it, then a fade into the app.
// The lines turn slowly while it's up. Shown once each time the app starts
import { useEffect } from "react";
import { StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Path } from "react-native-svg";
import { scheduleOnRN } from "react-native-worklets";
import { useColors } from "@/lib/colors";

// how long it's held before it fades, and the fade
const HOLD_MS = 1100;
const FADE_MS = 260;
// one full turn of the speed lines
const TURN_MS = 26000;
// the lines: this many, each as wide as the gap beside it
const RAYS = 36;

// the wedges of the burst, drawn once around the middle of a square
function rays(size: number) {
  const mid = size / 2;
  const step = (2 * Math.PI) / RAYS;
  let path = "";
  for (let i = 0; i < RAYS; i += 2) {
    const from = i * step;
    const to = from + step;
    path += `M${mid} ${mid}L${mid + Math.cos(from) * size} ${mid + Math.sin(from) * size}L${mid + Math.cos(to) * size} ${mid + Math.sin(to) * size}Z`;
  }
  return path;
}

export default function Intro({ onDone }: { onDone: () => void }) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  // a square that covers the screen at any turn
  const size = Math.ceil(Math.hypot(width, height));
  const turn = useSharedValue(0);
  const pop = useSharedValue(0.6);
  const seen = useSharedValue(1);
  useEffect(() => {
    turn.set(
      withRepeat(
        withTiming(360, { duration: TURN_MS, easing: Easing.linear }),
        -1,
      ),
    );
    // the badge lands with a little bounce
    pop.set(withSpring(1, { damping: 9, stiffness: 140 }));
    seen.set(
      withDelay(
        HOLD_MS,
        withTiming(0, { duration: FADE_MS }, (finished) => {
          if (finished) scheduleOnRN(onDone);
        }),
      ),
    );
  }, [turn, pop, seen, onDone]);
  const turning = useAnimatedStyle(() => ({
    transform: [{ rotate: `${turn.get()}deg` }],
  }));
  const popping = useAnimatedStyle(() => ({
    transform: [{ scale: pop.get() }],
  }));
  const fading = useAnimatedStyle(() => ({ opacity: seen.get() }));
  return (
    <Animated.View
      // over everything, and it takes the touches while it's up
      style={[StyleSheet.absoluteFill, { backgroundColor: c.paper }, fading]}
      accessibilityLabel="Manga Tracker"
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: size,
            height: size,
            left: (width - size) / 2,
            // the burst comes from the badge, a little above the middle
            top: height * 0.44 - size / 2,
          },
          turning,
        ]}
      >
        <Svg width={size} height={size}>
          <Path d={rays(size)} fill={c.paper2} />
        </Svg>
      </Animated.View>
      <View
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: height * 0.44 - 88,
        }}
        className="items-center"
      >
        <Animated.View style={popping}>
          {/* the badge, with a hard ink shadow behind it */}
          <View
            style={{ backgroundColor: c.ink }}
            className="absolute top-[7px] left-[7px] h-[176px] w-[176px] rounded-full"
          />
          <View
            style={{ backgroundColor: c.paper, borderColor: c.ink }}
            className="h-[176px] w-[176px] items-center justify-center rounded-full border-[5px]"
          >
            <Svg width={116} height={98} viewBox="6 12 52 44">
              <G transform="rotate(-7 32 35)">
                <Path
                  d="M11 20c8-4 15-4 21 2v29c-6-5-13-5-21-2Z"
                  fill={c.accent}
                  stroke={c.ink}
                  strokeWidth={4}
                  strokeLinejoin="round"
                />
                <Path
                  d="M53 20c-8-4-15-4-21 2v29c6-5 13-5 21-2Z"
                  fill={c.accent}
                  stroke={c.ink}
                  strokeWidth={4}
                  strokeLinejoin="round"
                />
                <Path
                  d="M40 19v18l4.5-3.5 4.5 3.5V18"
                  fill={c.paper}
                  stroke={c.ink}
                  strokeWidth={3}
                  strokeLinejoin="round"
                />
              </G>
            </Svg>
          </View>
        </Animated.View>
        <View
          className="mt-8 flex-row items-center gap-2.5"
          style={{ transform: [{ rotate: "-2deg" }] }}
        >
          <Text className="font-brand pr-[4px] text-[40px] tracking-[1.5px] text-ink">
            MANGA{" "}
          </Text>
          <View>
            <View
              style={{ backgroundColor: c.accent }}
              className="absolute top-[5px] left-[5px] h-full w-full"
            />
            <View style={{ backgroundColor: c.ink }} className="px-2.5">
              <Text
                style={{ color: c.paper }}
                className="font-brand pr-[4px] text-[40px] tracking-[1.5px]"
              >
                TRACKER{" "}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
