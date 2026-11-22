// The shelf for someone not signed in (the web's pages/Home/GuestHero.tsx):
// what a shelf is for, and the two ways in. Prices stay open to them along
// the bottom
import { router } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import AuthArt from "./AuthArt";
import Button from "./Button";

export default function GuestShelf() {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="grow justify-center gap-6 px-6 py-8"
    >
      <AuthArt
        sfx="A new series begins!"
        chapter="1"
        line="Your shelf lives here once you sign up."
      />
      <Text className="text-center font-body text-[15.5px] leading-[23px] text-ink-soft">
        Keep your place in every series, track the volumes you own, and see when
        the next one's out and what it costs.
      </Text>
      <View className="gap-3">
        <Button
          kind="primary"
          label="Start your shelf"
          wide
          onPress={() => router.push("/sign-up")}
        />
        <Button
          kind="secondary"
          label="Check a price first"
          wide
          onPress={() => router.navigate("/prices")}
        />
      </View>
      <Text className="text-center font-body text-[14.5px] text-ink-soft">
        Already have a shelf?{"  "}
        <Text
          onPress={() => router.push("/sign-in")}
          className="font-body-semibold text-accent"
        >
          Sign in
        </Text>
      </Text>
      <View className="flex-row justify-center gap-6 border-t border-line-soft pt-4">
        {(
          [
            ["About", "/about"],
            ["Questions", "/faq"],
            ["Privacy", "/privacy"],
          ] as const
        ).map(([label, href]) => (
          <Pressable key={href} onPress={() => router.push(href)} hitSlop={8}>
            <Text className="font-body-medium text-[14px] text-ink-soft">
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}
