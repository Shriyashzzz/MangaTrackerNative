// Where the shelf buttons go for someone not signed in (the web's
// ShelfAction pitch), told as a manga panel: Kenji asks, in a speech bubble
// and comic lettering, and the button under him answers. It promises a
// phone alert: push must be set up before this ships (the owner's call,
// 2026-11-21)
import { router } from "expo-router";
import { Text, View } from "react-native";
import { PRINTED } from "@/lib/printed";
import Button from "../Button";
import Mascot from "../Mascot";

export default function TrackPitch() {
  return (
    <View className="gap-2.5">
      <View className="flex-row items-center gap-3">
        {/* printed: ink on paper in either theme, as everywhere he appears */}
        <View
          className="h-[52px] w-[52px] items-center justify-end overflow-hidden rounded-full border-2 border-line"
          style={{ backgroundColor: PRINTED.paper }}
        >
          <Mascot mood="curious" width={42} />
        </View>
        <View className="min-w-0 flex-1">
          {/* the bubble's tail, a corner turned toward him */}
          <View
            className="absolute top-1/2 -left-[6px] h-3 w-3 border-b-[1.5px] border-l-[1.5px] border-line bg-card"
            style={{ transform: [{ translateY: -6 }, { rotate: "45deg" }] }}
          />
          <View className="rounded-[14px] border-[1.5px] border-line bg-card px-3 py-2">
            <Text className="font-letter text-[14.5px] leading-[19px] text-ink uppercase">
              Want a nudge when the next volume drops?
            </Text>
          </View>
        </View>
      </View>
      <Button
        kind="primary"
        wide
        label="Yes, track it, free"
        onPress={() => router.push("/sign-up")}
      />
      <Text className="font-body text-[13px] leading-[18px] text-ink-soft">
        A phone alert, your New tab and a weekly email.{"  "}
        <Text
          onPress={() => router.push("/sign-in")}
          className="font-body-semibold text-ink"
        >
          Sign in
        </Text>{" "}
        if you have a shelf.
      </Text>
    </View>
  );
}
