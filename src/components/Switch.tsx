// An on/off setting, as Android's switch (the web's .app-switch): a row with
// its words and the switch on the right
import * as Haptics from "expo-haptics";
import { Pressable, Switch as NativeSwitch, Text } from "react-native";
import { useColors } from "@/lib/colors";
import { PRINTED } from "@/lib/printed";

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
        // the knob is always light, so it reads on the dark track in dark
        // mode as well as on the accent when on
        trackColor={{ false: c.lineSoft, true: c.accent }}
        thumbColor={PRINTED.paper}
        ios_backgroundColor={c.lineSoft}
      />
    </Pressable>
  );
}
