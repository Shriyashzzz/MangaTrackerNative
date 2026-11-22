// Kenji's tour of the practice shelf, the app's way: a speech bubble that
// floats over the page (it never pushes the page about), with Kenji
// leaning on its corner. He sits at the foot of the screen, above the tab
// bar where there is one, and what he's pointing at is scrolled up clear of
// him and ringed (TourTarget); when it can't be, he moves to the top.
// Next takes them to the page his next line is about. Hidden, he's a small
// round button to bring him back. The bubble (or a pill beside the button)
// also says it's a practice shelf, with the two ways out: no strip of its
// own along the foot. The lines are the website's (core
// components/tour/steps.ts), the phone's wording where it has one
import { router, usePathname, type Href } from "expo-router";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InkCrossIcon } from "@/core/components/icons/Icons";
import type { TourStep } from "@/core/components/tour/steps";
import { useColors } from "@/lib/colors";
import { inPractice, leavePractice } from "@/lib/practice";
import { hrefOf } from "@/lib/webRoutes";
import { useTour } from "@/store/tour";
import Button from "./Button";
import Mascot from "./Mascot";
import Tap from "./Tap";

// the app's page for a step: the shelf's New tab is a tab of the app's own,
// and the rest are the website's addresses, turned into the app's
function pageOf(step: TourStep): Href | null {
  const to = step.go ?? step.path;
  if (to === "/shelf") return step.tab === "new" ? "/new" : "/";
  if (to.startsWith("/add")) {
    const title = new URLSearchParams(to.split("?")[1] ?? "").get("title");
    return { pathname: "/add", params: title ? { title } : {} };
  }
  if (to.startsWith("/settings/"))
    return { pathname: "/settings", params: { tab: to.split("/")[2]! } };
  return hrefOf(to);
}
const pathOf = (href: Href) =>
  typeof href === "string" ? href : (href.pathname as string);

// the pages with the tab bar along their foot: Kenji sits above it there
const TAB_PAGES = new Set(["/", "/new", "/prices", "/account"]);
const TAB_BAR = 84;

export default function Tour({ signedIn }: { signedIn: boolean }) {
  const { steps, at, hidden, atTop, move, hide } = useTour();
  const here = usePathname();
  const insets = useSafeAreaInsets();
  const c = useColors();
  const step = steps[at];
  if (!signedIn || !inPractice() || !step) return null;
  const foot = (TAB_PAGES.has(here) ? TAB_BAR : 0) + 12;

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

  const go = (by: 1 | -1) => {
    move(by);
    const next = useTour.getState().steps[useTour.getState().at];
    const page = next ? pageOf(next) : null;
    if (page && pathOf(page) !== here) router.navigate(page);
  };
  const last = at === steps.length - 1;
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-3 left-3"
      style={atTop ? { top: insets.top + 70 } : { bottom: foot }}
    >
      <View
        className="rounded-[18px] border-[1.5px] border-line bg-card px-3.5 pt-3 pb-2.5"
        style={{ elevation: 8 }}
      >
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
          {/* (the website has a Hide Kenji button; here it's the ✕) */}
          {(step.phoneSay ?? step.say).replace("Tap Hide Kenji", "Tap the ✕")}
        </Text>
        {/* the shelf's Volumes view is theirs to open: the app's shelf
            keeps its tab where they left it */}
        {step.tab === "volumes" ? (
          <Text className="pt-1 font-body text-[12.5px] text-ink-soft">
            On My shelf, tap ALL at the top and pick Volumes.
          </Text>
        ) : null}
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
          {at > 0 ? <Button small label="Back" onPress={() => go(-1)} /> : null}
          <Button
            small
            kind="primary"
            label={last ? "Done" : "Next"}
            onPress={() => (last ? hide(true) : go(1))}
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
