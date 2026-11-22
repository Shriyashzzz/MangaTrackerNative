// Where the shelf buttons go for someone not signed in (the web's
// ShelfAction): the one thing an account adds here, and the way to it
import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "../Button";

export default function TrackPitch() {
  return (
    <View className="gap-1.5">
      <Button
        kind="primary"
        label="Track this series, free"
        onPress={() => router.push("/sign-in")}
      />
      <Text className="font-body text-[13.5px] text-ink-soft">
        See when the next volume is out.
      </Text>
    </View>
  );
}
