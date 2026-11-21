// A few choices in one bar, one picked (the web forms' .segmented radio
// groups: Still reading / Finished it / Want to read, Manga / Light novel)
import { Pressable, Text, View } from "react-native";

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
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="flex-row overflow-hidden rounded-[4px] border-2 border-line"
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            className={`flex-1 items-center px-2 py-2.5 ${on ? "bg-ink" : "bg-card"} ${i ? "border-l-2 border-line" : ""}`}
          >
            <Text
              className={`text-center font-body-semibold text-[14px] ${on ? "text-paper" : "text-ink"}`}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
