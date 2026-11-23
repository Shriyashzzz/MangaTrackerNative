// A slider over whole numbers (1 to max): drag the knob or touch the track.
// The website uses the browser's own range input here; this is the app's.
// It moves in steps, says each step as it's reached, and leaves an up or
// down drag to the page's scroll
import { useState } from "react";
import { View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

const KNOB = 26;

export default function StepSlider({
  value,
  min = 1,
  max,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  // what it sets, for a screen reader
  label: string;
}) {
  const [width, setWidth] = useState(0);
  // the knob's middle travels between the track's two ends, less half a
  // knob each side, so it never hangs over
  const run = Math.max(1, width - KNOB);
  const stepAt = (x: number) => {
    const share = Math.min(1, Math.max(0, (x - KNOB / 2) / run));
    return Math.round(min + share * (max - min));
  };
  const moveTo = (x: number) => {
    const next = stepAt(x);
    if (next !== value) onChange(next);
  };
  const drag = Gesture.Pan()
    .runOnJS(true)
    // sideways only: a drag up or down is the page scrolling
    .activeOffsetX([-6, 6])
    .failOffsetY([-12, 12])
    .onUpdate((e) => moveTo(e.x));
  const touch = Gesture.Tap()
    .runOnJS(true)
    .onEnd((e) => moveTo(e.x));
  const left = ((value - min) / Math.max(1, max - min)) * run;
  return (
    <GestureDetector gesture={Gesture.Race(drag, touch)}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityValue={{ min, max, now: value }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) =>
          onChange(
            e.nativeEvent.actionName === "increment"
              ? Math.min(max, value + 1)
              : Math.max(min, value - 1),
          )
        }
        onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
        // (tall enough to hit without aiming)
        className="h-11 justify-center"
      >
        <View className="h-1.5 overflow-hidden rounded-full bg-ink/15">
          <View
            className="h-full rounded-full bg-accent"
            style={{ width: left + KNOB / 2 }}
          />
        </View>
        <View
          className="absolute rounded-full border-2 border-accent bg-card"
          style={{
            left,
            width: KNOB,
            height: KNOB,
            boxShadow: "0px 2px 6px rgba(0, 0, 0, 0.3)",
          }}
        />
      </View>
    </GestureDetector>
  );
}
