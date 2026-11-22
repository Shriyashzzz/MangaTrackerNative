// The app's own pull to refresh, as the Android Chrome app's (the web's
// lib/usePullToRefresh.ts and components/pullRefresh): pulling down from the
// top moves the page after the finger at half its speed and opens a gap
// under the header. Kenji hangs in it on a rope that grows with the pull:
// curious while pulling, grinning once letting go would refresh, reading
// while the shelf comes back. Now and then it's the comic burst instead
// ("グイ…" to "ドン!"), never on a first pull and never twice running.
// No system spinner: the pull is a gesture of the app's own
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import Svg, { Polygon } from "react-native-svg";
import { useColors } from "@/lib/colors";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import Mascot from "./Mascot";

// how far the page follows a pull, and where letting go refreshes
const MOST = 120;
const MARK = 64;
// how far the page stays down while it refreshes: room for the indicator
const HOLD = 92;
// the page moves at half the finger's speed, as Android's does
const DRAG = 0.5;
const BACK = { duration: 260, easing: Easing.bezier(0.2, 0, 0, 1) };

type Look = "kenji" | "burst";
type Stage = "pull" | "ready" | "busy";
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

// a page of the book he's reading, flipping in turn while it refreshes
function Page({ delay }: { delay: number }) {
  const c = useColors();
  const flip = useSharedValue(1);
  useEffect(() => {
    const timer = setTimeout(
      () =>
        flip.set(
          withRepeat(
            withSequence(
              withTiming(0.2, { duration: 450 }),
              withTiming(1, { duration: 450 }),
            ),
            -1,
          ),
        ),
      delay,
    );
    return () => clearTimeout(timer);
  }, [flip, delay]);
  const look = useAnimatedStyle(() => ({
    opacity: 0.4 + flip.value * 0.6,
    transform: [{ skewY: "-12deg" }, { scaleX: flip.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: 9,
          height: 13,
          borderWidth: 1.5,
          borderColor: c.line,
          borderRadius: 2,
          backgroundColor: c.card,
        },
        look,
      ]}
    />
  );
}

function Zone({
  pull,
  stage,
  look,
}: {
  pull: SharedValue<number>;
  stage: Stage;
  look: Look;
}) {
  const c = useColors();
  // the gap is as tall as the pull
  const gap = useAnimatedStyle(() => ({ height: pull.value }));
  const rope = useAnimatedStyle(() => ({ height: 6 + pull.value / 10 }));
  // Kenji grows with the pull, and always fits under his rope in the gap
  // (his drawing is 140 by 160)
  const kenji = useAnimatedStyle(() => {
    const ropeLength = 6 + pull.value / 10;
    const fits = ((pull.value - ropeLength - 4) * 140) / 160;
    const width = Math.max(0, Math.min(40 + pull.value / 4, fits));
    return { width, top: ropeLength };
  });
  const burst = useAnimatedStyle(() => ({
    width: 40 + Math.min(pull.value, 96) * 0.65,
  }));
  // ready: a pop; busy: Kenji sways on his rope, the burst spins
  const move = useSharedValue(0);
  const pop = useSharedValue(1);
  useEffect(() => {
    if (stage === "ready") {
      pop.set(0.8);
      pop.set(withSpring(1, { damping: 9, stiffness: 320 }));
    }
    if (stage === "busy")
      move.set(
        look === "burst"
          ? withRepeat(
              withTiming(1, { duration: 2400, easing: Easing.linear }),
              -1,
            )
          : withRepeat(
              withTiming(1, {
                duration: 800,
                easing: Easing.inOut(Easing.quad),
              }),
              -1,
              true,
            ),
      );
    else move.set(0);
  }, [stage, look, move, pop]);
  const moving = useAnimatedStyle(() => ({
    transform: [
      { scale: pop.value },
      {
        rotate:
          look === "burst" ? `${move.value * 360}deg` : `${move.value * 4}deg`,
      },
    ],
  }));
  const mood =
    stage === "busy" ? "reading" : stage === "ready" ? "happy" : "curious";
  const lit = stage !== "pull";

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityRole={stage === "busy" ? "progressbar" : undefined}
      accessibilityLabel={stage === "busy" ? "Refreshing" : undefined}
      style={[
        {
          position: "absolute",
          top: 0,
          right: 0,
          left: 0,
          overflow: "hidden",
          alignItems: "center",
        },
        gap,
      ]}
    >
      {look === "kenji" ? (
        <>
          <Animated.View
            style={[{ width: 2.5, backgroundColor: c.line }, rope]}
          />
          <Animated.View
            style={[
              { position: "absolute", transformOrigin: "50% 0%" },
              kenji,
              moving,
            ]}
          >
            <Mascot mood={mood} width="100%" />
          </Animated.View>
          {stage === "busy" ? (
            <View
              className="absolute flex-row gap-[3px]"
              style={{ bottom: 10, left: "50%", marginLeft: 22 }}
            >
              <Page delay={0} />
              <Page delay={150} />
              <Page delay={300} />
            </View>
          ) : null}
        </>
      ) : (
        <View className="flex-1 items-center justify-center">
          <Animated.View style={[burst, moving]}>
            <Svg viewBox="0 0 100 100" style={{ aspectRatio: 1 }}>
              <Polygon
                points={BURST}
                fill={lit ? c.accent : c.card}
                stroke={c.line}
                strokeWidth={2.5}
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
          <Text
            className="absolute font-body-semibold"
            style={{
              fontSize: lit ? 26 : 18,
              color: lit ? c.card : c.ink,
            }}
          >
            {stage === "busy"
              ? "・・・"
              : stage === "ready"
                ? "ドン!"
                : "グイ…"}
          </Text>
        </View>
      )}
    </Animated.View>
  );
}

export default function PullPage({
  refresh,
  scrollTop,
  children,
}: {
  // what the pull asks for again
  refresh: () => Promise<unknown>;
  // how far the list inside is scrolled: a pull only starts from its top
  scrollTop: { current: number };
  children: ReactNode;
}) {
  const pull = useSharedValue(0);
  const [stage, setStage] = useState<Stage>("pull");
  const [look, setLook] = useState<Look>("kenji");
  const [pulling, setPulling] = useState(false);
  const running = useRef(false);
  const fromTop = useRef(false);
  const pulled = useRef(0);

  // the refs below are read and set when a finger moves, never while
  // rendering: the lint rule can't tell a gesture's callbacks from render
  /* eslint-disable react-hooks/refs */
  const pan = Gesture.Pan()
    .runOnJS(true)
    // a clear drag down takes it; sideways or up is the list's own
    .activeOffsetY(10)
    .failOffsetX([-24, 24])
    .onBegin(() => {
      fromTop.current = scrollTop.current <= 0 && !running.current;
      pulled.current = 0;
    })
    .onUpdate((e) => {
      if (!fromTop.current) return;
      // scrolled meanwhile: the pull is off
      if (scrollTop.current > 0) {
        fromTop.current = false;
        pull.set(withTiming(0, BACK));
        setPulling(false);
        return;
      }
      const was = pulled.current;
      pulled.current = Math.max(0, e.translationY) * DRAG;
      if (was <= 0 && pulled.current > 0) {
        setLook(pickLook());
        setPulling(true);
      }
      const shown = Math.min(pulled.current, MOST);
      pull.set(shown);
      setStage(shown >= MARK ? "ready" : "pull");
    })
    .onEnd(() => {
      if (!fromTop.current) return;
      fromTop.current = false;
      if (pulled.current < MARK) {
        pull.set(withTiming(0, BACK));
        setPulling(false);
        setStage("pull");
        return;
      }
      running.current = true;
      setStage("busy");
      pull.set(withTiming(HOLD, BACK));
      refresh()
        .catch(() => {})
        .finally(() => {
          running.current = false;
          pull.set(withTiming(0, BACK));
          setPulling(false);
          setStage("pull");
        });
    });

  /* eslint-enable react-hooks/refs */

  // the page moves down after the finger
  const moved = useAnimatedStyle(() => ({
    transform: [{ translateY: pull.value }],
  }));
  return (
    <GestureDetector gesture={pan}>
      <View className="flex-1">
        {pulling || stage === "busy" ? (
          <Zone pull={pull} stage={stage} look={look} />
        ) : null}
        <Animated.View style={[{ flex: 1 }, moved]}>{children}</Animated.View>
      </View>
    </GestureDetector>
  );
}
