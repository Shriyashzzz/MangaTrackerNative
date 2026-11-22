// A note pinned to the foot of the screen, with an action: "6 volumes taken
// off your shelf · UNDO", as the web's components/toast. It goes by itself
// after 7 seconds. No action word: a note alone
import { useEffect } from "react";
import { Pressable, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

const SHOWN_MS = 7000;

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
  useEffect(() => {
    const timer = setTimeout(onGone, SHOWN_MS);
    return () => clearTimeout(timer);
  }, [onGone, text]);
  return (
    <Animated.View
      entering={FadeInDown.duration(220)}
      exiting={FadeOutDown.duration(180)}
      style={{ bottom: insets.bottom + 24 }}
      className="absolute inset-x-3 flex-row items-center gap-4 rounded-lg bg-ink px-4 py-3.5"
    >
      <Text className="min-w-0 flex-1 font-body text-[15px] text-paper">
        {text}
      </Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text className="font-body-semibold text-[15px] tracking-[0.5px] text-accent uppercase">
            {action}
          </Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}
