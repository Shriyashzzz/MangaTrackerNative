// A note pinned to the foot of the screen, with an action: "6 volumes taken
// off your shelf · UNDO", as the web's components/toast. It goes by itself
// after 7 seconds. No action word: a note alone
import Tap from "@/components/Tap";
import { useEffect } from "react";
import { Text, useWindowDimensions } from "react-native";
import { useTabsOnTop } from "@/lib/tabHeader";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const SHOWN_MS = 7000;
// its widest: on an iPad a note, not a banner across the screen
const TOAST_MOST = 520;

export default function Toast({
  text,
  action,
  onAction,
  onGone,
}: {
  text: string;
  action: string;
  onAction: () => void;
  onGone: () => void;
}) {
  const insets = useSafeAreaInsets();
  // above the tab bar along the foot; an iPad's bar is along the top
  const tabsOnTop = useTabsOnTop();
  const { width } = useWindowDimensions();
  const side = Math.max(12, (width - TOAST_MOST) / 2);
  useEffect(() => {
    const timer = setTimeout(onGone, SHOWN_MS);
    return () => clearTimeout(timer);
  }, [onGone, text]);
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={{
        bottom: insets.bottom + (tabsOnTop ? 20 : 72),
        left: side,
        right: side,
      }}
      className="absolute flex-row items-center gap-4 rounded-lg bg-ink px-4 py-3.5"
    >
      <Text className="min-w-0 flex-1 font-body text-[15px] text-paper">
        {text}
      </Text>
      {action ? (
        <Tap onPress={onAction} hitSlop={10}>
          <Text className="font-body-semibold text-[15px] tracking-[0.5px] text-accent uppercase">
            {action}
          </Text>
        </Tap>
      ) : null}
    </Animated.View>
  );
}
