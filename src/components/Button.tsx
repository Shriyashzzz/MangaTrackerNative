// The app's button, as the web's .btn: secondary (outlined) by default,
// primary (inked in accent), small for a line of text, and full width for a
// row of its own ("Mark as finished")
import { Pressable, Text } from "react-native";
import { useRipple } from "@/lib/press";

const KINDS = {
  primary: { box: "border-line bg-accent", text: "text-on-accent" },
  secondary: { box: "border-line bg-card", text: "text-ink" },
  danger: { box: "border-accent bg-card", text: "text-accent" },
};

export default function Button({
  label,
  onPress,
  kind = "secondary",
  small = false,
  wide = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  kind?: keyof typeof KINDS;
  small?: boolean;
  wide?: boolean;
  disabled?: boolean;
}) {
  const look = KINDS[kind];
  const ripple = useRipple();
  return (
    <Pressable
      android_ripple={ripple}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      className={`items-center justify-center overflow-hidden rounded-[4px] border-2 active:opacity-80 ${look.box} ${small ? "px-3 py-1.5" : "px-4 py-3"} ${wide ? "self-stretch" : "self-start"} ${disabled ? "opacity-50" : ""}`}
    >
      <Text
        className={`font-body-semibold ${small ? "text-[14px]" : "text-[15.5px]"} ${look.text}`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
