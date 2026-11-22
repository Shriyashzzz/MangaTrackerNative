// Kenji's tour of the practice shelf, the app's way: a speech bubble that
// floats over the page (it never pushes the page about), with Kenji
// leaning on its corner. It sits right under the thing he's talking about
// (or over it, when there's no room under), with a small tail pointing at
// it; with nothing to point at, it rests at the foot of the screen, above
// the tab bar where there is one. Next takes them to the page his next line
// is about. Hidden, he's a small round button to bring him back. The bubble
// (or a pill beside the button) also says it's a practice shelf, with the
// two ways out. The lines are the website's (core components/tour/
// steps.ts), the phone's wording where it has one
import { usePathname } from "expo-router";
import { useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InkCrossIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { inPractice, leavePractice } from "@/lib/practice";
import { tourGo } from "@/lib/tourGo";
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

export default function Tour({ signedIn }: { signedIn: boolean }) {
  const { steps, at, hidden, box, hide } = useTour();
  const here = usePathname();
  const insets = useSafeAreaInsets();
  const { height: screen } = useWindowDimensions();
  const c = useColors();
  const [height, setHeight] = useState(0);
  const step = steps[at];
  if (!signedIn || !inPractice() || !step) return null;
  const foot = (TAB_PAGES.has(here) ? TAB_BAR : 0) + GAP;

  // the two ways out of the practice shelf: an account of their own, or
  // just leaving. Always within reach, in the bubble or beside Kenji's button
  const waysOut = (
    <>
      <Tap onPress={() => leavePractice("/sign-up")} hitSlop={8}>
        <Text className="font-body-semibold text-[13px] text-accent-ink">
          Start mine
        </Text>
      </Tap>
      <Tap onPress={() => leavePractice("/")} hitSlop={8}>
        <Text className="font-body-semibold text-[13px] text-ink-soft">
          Leave
        </Text>
      </Tap>
    </>
  );

  if (hidden)
    return (
      <View
        pointerEvents="box-none"
        className="absolute left-3 flex-row items-center gap-2"
        style={{ bottom: foot }}
      >
        <Tap
          feel="none"
          onPress={() => hide(false)}
          accessibilityLabel="Bring Kenji back"
          className="h-[52px] w-[52px] items-center justify-center rounded-full border-[1.5px] border-line bg-card"
          style={{ elevation: 6 }}
        >
          <Mascot mood="happy" width={38} />
        </Tap>
        <View
          className="flex-row items-center gap-3 rounded-full border-[1.5px] border-line bg-card px-3.5 py-2"
          style={{ elevation: 6 }}
        >
          <Text className="font-mono text-[11.5px] text-ink-soft">
            Practice shelf
          </Text>
          {waysOut}
        </View>
      </View>
    );

  // Where the bubble goes: under the thing he points at, with its tail up;
  // over it, tail down, when there's no room under; at the foot, with no
  // tail, when there's nothing to point at (or it's too tall for either)
  const under = box ? box.y + box.height + GAP : 0;
  const over = box ? box.y - GAP - height : 0;
  const place: { top?: number; bottom?: number; tail: "up" | "down" | null } =
    box && height && under + height <= screen - foot
      ? { top: under, tail: "up" }
      : box && height && over >= insets.top + HEADER
        ? { top: over, tail: "down" }
        : { bottom: foot, tail: null };
  const tail = (side: "up" | "down") => (
    <View
      className={`absolute right-10 h-3.5 w-3.5 rotate-45 border-line bg-card ${side === "up" ? "-top-2 border-t-[1.5px] border-l-[1.5px]" : "-bottom-2 border-r-[1.5px] border-b-[1.5px]"}`}
    />
  );
  const last = at === steps.length - 1;
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-3 left-3"
      style={{ top: place.top, bottom: place.bottom }}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
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
    </View>
  );
}

// Kenji's line, with the two places where the website's words don't fit
// the app: there's no "Hide Kenji" button here (it's the ✕ on his bubble),
// and Berserk's page is told top to bottom, so "Let's open one" isn't how
// its last step starts
const wordsFor = (said: string) =>
  said
    .replace("Tap Hide Kenji to", "Tap the ✕ on this bubble to")
    .replace("Let's open one: Berserk", "This is Berserk");
