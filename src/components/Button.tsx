// The app's button: filled in the accent for the one main action, a soft
// tinted fill for the rest, a quiet outline for a destructive one. Rounded
// and pressed like a platform button (PressScale), in the app's own colours
// and type. Small for a line of text, wide for a row of its own
import { useCorners } from "@/lib/mangaThemes";
import { Text } from "react-native";
import { look as platform } from "@/lib/platformLook";
import PressScale from "./PressScale";

const KINDS = {
  primary: { box: "bg-accent", text: "text-on-accent" },
  secondary: { box: "bg-ink/10", text: "text-ink" },
  danger: {
    box: "border-[1.5px] border-accent bg-transparent",
    text: "text-accent",
  },
};

export default function Button({
  label,
  onPress,
  kind = "secondary",
  small = false,
  wide = false,
  // in a centred empty state, under its words
  center = false,
  // shares its row equally with the buttons beside it
  grow = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  kind?: keyof typeof KINDS;
  small?: boolean;
  wide?: boolean;
  center?: boolean;
  grow?: boolean;
  disabled?: boolean;
}) {
  const look = KINDS[kind];
  // a manga theme's own corners (lib/mangaThemes.ts)
  const corners = useCorners();
  return (
    <PressScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={{
        alignSelf: wide || grow ? "stretch" : center ? "center" : "flex-start",
        ...(grow ? { flex: 1 } : {}),
        opacity: disabled ? 0.45 : 1,
        ...corners.box,
      }}
      className={`items-center justify-center overflow-hidden ${platform.buttonRadius} ${look.box} ${small ? "min-h-[36px] px-3.5 py-2" : "min-h-[48px] px-5 py-3"}`}
    >
      <Text
        numberOfLines={1}
        className={`font-body-semibold ${small ? "text-[14px]" : "text-[16px]"} ${look.text}`}
      >
        {label}
      </Text>
    </PressScale>
  );
}
