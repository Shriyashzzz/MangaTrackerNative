// An on/off setting, as Android's switch (the web's .app-switch): a row with
// its words and the switch on the right
import * as Haptics from "expo-haptics";
import { Pressable, Switch as NativeSwitch, Text } from "react-native";
import { useColors } from "@/lib/colors";

export default function Switch({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (on: boolean) => void;
}) {
  const c = useColors();
  const flip = (on: boolean) => {
    void Haptics.selectionAsync();
    onChange(on);
  };
  return (
    <Pressable
      onPress={() => flip(!value)}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
      className="flex-row items-center justify-between gap-3 py-1"
    >
      <Text className="shrink font-body text-[15px] text-ink">{label}</Text>
      <NativeSwitch
        value={value}
        onValueChange={flip}
        trackColor={{ false: c.line, true: c.accent }}
        thumbColor={c.paper}
      />
    </Pressable>
  );
}
