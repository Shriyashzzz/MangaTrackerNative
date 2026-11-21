// A dashed divider between rows (the web's border-dashed). Android draws a
// View's dashed border only on all four sides, so it's an SVG line
import { useState } from "react";
import { View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { useColors } from "@/lib/colors";

export default function DashedLine({ soft = true }: { soft?: boolean }) {
  const c = useColors();
  const [width, setWidth] = useState(0);
  return (
    <View
      className="h-px w-full"
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 && (
        <Svg width={width} height={1}>
          <Line
            x1={0}
            y1={0.5}
            x2={width}
            y2={0.5}
            stroke={soft ? c.muted : c.line}
            strokeOpacity={soft ? 0.45 : 1}
            strokeWidth={1}
            strokeDasharray="4 3"
          />
        </Svg>
      )}
    </View>
  );
}
