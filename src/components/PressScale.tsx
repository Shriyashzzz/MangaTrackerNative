// Something that gives under the finger: it eases down a touch while held
// and springs back on release, as iOS buttons and cards do. Android also
// draws its ripple over it. The one press feel every card and button shares
import type { ReactNode } from "react";
import {
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { look } from "@/lib/platformLook";
import { useRipple } from "@/lib/press";
import { controlUsed } from "@/lib/tourGo";

const RELEASE = { damping: 18, stiffness: 340, mass: 0.6 };

export default function PressScale({
  children,
  style,
  className,
  scaleTo = look.pressScale,
  ...pressable
}: Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
  // how far it gives: less for something big (a whole row)
  scaleTo?: number;
}) {
  const ripple = useRipple();
  const scale = useSharedValue(1);
  const look = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={[look, style]}>
      <Pressable
        {...pressable}
        // (Kenji's tour steps aside when something is pressed)
        onPress={
          pressable.onPress
            ? (e) => {
                controlUsed();
                pressable.onPress?.(e);
              }
            : undefined
        }
        android_ripple={ripple}
        className={className}
        onPressIn={(e) => {
          if (scaleTo !== 1) scale.set(withTiming(scaleTo, { duration: 90 }));
          pressable.onPressIn?.(e);
        }}
        onPressOut={(e) => {
          scale.set(withSpring(1, RELEASE));
          pressable.onPressOut?.(e);
        }}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
