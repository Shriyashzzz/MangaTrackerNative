// While a free reader tries a manga theme on: a small pill near the top of
// every screen with the time left, so it's plain the look is borrowed.
// Tapping it offers Premium to keep it; the X takes it off now
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Tap from "@/components/Tap";
import { themeOf, useLook } from "@/lib/mangaThemes";
import { usePlan } from "@/store/plan";
import { useTabsOnTop } from "@/lib/tabHeader";

const clock = (ms: number) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export default function TryingTheme() {
  const trying = useLook((s) => s.trying);
  const until = useLook((s) => s.tryUntil);
  const takeOff = useLook((s) => s.takeOff);
  const premium = usePlan((s) => !s.plan.limited);
  const showCollector = usePlan((s) => s.showCollector);
  const insets = useSafeAreaInsets();
  // on an iPad the tab bar holds the top, so the pill sits at the foot
  const tabsOnTop = useTabsOnTop();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!trying) return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, [trying]);
  if (!trying || premium) return null;
  // the first minute is theirs to enjoy: no pill. Then faint, and solid for
  // the last 30 seconds
  const left = until - now;
  if (left > 60_000) return null;
  return (
    <View
      pointerEvents="box-none"
      className="absolute right-0 left-0 items-center"
      style={
        tabsOnTop ? { bottom: insets.bottom + 12 } : { top: insets.top + 4 }
      }
    >
      <View
        className="flex-row items-center gap-1 rounded-full border-[1.5px] border-ink bg-card pl-3.5 pr-1"
        style={{ opacity: left > 30_000 ? 0.55 : 1 }}
      >
        <Tap
          onPress={() => showCollector("theme")}
          accessibilityRole="button"
          accessibilityLabel={`Trying ${themeOf(trying)!.name}, ${clock(left)} left. Keep it with Premium`}
          className="flex-row items-center gap-2 py-1.5"
        >
          <Text className="font-body-semibold text-[13px] text-ink">
            Trying {themeOf(trying)!.name}
          </Text>
          <Text className="font-mono-medium text-[13px] text-accent-ink">
            {clock(left)}
          </Text>
          <Text className="font-body-semibold text-[13px] text-accent-ink">
            Keep it
          </Text>
        </Tap>
        <Tap
          onPress={takeOff}
          hitSlop={8}
          accessibilityLabel="Take the theme off"
          className="h-7 w-7 items-center justify-center"
        >
          <Text className="font-body-semibold text-[15px] text-muted">×</Text>
        </Tap>
      </View>
    </View>
  );
}
