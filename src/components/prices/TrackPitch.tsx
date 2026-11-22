// Where the shelf buttons go for someone not signed in (the web's
// ShelfAction pitch): a ticket like Buy next's, with a tear-off stub to tap.
// It promises a phone alert: push must be set up before this ships (the
// owner's call, 2026-11-21)
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useRipple } from "@/lib/press";

export default function TrackPitch() {
  const ripple = useRipple();
  return (
    <View className="gap-2">
      {/* a solid card under the tinted stub, so the page's background
          drawing never shows through */}
      <Pressable
        onPress={() => router.push("/sign-up")}
        android_ripple={ripple}
        accessibilityRole="button"
        accessibilityLabel="Want a nudge when the next volume drops? Track this series, free"
        className="flex-row overflow-hidden rounded-[12px] border-[1.5px] border-accent bg-card active:opacity-90"
      >
        <View className="min-w-0 flex-1 gap-1 px-3 py-2.5">
          <Text className="font-mono-medium text-[11.5px] tracking-[1.5px] text-accent-ink uppercase">
            Next volume
          </Text>
          <Text className="font-body-semibold text-[15.5px] leading-[21px] text-ink">
            Want a nudge when the next volume drops?
          </Text>
          <Text className="font-body text-[13px] text-ink-soft">
            Phone alert, New tab, weekly email
          </Text>
        </View>
        <View className="w-[84px] items-center justify-center border-l-[1.5px] border-dashed border-accent bg-accent-wash">
          <Text className="font-brand pr-1 text-[20px] tracking-[1px] text-accent-ink uppercase">
            Track
          </Text>
          <Text className="font-mono-medium text-[10.5px] tracking-[1px] text-accent-ink uppercase">
            free
          </Text>
        </View>
      </Pressable>
      <Text className="font-body text-[13px] text-ink-soft">
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
