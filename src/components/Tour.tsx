// Kenji's tour of the practice shelf, the app's way: a speech bubble that
// floats over the page (it never pushes the page about), with Kenji
// leaning on its corner. It sits right under the thing he's talking about
// (or over it, when there's no room under), with a small tail pointing at
// it; with nothing to point at, it rests at the foot of the screen, above
// the tab bar where there is one. Next takes them to the page his next line
// is about. A touch anywhere else on the page means they want to look
// around: he steps aside to a small round button at the foot, and comes
// back on a tap. The bubble
// (or a pill beside the button) also says it's a practice shelf, with the
// two ways out. The lines are the website's (core components/tour/
// steps.ts), the phone's wording where it has one
import { usePathname } from "expo-router";
import { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InkCrossIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { inPractice, leavePractice } from "@/lib/practice";
import { tourBack, tourGo, touchIsKenjis } from "@/lib/tourGo";
import { useTour } from "@/store/tour";
import Button from "./Button";
import Mascot from "./Mascot";
import Tap from "./Tap";

// the pages with the tab bar along their foot: Kenji rests above it there
const TAB_PAGES = new Set(["/", "/new", "/prices", "/account"]);
const TAB_BAR = 84;
// the room left between the bubble and what it sits beside (the thing he
// points at, the tab bar, the screen's foot)
const GAP = 22;
// under the header, the highest the bubble goes
const HEADER = 64;
// the room at each side of the bubble
const SIDE = 12;
// A step about something lower down the screen that has no ring of its own
// (the + button, Haikyu!!'s row on the Volumes view): the bubble rests at
// the top, clear of it
const AT_THE_FOOT = new Set(["scan", "gaps", "gaps-open"]);

export default function Tour({ signedIn }: { signedIn: boolean }) {
  const { steps, at, hidden, box: found, hide } = useTour();
  const here = usePathname();
  const insets = useSafeAreaInsets();
  const { height: screen, width } = useWindowDimensions();
  const c = useColors();
  const [height, setHeight] = useState(0);
  const step = steps[at];
  if (!signedIn || !inPractice() || !step) return null;
  const foot = (TAB_PAGES.has(here) ? TAB_BAR : 0) + GAP;

  // the two ways out of the practice shelf: an account of their own, or
  // just leaving. Always within reach, in the bubble or beside Kenji's button
  const waysOut = (
    <>
      <Tap onPress={() => leavePractice("/sign-up")} hitSlop={14}>
        <Text className="font-body-semibold text-[14px] text-accent-ink">
          Start mine
        </Text>
      </Tap>
      <Tap onPress={() => leavePractice("/")} hitSlop={14}>
        <Text className="font-body-semibold text-[14px] text-ink-soft">
          Leave
        </Text>
      </Tap>
    </>
  );

  // Aside: Kenji as a round button to come back by, and a pill beside him
  // with Next and the two ways out. Both tall enough to hit without aiming
  if (hidden)
    return (
      <View
        pointerEvents="box-none"
        className="absolute left-3 flex-row items-center gap-2"
        style={{ bottom: foot }}
        onTouchStart={touchIsKenjis}
      >
        <Tap
          feel="none"
          onPress={tourBack}
          accessibilityLabel="Back to the tour"
          className="h-[60px] w-[60px] items-center justify-center rounded-full border-[1.5px] border-line bg-card"
          style={{ elevation: 6 }}
        >
          <Mascot mood="happy" width={44} />
        </Tap>
        <View
          className="min-h-[54px] flex-row items-center gap-4 rounded-full border-[1.5px] border-line bg-card px-4"
          style={{ elevation: 6 }}
        >
          {/* the tour goes on from here too: Next brings him back, on
              his next step */}
          {at < steps.length - 1 ? (
            <Tap
              onPress={() => {
                hide(false);
                tourGo(1);
              }}
              hitSlop={14}
            >
              <Text className="font-body-semibold text-[14px] text-ink">
                Next ›
              </Text>
            </Tap>
          ) : null}
          {waysOut}
        </View>
      </View>
    );

  // A step about the New tab points at the tab itself, in the bar along
  // the foot: the middle one of the three
  const aboutNewTab =
    step.tab === "new" &&
    (step.target === "tab-new" || step.target === "shelf");
  const box = aboutNewTab
    ? {
        x: width / 3,
        width: width / 3,
        y: screen - insets.bottom - 62,
        height: 62,
      }
    : found;
  // Where the bubble goes: under the thing he points at, with its tail up;
  // over it, tail down, when there's no room under; at the foot, with no
  // tail, when there's nothing to point at (or it's too tall for either)
  // (under it, a little more room: Kenji's head rises above the bubble)
  const under = box ? box.y + box.height + GAP + 14 : 0;
  const over = box ? box.y - GAP - height : 0;
  const place: { top?: number; bottom?: number; tail: "up" | "down" | null } =
    box && height && under + height <= screen - foot
      ? { top: under, tail: "up" }
      : box && height && over >= insets.top + HEADER
        ? { top: over, tail: "down" }
        : AT_THE_FOOT.has(step.target ?? "")
          ? { top: insets.top + HEADER + 46, tail: null }
          : // too tall to sit beside: he rests at the foot and still
            // points up at it
            { bottom: foot, tail: box && height ? "up" : null };
  // the tail points at the middle of the thing, as far as the bubble's
  // corners (and Kenji, on its top left) allow
  const middle = box ? box.x + box.width / 2 - SIDE : 0;
  const tailAt = Math.min(Math.max(middle, 84), width - 2 * SIDE - 34) - 7;
  const tail = (side: "up" | "down") => (
    <View
      style={{ left: tailAt }}
      className={`absolute h-3.5 w-3.5 rotate-45 border-line bg-card ${side === "up" ? "-top-2 border-t-[1.5px] border-l-[1.5px]" : "-bottom-2 border-r-[1.5px] border-b-[1.5px]"}`}
    />
  );
  const last = at === steps.length - 1;
  return (
    <Animated.View
      pointerEvents="box-none"
      className="absolute right-3 left-3"
      style={{ top: place.top, bottom: place.bottom }}
      // it glides to its next place: a hop would read as a stutter
      layout={LinearTransition.duration(180)}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      onTouchStart={touchIsKenjis}
    >
      <View
        className="rounded-[18px] border-[1.5px] border-line bg-card px-3.5 pt-3 pb-2.5"
        style={{ elevation: 8 }}
      >
        {place.tail ? tail(place.tail) : null}
        {/* Kenji leans on the bubble's top corner, half outside it */}
        <View className="absolute -top-6 left-3">
          <Mascot mood="happy" width={50} />
        </View>
        <View className="flex-row items-center gap-2 pl-[58px]">
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-mono-medium text-[11px] tracking-[1px] text-accent-ink uppercase"
          >
            {step.part}
          </Text>
          <Tap
            feel="round"
            onPress={() => hide(true)}
            hitSlop={12}
            accessibilityLabel="Hide Kenji"
          >
            <InkCrossIcon color={c.muted} width={13} height={13} />
          </Tap>
        </View>
        <Text className="pt-2 font-body text-[14.5px] leading-[20px] text-ink">
          {wordsFor(step.phoneSay ?? step.say)}
        </Text>
        <View className="flex-row items-center gap-2.5 pt-2.5">
          {/* how far through: a dot a step, the one they're on filled */}
          <View className="mr-auto flex-row items-center gap-1">
            {steps.map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${i === at ? "w-4 bg-accent" : "w-1.5 bg-line-soft"}`}
              />
            ))}
          </View>
          {at > 0 ? (
            <Button small label="Back" onPress={() => tourGo(-1)} />
          ) : null}
          <Button
            small
            kind="primary"
            label={last ? "Done" : "Next"}
            onPress={() => (last ? hide(true) : tourGo(1))}
          />
        </View>
        {/* it's a practice shelf: said once, quietly, with the ways out */}
        <View className="mt-2.5 flex-row items-center gap-3 border-t border-dotted border-line-soft pt-2">
          <Text className="mr-auto font-mono text-[11.5px] text-muted">
            Practice shelf. Nothing is kept.
          </Text>
          {waysOut}
        </View>
      </View>
    </Animated.View>
  );
}

// Kenji's line, with the few places where the website's words don't fit
// the app or read badly on a phone: there's no "Hide Kenji" button here (it's the ✕ on his bubble),
// Berserk's page is told top to bottom, so "Let's open one" isn't how its
// last step starts, and the app doesn't say what it costs
const wordsFor = (said: string) =>
  said
    .replace("Tap Hide Kenji to", "Tap the ✕ on this bubble to")
    .replace(
      "Import your list, under your avatar at the top right, brings yours over in one go.",
      "To bring your own list in, tap your picture at the top right and pick Import your list.",
    )
    .replace(
      "Let's open one: Berserk, collected in Deluxe.",
      "This is Berserk.",
    )
    // (nothing in the app promises a price: the stores' rules differ)
    .replace("Your shelf is free: bring", "Bring");
