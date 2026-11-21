// Five stars, as the web's components/starRating: shown, or picked when
// given `onChange` (a tap on a star rates the series that many)
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";
import { StarIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";

const SIZES = { sm: 14, md: 20, lg: 30 };

export default function StarRating({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (rating: number) => void;
  size?: keyof typeof SIZES;
}) {
  const c = useColors();
  const px = SIZES[size];
  const star = (n: number) => (
    <StarIcon
      filled={n <= value}
      color={n <= value ? c.star : c.starOff}
      width={px}
      height={px}
    />
  );
  if (!onChange)
    return (
      <View
        className="flex-row gap-[2px]"
        accessibilityLabel={value ? `Rated ${value} of 5` : "Not rated"}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <View key={n}>{star(n)}</View>
        ))}
      </View>
    );
  return (
    <View
      className="flex-row gap-2"
      accessibilityRole="radiogroup"
      accessibilityLabel="Rating"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable
          key={n}
          hitSlop={4}
          accessibilityRole="radio"
          accessibilityLabel={`${n} star${n === 1 ? "" : "s"}`}
          accessibilityState={{ checked: n === value }}
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onChange(n);
          }}
        >
          {star(n)}
        </Pressable>
      ))}
    </View>
  );
}
