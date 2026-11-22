// The app's own pull to refresh (the web's components/pullRefresh): while a
// pull is refreshing, Kenji hangs from the top on a rope, reading, with
// three dots; now and then it's the comic burst instead ("ドン!"). The burst
// never shows on a first pull and never twice running (the web's pullLook).
// The system's spinner is kept out of sight: the pull itself is the phone's
import { useCallback, useEffect, useState } from "react";
import { RefreshControl, Text, View } from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, { Polygon } from "react-native-svg";
import { useColors } from "@/lib/colors";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import Mascot from "./Mascot";

type Look = "kenji" | "burst";
const SEEN_KEY = "pullSeen";
const LAST_KEY = "pullLast";
// how often the burst turns up
const BURST_ODDS = 1 / 6;

function pickLook(): Look {
  const seen = readLocal(SEEN_KEY) === "yes";
  const last = readLocal(LAST_KEY);
  const look: Look =
    seen && last !== "burst" && Math.random() < BURST_ODDS ? "burst" : "kenji";
  writeLocal(SEEN_KEY, "yes");
  writeLocal(LAST_KEY, look);
  return look;
}

// a comic burst's points, 14 spikes round a 100 by 100 box
const BURST = Array.from({ length: 28 }, (_, i) => {
  const r = i % 2 ? 30 : 46;
  const a = (Math.PI * i) / 14;
  return `${(50 + r * Math.cos(a)).toFixed(1)},${(50 + r * Math.sin(a)).toFixed(1)}`;
}).join(" ");

function Indicator({ look, top }: { look: Look; top: number }) {
  const c = useColors();
  const turn = useSharedValue(0);
  useEffect(() => {
    turn.set(
      withRepeat(
        withTiming(1, {
          duration: look === "burst" ? 900 : 700,
          easing: look === "burst" ? Easing.linear : Easing.inOut(Easing.quad),
        }),
        -1,
        look !== "burst",
      ),
    );
  }, [turn, look]);
  // Kenji sways on his rope; the burst spins
  const moving = useAnimatedStyle(() => ({
    transform: [
      {
        rotate:
          look === "burst"
            ? `${turn.value * 360}deg`
            : `${-5 + turn.value * 10}deg`,
      },
    ],
  }));
  return (
    <Animated.View
      entering={FadeIn.duration(160)}
      exiting={FadeOut.duration(200)}
      pointerEvents="none"
      accessibilityRole="progressbar"
      accessibilityLabel="Refreshing"
      style={{ top }}
      className="absolute inset-x-0 z-10 items-center"
    >
      {look === "kenji" ? (
        <Animated.View style={[{ alignItems: "center" }, moving]}>
          <View style={{ width: 2, height: 14, backgroundColor: c.line }} />
          <Mascot mood="reading" width={64} />
        </Animated.View>
      ) : (
        <View className="items-center justify-center pt-2">
          <Animated.View style={moving}>
            <Svg width={84} height={84} viewBox="0 0 100 100">
              <Polygon
                points={BURST}
                fill={c.accent}
                stroke={c.line}
                strokeWidth={2}
              />
            </Svg>
          </Animated.View>
          <Text className="absolute font-brand pr-1 text-[20px] text-on-accent">
            ドン!
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

// refresh: what the pull asks for again. Gives the list its refresh control
// and the indicator to draw over the list's top
// top: where the list starts, so he drops in from under the header
export function useKenjiRefresh(refresh: () => Promise<unknown>, top = 0) {
  const [busy, setBusy] = useState(false);
  const [look, setLook] = useState<Look>("kenji");
  const onRefresh = useCallback(async () => {
    setLook(pickLook());
    setBusy(true);
    try {
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [refresh]);
  return {
    refreshControl: (
      <RefreshControl
        refreshing={busy}
        onRefresh={() => void onRefresh()}
        // the system's circle is parked above the screen: Kenji is the
        // indicator
        progressViewOffset={-400}
        colors={["transparent"]}
        progressBackgroundColor="transparent"
        tintColor="transparent"
      />
    ),
    indicator: busy ? <Indicator look={look} top={top} /> : null,
  };
}
