// To buy's bag, with how many are on the list: in the top bar of the shelf
// tabs and of every price page, so the list is one tap away while browsing
// volumes to put on it. Nothing when signed out: the list is an account's
import { router } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";
import { BagIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { useAuth } from "@/store/auth";
import { loadToBuyOnce, useToBuy } from "@/store/toBuy";
import Tap from "./Tap";

export default function ToBuyBag() {
  const c = useColors();
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const count = useToBuy((s) => s.list?.items.length ?? 0);
  useEffect(() => {
    if (isSignedIn) loadToBuyOnce();
  }, [isSignedIn]);
  if (!isSignedIn) return null;
  return (
    <Tap
      feel="round"
      onPress={() => router.push("/to-buy")}
      hitSlop={8}
      accessibilityLabel={`To buy${count ? `, ${count} on the list` : ""}`}
      className="p-1"
    >
      <BagIcon color={c.inkSoft} width={24} height={24} />
      {count ? (
        <View className="absolute -top-1 -right-1 min-w-[18px] items-center rounded-full border border-paper bg-accent px-1">
          <Text className="font-mono-medium text-[10px] text-on-accent">
            {count}
          </Text>
        </View>
      ) : null}
    </Tap>
  );
}
