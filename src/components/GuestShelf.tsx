// The shelf for someone not signed in (the web's pages/Home/GuestHero.tsx):
// what a shelf is for, and the two ways in. Prices stay open to them along
// the bottom
import { startPractice } from "@/lib/practice";
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Mascot from "./Mascot";
import { Modal, ScrollView, Text, View } from "react-native";
import AuthArt from "./AuthArt";
import Button from "./Button";

// one panel: the drawing over a caption, its shout inked across a corner
function Panel({
  shout,
  caption,
  children,
}: {
  shout: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <View className="min-w-[46%] flex-1 overflow-hidden rounded-[4px] border-[1.5px] border-line bg-card">
      <View className="h-[72px] items-center justify-end bg-paper-2 px-2.5 pb-2">
        {children}
      </View>
      <Text
        className="absolute top-1 right-1 bg-accent px-1.5 font-brand pr-[4px] text-[12px] tracking-[0.5px] text-on-accent uppercase"
        style={{ transform: [{ rotate: "4deg" }] }}
      >
        {shout}
        {"\u00A0"}
      </Text>
      <Text className="border-t-[1.5px] border-line px-2 py-1.5 text-center font-body-medium text-[13px] text-ink">
        {caption}
      </Text>
    </View>
  );
}

// one thing bobbing up and down for as long as it's shown, starting a
// little after the one before it
function Bob({
  children,
  by,
  after = 0,
}: {
  children: ReactNode;
  by: number;
  after?: number;
}) {
  const lift = useSharedValue(0);
  useEffect(() => {
    lift.set(
      withDelay(
        after,
        withRepeat(
          withSequence(
            withTiming(-by, { duration: 220, easing: Easing.out(Easing.quad) }),
            withTiming(0, { duration: 220, easing: Easing.in(Easing.quad) }),
            withTiming(0, { duration: 160 }),
          ),
          -1,
        ),
      ),
    );
  }, [lift, by, after]);
  const lifted = useAnimatedStyle(() => ({
    transform: [{ translateY: lift.get() }],
  }));
  return <Animated.View style={lifted}>{children}</Animated.View>;
}

// While the practice shelf is being put together (a beat, longer for the
// collector's forty series): a small window over the page where Kenji hops
// and a row of spines bobs along the shelf, so the press is answered at once
const SPINES = [0, 1, 2, 3, 4];
function StockingShelf() {
  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <View
        accessibilityRole="progressbar"
        accessibilityLabel="Setting up the practice shelf"
        className="flex-1 items-center justify-center bg-black/60 px-10"
      >
        <View className="w-full items-center gap-4 rounded-2xl border-[1.5px] border-line bg-card px-6 py-7">
          <Bob by={12}>
            <Mascot mood="happy" width={72} />
          </Bob>
          <View className="h-14 flex-row items-end gap-1.5 border-b-2 border-line pb-0.5">
            {SPINES.map((n) => (
              <Bob key={n} by={16} after={n * 120}>
                <View
                  className={`h-8 w-3.5 border-[1.5px] border-line ${n === 2 ? "bg-accent" : "bg-paper-2"}`}
                />
              </Bob>
            ))}
          </View>
          <Text className="font-body-semibold text-[16px] text-ink">
            Kenji is stocking the shelf…
          </Text>
        </View>
      </View>
    </Modal>
  );
}

export default function GuestShelf() {
  // pressed: the loader shows first, then the shelf is put together (the
  // work would otherwise hold the press's own frame back)
  const [starting, setStarting] = useState(false);
  const start = (kind: "reader" | "collector") => {
    setStarting(true);
    // (long enough for the window to open and the books to start bouncing:
    // putting the shelf together holds everything else still)
    setTimeout(() => startPractice(kind), 650);
  };
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow justify-center gap-6 px-6 py-8"
    >
      <AuthArt
        sfx="A new series begins!"
        chapter="1"
        line="Your shelf lives here once you sign up."
      />
      {/* what a shelf does, as four panels of a manga page (the web's
          GuestHero): a drawing, a shout, and a caption each */}
      <View
        className="flex-row flex-wrap gap-2"
        accessibilityLabel="Keep your place in every series, track the volumes you own, and see when the next one is out and what it costs."
      >
        <Panel shout="Bookmarked!" caption="Keep your place">
          <View className="flex-row items-baseline gap-1">
            <Text className="font-brand pr-[4px] text-[15px] text-ink">
              ch.
              {"\u00A0"}
            </Text>
            <Text className="font-brand pr-[7px] text-[28px] leading-[34px] text-ink">
              374
              {"\u00A0"}
            </Text>
          </View>
        </Panel>
        <Panel shout="Mine!" caption="Track what you own">
          <View className="flex-row items-end gap-[3px]">
            {[true, true, true, false, true, false].map((owned, i) => (
              <View
                key={i}
                className={`w-[11px] ${owned ? "h-[30px] bg-ink" : "h-[24px] border-[1.5px] border-dashed border-muted"}`}
              />
            ))}
          </View>
        </Panel>
        <Panel shout="It's out!" caption="See what's out">
          <Text className="font-brand pr-[6px] text-[24px] leading-[30px] text-ink">
            Vol. 114
            {"\u00A0"}
          </Text>
        </Panel>
        <Panel shout="Deal!" caption="And what it costs">
          <Text className="font-mono-medium text-[20px] text-ink">
            $9.58{" "}
            <Text className="font-mono text-[12.5px] text-muted line-through">
              $10.79
            </Text>
          </Text>
        </Panel>
      </View>
      <View className="gap-3">
        <Button
          kind="primary"
          label="Start your shelf"
          wide
          onPress={() => router.push("/sign-up")}
        />
        <Button
          kind="secondary"
          label="Check a price first"
          wide
          onPress={() => router.navigate("/prices")}
        />
      </View>
      {/* try it first: the website's practice shelves, with nothing kept */}
      <View className="gap-2">
        <Text className="text-center font-body text-[14.5px] text-ink-soft">
          Or try it first on a practice shelf, no account needed:
        </Text>
        {starting ? <StockingShelf /> : null}

        <View className="flex-row gap-2.5">
          <Button label="A reader's" grow onPress={() => start("reader")} />
          <Button
            label="A collector's"
            grow
            onPress={() => start("collector")}
          />
        </View>
      </View>
      <Text className="text-center font-body text-[14.5px] text-ink-soft">
        Already have a shelf?{"  "}
        <Text
          onPress={() => router.push("/sign-in")}
          className="font-body-semibold text-accent"
        >
          Sign in
        </Text>
      </Text>
      <View className="flex-row justify-center gap-6 border-t border-line-soft pt-4">
        {(
          [
            ["About", "/about"],
            ["Questions", "/faq"],
            ["Privacy", "/privacy"],
          ] as const
        ).map(([label, href]) => (
          <Tap key={href} onPress={() => router.push(href)} hitSlop={8}>
            <Text className="font-body-medium text-[14px] text-ink-soft">
              {label}
            </Text>
          </Tap>
        ))}
      </View>
    </ScrollView>
  );
}
