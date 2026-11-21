// Five stars, as the web's components/starRating (shown, not picked, here)
import { View } from "react-native";
import { StarIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";

export default function StarRating({ value }: { value: number }) {
  const c = useColors();
  return (
    <View
      className="flex-row gap-[2px]"
      accessibilityLabel={`Rated ${value} of 5`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <StarIcon
          key={n}
          filled={n <= value}
          color={n <= value ? c.star : c.starOff}
          width={14}
          height={14}
        />
      ))}
    </View>
  );
}
