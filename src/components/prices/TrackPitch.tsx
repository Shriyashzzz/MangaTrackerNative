// Where the shelf buttons go for someone not signed in (the web's
// ShelfAction pitch): what tracking gets them, said where they decide, and
// the two ways in. Only what the app does today: the New tab and its count
import { router } from "expo-router";
import { Text, View } from "react-native";
import { BellIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import Button from "../Button";

export default function TrackPitch() {
  const c = useColors();
  return (
    // the tint is see-through: a solid card under it keeps the page's
    // background drawing from showing through the words
    <View className="overflow-hidden rounded-[14px] bg-card">
      <View className="gap-2.5 rounded-[14px] border border-accent/40 bg-accent-wash p-3.5">
        <View className="flex-row items-center gap-2">
          <BellIcon color={c.accentInk} width={18} height={18} />
          <Text className="font-brand pr-1 text-[19px] tracking-[1px] text-ink uppercase">
            Never miss a volume
          </Text>
        </View>
        <Text className="font-body text-[14px] leading-[20px] text-ink-soft">
          Track this series and the New tab tells you the day a volume or
          chapter is out, with a count on the tab.
        </Text>
        <Button
          kind="primary"
          wide
          label="Track it, free"
          onPress={() => router.push("/sign-up")}
        />
        <Text className="text-center font-body text-[13.5px] text-ink-soft">
          Have a shelf already?{"  "}
          <Text
            onPress={() => router.push("/sign-in")}
            className="font-body-semibold text-accent-ink"
          >
            Sign in
          </Text>
        </Text>
      </View>
    </View>
  );
}
