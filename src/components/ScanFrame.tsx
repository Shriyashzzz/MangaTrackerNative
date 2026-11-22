// The scanner's viewfinder, drawn over the camera: a bracket in each corner
// and a line that sweeps down and back while it looks for a barcode. The
// line rests when a scan has just landed
import { useEffect, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/lib/colors";

const BRACKET = 26;
const STROKE = 3;
const INSET = 14;
const SWEEP_MS = 1700;
const WHITE = "#fffaf2";

const CORNERS = [
  { top: INSET, left: INSET, borderTopWidth: STROKE, borderLeftWidth: STROKE },
  {
    top: INSET,
    right: INSET,
    borderTopWidth: STROKE,
    borderRightWidth: STROKE,
  },
  {
    bottom: INSET,
    left: INSET,
    borderBottomWidth: STROKE,
    borderLeftWidth: STROKE,
  },
  {
    bottom: INSET,
    right: INSET,
    borderBottomWidth: STROKE,
    borderRightWidth: STROKE,
  },
] as const;

export default function ScanFrame({ looking }: { looking: boolean }) {
  const c = useColors();
  const [height, setHeight] = useState(0);
  const at = useSharedValue(0);
  const travel = Math.max(0, height - INSET * 2 - STROKE);

  useEffect(() => {
    if (!looking || !travel) {
      cancelAnimation(at);
      return;
    }
    at.set(0);
    at.set(
      withRepeat(
        withTiming(1, {
          duration: SWEEP_MS,
          easing: Easing.inOut(Easing.quad),
        }),
        -1,
        true,
      ),
    );
    return () => cancelAnimation(at);
  }, [at, looking, travel]);

  const line = useAnimatedStyle(() => ({
    transform: [{ translateY: at.value * travel }],
  }));

  return (
    <View
      pointerEvents="none"
      onLayout={(e: LayoutChangeEvent) =>
        setHeight(e.nativeEvent.layout.height)
      }
      style={{ position: "absolute", top: 0, right: 0, bottom: 0, left: 0 }}
    >
      {CORNERS.map((corner, i) => (
        <View
          key={i}
          style={{
            position: "absolute",
            width: BRACKET,
            height: BRACKET,
            borderColor: WHITE,
            borderRadius: 4,
            ...corner,
          }}
        />
      ))}
      {looking && travel ? (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: INSET,
              left: INSET + 6,
              right: INSET + 6,
              height: STROKE,
              borderRadius: STROKE,
              backgroundColor: c.accent,
              boxShadow: `0px 0px 10px ${c.accent}`,
            },
            line,
          ]}
        />
      ) : null}
    </View>
  );
}
