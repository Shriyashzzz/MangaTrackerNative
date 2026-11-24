// Kenji's tour of the practice shelf, the app's way: a speech bubble that
// floats over the page (it never pushes the page about), with Kenji
// leaning on its corner. It sits right under the thing he's talking about
// (or over it, when there's no room under), with a small tail pointing at
// it; with nothing to point at, it rests at the foot of the screen, above
// the tab bar where there is one. Next takes them to the page his next line
// is about. Pressing a button of the app's means they've started using
// the page: he steps aside to a small round button at the foot, and comes
// back on a tap. The bubble
// (or a pill beside the button) also says it's a practice shelf, with the
// two ways out. The lines are the website's (core components/tour/
// steps.ts), the phone's wording where it has one
import { useCorners } from "@/lib/mangaThemes";
import { usePathname } from "expo-router";
import { useState } from "react";
import { Platform, Text, useWindowDimensions, View } from "react-native";
import Animated, { LinearTransition } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InkCrossIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { inPractice, leavePractice } from "@/lib/practice";
import { tourBack, tourGo, touchIsKenjis } from "@/lib/tourGo";
import { useTour } from "@/store/tour";
import { useTabsOnTop } from "@/lib/tabHeader";
import {
  PLUS_RIGHT,
  PLUS_RIGHT_PAD,
  PLUS_SIZE,
  usePlusShown,
} from "@/lib/floatingPlus";
import Button from "./Button";
import Mascot from "./Mascot";
import Tap from "./Tap";

// the pages with the tab bar along their foot: Kenji rests above it there.
// (To buy and Me are tabs on an iPhone; on Android they're pages without
// the bar, and their addresses differ)
const TAB_PAGES = new Set(["/", "/new", "/prices", "/buy", "/me"]);
// whole-screen pages with their own bar along the foot (the camera's):
// Kenji steps out while one is open, and is back after
const OWN_FOOT = new Set(["/scan"]);
// the air between Kenji and the shelf's floating +
const PLUS_AIR = 12;
// the tab bar's height over the home bar: Apple's floating bar, or
// Android's taller one
const TAB_BAR = Platform.OS === "ios" ? 50 : 80;
// the room left between the bubble and what it sits beside (the thing he
// points at, the tab bar, the screen's foot)
const GAP = 22;
// under the header, the highest the bubble goes
const HEADER = 64;
// the room at each side of the bubble
const SIDE = 12;
// the bubble's widest: on an iPad it stays a speech bubble in the middle,
// not a banner across the screen
const BUBBLE_MOST = 540;
// On an iPad the tabs are a bar along the top, centred: New is the second of
// five, a little left of the middle (measured on the iPad simulators)
const NEW_TAB_FROM_MIDDLE = -58;
const TOP_TAB_WIDTH = 64;
const TOP_TAB_HEIGHT = 44;
// On an iPhone the bar along the foot is Apple's floating one, inset from
// the screen's sides, with five tabs (My shelf, New, Prices, To buy, Me):
// New is the second. Android's bar spans the screen with three, New the
// middle one (measured on the simulators)
const IPHONE_BAR_INSET = 21;
const IPHONE_TABS = 5;
const footTab = (width: number) =>
  Platform.OS === "ios"
    ? {
        x: IPHONE_BAR_INSET + (width - 2 * IPHONE_BAR_INSET) / IPHONE_TABS,
        width: (width - 2 * IPHONE_BAR_INSET) / IPHONE_TABS,
      }
    : { x: width / 3, width: width / 3 };

export default function Tour({ signedIn }: { signedIn: boolean }) {
  const corners = useCorners();
  const { steps, at, hidden, done, box: found, hide, finish } = useTour();
  const here = usePathname();
  const insets = useSafeAreaInsets();
  const { height: screen, width } = useWindowDimensions();
  const c = useColors();
  const [height, setHeight] = useState(0);
  const tabsOnTop = useTabsOnTop();
  const plusOnShelf = usePlusShown((s) => s.shown) && here === "/";
  const plusTop = usePlusShown((s) => s.top);
  // picking several on the shelf: Select's buttons sit along the foot, so
  // Kenji steps out of the way until it's closed
  const dockOnShelf = usePlusShown((s) => s.dock) && here === "/";
  const step = steps[at];
  if (!signedIn || !inPractice() || !step) return null;
  if (dockOnShelf || OWN_FOOT.has(here)) return null;
  // above the tab bar where it runs along the foot; on an iPad, where it
  // runs along the top, just clear of the home bar
  const foot = tabsOnTop
    ? insets.bottom + GAP
    : (TAB_PAGES.has(here) ? insets.bottom + TAB_BAR : 0) + GAP;
  // the room either side: a phone's 12, more on a wide screen
  const side = Math.max(SIDE, (width - BUBBLE_MOST) / 2);
  // the shelf's +, at the foot on the right: Kenji leaves it free. Where
  // he'd reach across it (a phone, where he's as wide as the screen), his
  // bubble and his button rise above it; on a wide screen he's clear of it
  const plusRoom = plusOnShelf
    ? (tabsOnTop ? PLUS_RIGHT_PAD : PLUS_RIGHT) + PLUS_SIZE + PLUS_AIR
    : 0;
  const besidePlus = plusRoom > side;
  // (above where the + was measured; until it is, about where it sits)
  const bubbleFoot = besidePlus
    ? Math.max(
        foot,
        plusTop !== null
          ? screen - plusTop + PLUS_AIR
          : foot + PLUS_SIZE + PLUS_AIR,
      )
    : foot;

  // the two ways out of the practice shelf: an account of their own, or
  // just leaving. Always within reach, in the bubble or beside Kenji's button
  const waysOut = (
    <>
      <Tap onPress={() => leavePractice("/sign-up")} hitSlop={14}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className="font-body-semibold text-[14px] text-accent-ink"
        >
          Start mine
        </Text>
      </Tap>
      <Tap onPress={() => leavePractice("/")} hitSlop={14}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className="font-body-semibold text-[14px] text-ink-soft"
        >
          Leave
        </Text>
      </Tap>
    </>
  );

  // The tour over: Kenji has gone, and only the ways out of the practice
  // shelf stay, in a small pill at the foot (beside the shelf's +, which
  // it leaves free)
  if (done)
    return (
      <View
        pointerEvents="box-none"
        className="absolute flex-row"
        style={{
          bottom: foot,
          left: side,
          right: besidePlus ? plusRoom : side,
        }}
      >
        <View
          className="min-h-[48px] shrink flex-row items-center gap-3 rounded-full border-[1.5px] border-line bg-card px-4"
          style={{ elevation: 6 }}
        >
          <Text
            numberOfLines={1}
            className="shrink font-mono text-[11.5px] text-muted"
          >
            Practice shelf
          </Text>
          {waysOut}
        </View>
      </View>
    );

  // Aside: Kenji as a round button to come back by, and a pill beside him
  // with the two ways out and "Back to the tour". Both tall enough to hit without aiming
  if (hidden)
    return (
      <View
        pointerEvents="box-none"
        className="absolute flex-row items-center gap-2"
        style={{ bottom: bubbleFoot, left: side, right: side }}
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
          className="min-h-[54px] shrink flex-row items-center gap-3 self-center rounded-full border-[1.5px] border-line bg-card px-4"
          style={{ elevation: 6 }}
        >
          {/* leaving first, coming back last: the way back to the tour
              sits where the thumb ends up */}
          <Tap
            onPress={() => leavePractice("/")}
            hitSlop={14}
            className="shrink"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              className="font-body-semibold text-[14px] text-ink-soft"
            >
              Leave
            </Text>
          </Tap>
          <Tap
            onPress={() => leavePractice("/sign-up")}
            hitSlop={14}
            className="shrink"
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              className="font-body-semibold text-[14px] text-accent-ink"
            >
              Start mine
            </Text>
          </Tap>
          <Tap onPress={tourBack} hitSlop={14} className="shrink">
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              className="font-body-semibold text-[14px] text-ink"
            >
              Back to the tour
            </Text>
          </Tap>
        </View>
      </View>
    );

  // A step about the New tab points at the tab itself, in the bar along
  // the foot (footTab) or, on an iPad, along the top
  const aboutNewTab =
    step.tab === "new" &&
    (step.target === "tab-new" ||
      step.target === "shelf" ||
      step.target === "alerts");
  const box = !aboutNewTab
    ? found
    : tabsOnTop
      ? {
          x: width / 2 + NEW_TAB_FROM_MIDDLE - TOP_TAB_WIDTH / 2,
          width: TOP_TAB_WIDTH,
          y: insets.top,
          height: TOP_TAB_HEIGHT,
        }
      : {
          ...footTab(width),
          y: screen - insets.bottom - 62,
          height: 62,
        };
  // Where the bubble goes: under the thing he points at, with its tail up;
  // over it, tail down, when there's no room under; at the foot, with no
  // tail, when there's nothing to point at (or it's too tall for either)
  // (under it, a little more room: Kenji's head rises above the bubble)
  const under = box ? box.y + box.height + GAP + 14 : 0;
  const over = box ? box.y - GAP - height : 0;
  const place: { top?: number; bottom?: number; tail: "up" | "down" | null } =
    box && height && under + height <= screen - bubbleFoot
      ? { top: under, tail: "up" }
      : box && height && over >= insets.top + HEADER
        ? { top: over, tail: "down" }
        : // too tall to sit beside: he rests at the foot and still
          // points up at it
          { bottom: bubbleFoot, tail: box && height ? "up" : null };
  // On a wide screen the bubble is narrower than the screen: it slides
  // towards what he points at (the + in the corner, a tab), as far as the
  // screen's edge allows, so the tail can reach it. On a phone it spans the
  // screen anyway
  const bubbleWidth = width - 2 * side;
  const target = box ? box.x + box.width / 2 : width / 2;
  const left = Math.min(
    Math.max(target - bubbleWidth / 2, SIDE),
    width - bubbleWidth - SIDE,
  );
  const right = width - left - bubbleWidth;
  // the tail points at the middle of the thing, as far as the bubble's
  // corners (and Kenji, on its top left) allow
  const middle = target - left;
  const tailAt = Math.min(Math.max(middle, 84), bubbleWidth - 34) - 7;
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
      className="absolute"
      style={{ top: place.top, bottom: place.bottom, left, right }}
      // it glides to its next place: a hop would read as a stutter
      layout={LinearTransition.duration(180)}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      onTouchStart={touchIsKenjis}
    >
      <View
        className="rounded-[18px] border-[1.5px] border-line bg-card px-3.5 pt-3 pb-2.5"
        style={[{ elevation: 8 }, corners.panel]}
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
            onPress={() => (last ? finish() : tourGo(1))}
          />
        </View>
        {/* it's a practice shelf: said once, quietly, with the ways out */}
        <View className="mt-2.5 flex-row items-center gap-3 border-t border-dotted border-line-soft pt-2">
          {/* on a narrow phone it wraps, so the ways out stay in the bubble */}
          <Text className="mr-auto shrink font-mono text-[11.5px] text-muted">
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
      "New haul? The + button scans the barcodes on the spines, one after another.",
      "The + button adds a manga: scan the barcode on the book, or type its title.",
    )
    .replace(
      "Import your list, under your avatar at the top right, brings yours over in one go.",
      "To bring your own list in, tap your picture at the top right and pick Import your list.",
    )
    .replace(
      "Let's open one: Berserk, collected in Deluxe.",
      "This is Berserk.",
    )
    // (nothing in the app promises a price: the stores' rules differ)
    .replace("Your shelf is free: bring", "Bring")
    // on an iPhone or iPad their picture is the Me tab, in the tab bar
    // (Android keeps it at the top right of the page)
    .replace(
      "your picture at the top right",
      Platform.OS === "ios"
        ? "your picture in the tab bar"
        : "your picture at the top right",
    )
    .replace(
      "under your avatar at the top right",
      Platform.OS === "ios"
        ? "under your picture in the tab bar"
        : "under your avatar at the top right",
    );
