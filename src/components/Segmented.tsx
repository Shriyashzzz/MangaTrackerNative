// A few choices in one bar, one picked: the Android app's segmented bars
// (Still reading / Finished it / Want to read, Volumes / Editions, All / New /
// Used). The picked one's fill slides to it rather than jumping, with the
// system's selection tick, as the platforms' own segmented controls do
import * as Haptics from "expo-haptics";
import { useEffect, useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useColors } from "@/lib/colors";
import { isAndroid, look } from "@/lib/platformLook";

// quick and settled, no wobble
const SLIDE = { damping: 26, stiffness: 320, mass: 0.7 };
// the track's own padding round the pill (and Android's outline)
const BORDER = isAndroid ? 1.5 : look.segmentInset;

export default function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  const picked = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  );
  const cell = width / options.length;
  const at = useSharedValue(0);
  useEffect(() => {
    if (cell) at.set(withSpring(picked * cell, SLIDE));
  }, [at, cell, picked]);
  const fill = useAnimatedStyle(() => ({
    transform: [{ translateX: at.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const inner = e.nativeEvent.layout.width - BORDER * 2;
    // the fill starts where it belongs, without sliding in from the left
    if (!width) at.set((picked * inner) / options.length);
    setWidth(inner);
  };

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      onLayout={onLayout}
      className={`flex-row overflow-hidden ${look.segmentTrack}`}
    >
      {cell ? (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              top: isAndroid ? 0 : BORDER,
              bottom: isAndroid ? 0 : BORDER,
              left: isAndroid ? 0 : BORDER,
              width: cell,
              borderRadius: look.segmentRadius,
              // Android: Material's tonal fill; iOS: a raised white pill
              backgroundColor: isAndroid ? `${c.accent}33` : c.card,
              boxShadow: isAndroid
                ? undefined
                : "0px 1px 4px rgba(0, 0, 0, 0.25)",
            },
            fill,
          ]}
        />
      ) : null}
      {options.map((o, i) => {
        const on = i === picked;
        return (
          <Pressable
            key={o.value}
            onPress={() => {
              if (on) return;
              void Haptics.selectionAsync();
              onChange(o.value);
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            className={`flex-1 items-center justify-center px-2 ${isAndroid ? "min-h-[40px]" : "min-h-[34px] py-1.5"}`}
          >
            <Text
              className={`text-center text-[14.5px] ${on ? "font-body-semibold text-ink" : "font-body-medium text-ink-soft"}`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
