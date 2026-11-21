// A row that opens to more under it ("Your books 2 ›"), as the Android app
// folds a series page's lists (the web's .app-row-fold): the name with its
// count, something quiet on the right, and a chevron that turns when open
import { useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useRipple } from "@/lib/press";
import { ChevronRightIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";

export default function FoldRow({
  title,
  count,
  aside,
  openAtFirst = false,
  children,
}: {
  title: string;
  count?: number;
  // "$84.00 paid", in the accent colour
  aside?: string;
  // shown open to begin with
  openAtFirst?: boolean;
  children: ReactNode;
}) {
  const c = useColors();
  const [open, setOpen] = useState(openAtFirst);
  const ripple = useRipple();
  return (
    <Animated.View
      layout={LinearTransition}
      className="border-t border-line-soft"
    >
      <Pressable
        android_ripple={ripple}
        onPress={() => setOpen(!open)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-2 py-4 active:bg-accent-wash"
      >
        <Text className="font-body-medium text-[16px] text-ink">{title}</Text>
        {count !== undefined ? (
          <Text className="font-mono text-[13px] text-ink-soft">{count}</Text>
        ) : null}
        {aside ? (
          <Text className="ml-2 font-mono text-[13px] text-accent">
            {aside}
          </Text>
        ) : null}
        <View
          className="ml-auto"
          style={{ transform: [{ rotate: open ? "90deg" : "0deg" }] }}
        >
          <ChevronRightIcon color={c.muted} width={18} height={18} />
        </View>
      </Pressable>
      {open ? (
        <Animated.View entering={FadeIn.duration(180)} className="pb-4">
          {children}
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}
