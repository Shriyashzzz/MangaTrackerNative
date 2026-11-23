// The shelf for someone not signed in (the web's pages/Home/GuestHero.tsx):
// what a shelf is for, and the two ways in. Prices stay open to them along
// the bottom
import { useTabFoot } from "@/lib/tabHeader";
import { columnStyle, useWide } from "@/lib/wide";
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
import {
  Modal,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import AuthArt from "./AuthArt";
import Button from "./Button";

// what a shelf does, as four stamps lettered at a slant, each in its own ink
const STAMPS = [
  {
    label: "Keep your place",
    box: "bg-accent",
    text: "text-on-accent",
    tilt: -3,
  },
  { label: "Track what you own", box: "bg-ink", text: "text-paper", tilt: 2 },
  {
    label: "See what's out",
    box: "bg-award-market",
    text: "text-ink",
    tilt: -2,
  },
  {
    label: "And what it costs",
    box: "bg-award-set",
    text: "text-on-award-set",
    tilt: 3,
  },
];

// a practice shelf's button inside Kenji's bubble, drawn like a panel
function TourButton({
  kind,
  onPress,
}: {
  kind: "Reader" | "Collector";
  onPress: () => void;
}) {
  const label = `${kind}'s tour`;
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Tour a ${kind.toLowerCase()}'s practice shelf`}
      // room inside the outline, so the words never touch it
      className="flex-1 items-center justify-center rounded-[10px] border-2 border-line bg-paper-2 px-2.5 py-2"
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        // one size for both, so the pair matches ("Collector's" is the
        // longer and sets it)
        className="text-center font-brand pr-[4px] text-[15px] tracking-[0.5px] text-ink uppercase"
      >
        {label}
        {"\u00A0"}
      </Text>
    </Tap>
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

// the box's widest on an iPad
const TALL_WIDTH = 580;

export default function GuestShelf() {
  const foot = useTabFoot(120);
  // a small screen (an iPhone app in an iPad's window, a small phone): the
  // box set tighter, so it still fits without its lines wrapping
  const { width, height } = useWindowDimensions();
  const small = width < 380 || height < 760;
  // an iPad: the box stands tall, like a volume on the shelf, its parts
  // spread down it rather than bunched in the middle of the screen
  const { wide } = useWide();
  const tall = wide && height >= 900;
  // pressed: the loader shows first, then the shelf is put together (the
  // work would otherwise hold the press's own frame back)
  const [starting, setStarting] = useState(false);
  const start = (kind: "reader" | "collector") => {
    setStarting(true);
    // (long enough for the window to open and the books to start bouncing:
    // putting the shelf together holds everything else still)
    setTimeout(() => startPractice(kind), 350);
  };
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow justify-center gap-6 px-4 pt-4"
      // room under the last line (About, Questions, Privacy), clear of the
      // tab bar
      contentContainerStyle={{
        ...columnStyle,
        // on an iPad, a volume's width rather than the whole column
        ...(tall ? { maxWidth: TALL_WIDTH } : {}),
        paddingBottom: foot,
      }}
    >
      {starting ? <StockingShelf /> : null}
      {/* the whole welcome as volume one: an inked box with a spine */}
      <View
        className="flex-row overflow-hidden rounded-[14px] border-2 border-line bg-card"
        style={tall ? { minHeight: Math.min(height * 0.56, 780) } : undefined}
      >
        <View
          accessible={false}
          importantForAccessibility="no-hide-descendants"
          className="w-[34px] items-center justify-end bg-ink pb-3.5"
        >
          {/* the spine's title, read from the top down */}
          <View
            className="absolute top-[78px] w-[140px] items-center"
            style={{ left: -53, transform: [{ rotate: "90deg" }] }}
          >
            <Text className="font-brand pr-[3px] text-[13px] tracking-[2px] text-paper uppercase">
              Manga Tracker{"\u00A0"}
            </Text>
          </View>
          <View className="w-[26px] items-center rounded-[3px] bg-award-market pt-[3px]">
            <Text className="font-brand pr-[2px] text-[18px] text-ink">
              1{"\u00A0"}
            </Text>
          </View>
        </View>
        <View
          className={`flex-1 ${small ? "gap-2.5 p-3" : tall ? "justify-center gap-7 px-7 py-8" : "gap-3.5 p-3.5"}`}
        >
          <AuthArt
            compact={!tall}
            sfx="A new series begins!"
            chapter="1"
            line="Your shelf lives here once you sign up."
          />
          <View
            className="flex-row flex-wrap gap-x-1.5 gap-y-2"
            accessibilityLabel="Keep your place in every series, track the volumes you own, and see what's out and what it costs."
          >
            {STAMPS.map((stamp) => (
              <View
                key={stamp.label}
                className={`border-2 border-line px-2 pt-[3px] ${stamp.box}`}
                style={{ transform: [{ rotate: `${stamp.tilt}deg` }] }}
              >
                <Text
                  className={`font-brand pr-[3px] tracking-[0.5px] uppercase ${small ? "text-[13px]" : tall ? "text-[18px]" : "text-[15px]"} ${stamp.text}`}
                >
                  {stamp.label}
                  {"\u00A0"}
                </Text>
              </View>
            ))}
          </View>
          {/* Kenji offers the tour: the practice shelves, nothing kept */}
          <View className="flex-row items-end gap-1.5">
            <View style={{ marginBottom: -2 }}>
              <Mascot mood="happy" width={small ? 56 : tall ? 96 : 72} />
            </View>
            <View className="mb-5 flex-1 rounded-[18px] border-2 border-line bg-card px-2.5 pt-2.5 pb-2.5">
              <Text
                className={`font-brand pr-[4px] tracking-[0.5px] text-ink uppercase ${small ? "text-[18px] leading-[20px]" : "text-[21px] leading-[23px]"}`}
              >
                Want the tour first?{"\u00A0"}
              </Text>
              <Text className="mt-0.5 mb-2 font-body text-[12.5px] leading-[17px] text-ink-soft">
                I&apos;ll walk you round a practice shelf.
              </Text>
              <View className="flex-row gap-1.5">
                <TourButton kind="Reader" onPress={() => start("reader")} />
                <TourButton
                  kind="Collector"
                  onPress={() => start("collector")}
                />
              </View>
              {/* the bubble's tail, pointing at him */}
              <View
                className="absolute h-[18px] w-[18px] border-b-2 border-l-2 border-line bg-card"
                style={{
                  left: -10,
                  bottom: 18,
                  transform: [{ rotate: "45deg" }],
                }}
              />
            </View>
          </View>
          {/* the way to start a real shelf, kept together so on a tall
              box the line sits right over its button */}
          <View className={small ? "gap-2.5" : "gap-3.5"}>
            <Text className="text-center font-display text-[14.5px] text-ink">
              Or keep your own shelf from day one.
            </Text>
            <Button
              kind="primary"
              label="Start your shelf"
              wide
              onPress={() => router.push("/sign-up")}
            />
            <Text className="text-center font-body text-[14px] text-ink-soft">
              Already have a shelf?{"  "}
              <Text
                onPress={() => router.push("/sign-in")}
                accessibilityRole="link"
                className="font-body-semibold text-accent"
              >
                Sign in
              </Text>
            </Text>
          </View>
        </View>
      </View>
      <View className="flex-row justify-center gap-6">
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
