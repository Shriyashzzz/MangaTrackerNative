// Where the shelf buttons go for someone not signed in (the web's
// ShelfAction pitch): the same button the page gives someone signed in, and
// one quiet line saying what tracking gets them. Only what the app does
// today: the New tab and the weekly email (phone alerts join them once
// push is set up)
import { router } from "expo-router";
import { Text, View } from "react-native";
import { BellIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import Button from "../Button";

export default function TrackPitch() {
  const c = useColors();
  return (
    <View className="gap-2">
      <Button
        kind="primary"
        wide
        label="Track this series, free"
        onPress={() => router.push("/sign-up")}
      />
      <View className="flex-row items-start gap-1.5">
        <View className="pt-[2px]">
          <BellIcon color={c.muted} width={15} height={15} />
        </View>
        <Text className="min-w-0 flex-1 font-body text-[13.5px] leading-[19px] text-ink-soft">
          The New tab and a weekly email tell you when its next volume is out.{" "}
          <Text
            onPress={() => router.push("/sign-in")}
            className="font-body-semibold text-ink"
          >
            Sign in
          </Text>{" "}
          if you have a shelf.
        </Text>
      </View>
    </View>
  );
}
