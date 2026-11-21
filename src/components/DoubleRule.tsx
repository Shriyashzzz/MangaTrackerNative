// The web's 3px double border (border-double), which React Native can't draw:
// two hairlines with a gap
import { View } from "react-native";

export default function DoubleRule() {
  return (
    <View className="h-[3px] justify-between">
      <View className="h-px bg-line" />
      <View className="h-px bg-line" />
    </View>
  );
}
