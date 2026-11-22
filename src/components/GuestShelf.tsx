// The shelf for someone not signed in (the web's pages/Home/GuestHero.tsx):
// what a shelf is for, and the two ways in. Prices stay open to them along
// the bottom
import { router } from "expo-router";
import type { ReactNode } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import AuthArt from "./AuthArt";
import Button from "./Button";

// one panel: the drawing over a caption, its shout inked across a corner
function Panel({
  shout,
  caption,
  children,
}: {
  shout: string;
  caption: string;
  children: ReactNode;
}) {
  return (
    <View className="min-w-[46%] flex-1 overflow-hidden rounded-[4px] border-[1.5px] border-line bg-card">
      <View className="h-[72px] items-center justify-end bg-paper-2 px-2.5 pb-2">
        {children}
      </View>
      <Text
        className="absolute top-1 right-1 bg-accent px-1.5 font-brand pr-2 text-[12px] tracking-[0.5px] text-on-accent uppercase"
        style={{ transform: [{ rotate: "4deg" }] }}
      >
        {shout}
      </Text>
      <Text className="border-t-[1.5px] border-line px-2 py-1.5 text-center font-body-medium text-[13px] text-ink">
        {caption}
      </Text>
    </View>
  );
}

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
      {/* what a shelf does, as four panels of a manga page (the web's
          GuestHero): a drawing, a shout, and a caption each */}
      <View
        className="flex-row flex-wrap gap-2"
        accessibilityLabel="Keep your place in every series, track the volumes you own, and see when the next one is out and what it costs."
      >
        <Panel shout="Bookmarked!" caption="Keep your place">
          <View className="flex-row items-baseline gap-1">
            <Text className="font-brand pr-1 text-[15px] text-ink">ch.</Text>
            <Text className="font-brand pr-1 text-[28px] leading-[34px] text-ink">
              374
            </Text>
          </View>
        </Panel>
        <Panel shout="Mine!" caption="Track what you own">
          <View className="flex-row items-end gap-[3px]">
            {[true, true, true, false, true, false].map((owned, i) => (
              <View
                key={i}
                className={`w-[11px] ${owned ? "h-[30px] bg-ink" : "h-[24px] border-[1.5px] border-dashed border-muted"}`}
              />
            ))}
          </View>
        </Panel>
        <Panel shout="It's out!" caption="See what's out">
          <Text className="font-brand pr-1 text-[24px] leading-[30px] text-ink">
            Vol. 114
          </Text>
        </Panel>
        <Panel shout="Deal!" caption="And what it costs">
          <Text className="font-mono-medium text-[20px] text-ink">
            $9.58{" "}
            <Text className="font-mono text-[12.5px] text-muted line-through">
              $10.79
            </Text>
          </Text>
        </Panel>
      </View>
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
