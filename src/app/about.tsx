import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import Page, { H2, H3, P, Rule, TextLink } from "@/components/Page";
import { CONTACT_EMAIL } from "@/core/lib/contact";
import { getPricedCount } from "@/core/lib/prices";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";

const STRIP = [
  {
    mood: "confused",
    caption: "Ten series at once.",
    line: "Wait... where was I again?",
  },
  {
    mood: "panic",
    caption: "New volume released.",
    line: "How did I miss that?!",
  },
  {
    mood: "confused",
    caption: "$14 for one volume.",
    line: "Is this really the best deal?",
  },
  {
    mood: "happy",
    caption: "Everything in one place.",
    line: "Chapter 327. Volume 12. Just $8!",
  },
] as const;

export default function AboutScreen() {
  const [priced, setPriced] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    getPricedCount(controller.signal)
      .then(setPriced)
      .catch(() => {});

    return () => controller.abort();
  }, []);

  return (
    <Page title="About">
      {/* Hero */}
      <View className="items-center gap-3 rounded-[14px] border border-line-soft bg-card p-5">
        <Mascot mood="happy" width={120} />

        <Text className="text-center font-brand pr-1 text-[30px] leading-[34px] tracking-[1px] text-ink uppercase">
          <Text className="bg-accent text-on-accent"> Never lose </Text> your
          place again.
        </Text>
      </View>

      {/* The story behind Manga Tracker */}
      <P>
        Hey, I'm Shriyash! I'm the solo developer behind Manga Tracker and, like
        you, I love collecting and reading manga.
      </P>

      <P>
        But keeping up with multiple series isn't always easy. I found myself
        constantly forgetting which chapter I was on, missing new volume
        releases, and spending more than I probably should on physical manga.
      </P>

      <P>
        So I decided to build something to make all of that easier. Manga
        Tracker brings your collection, reading progress, upcoming releases, and
        price comparisons together in one place.
      </P>

      <P>
        I'm also a college student on a budget, so finding a good deal matters.
        That's why I built{" "}
        <TextLink onPress={() => router.push("/prices")}>Price Check</TextLink>,
        which helps you compare manga prices across US and Canadian stores
        before buying.
      </P>

      <P>
        And if you're wondering, one of my all-time favourite series is
        Vagabond. It's a series that genuinely changed the way I look at life.
      </P>

      {/* The problems */}
      <Rule />
      <H2>Sound familiar?</H2>

      <View className="flex-row flex-wrap gap-3">
        {STRIP.map((panel) => (
          <View
            key={panel.caption}
            className="w-[47%] items-center gap-2 rounded-[4px] border-[1.5px] border-line bg-card p-3"
          >
            <Mascot mood={panel.mood} width={72} />

            <Text className="text-center font-body-semibold text-[14px] text-ink">
              {panel.caption}
            </Text>

            <Text className="text-center font-display-italic text-[13px] text-ink-soft">
              {panel.line}
            </Text>
          </View>
        ))}
      </View>

      {/* Features */}
      <Rule />
      <H2>What it can do</H2>

      <View className="gap-2 rounded-[4px] border-[1.5px] border-line-soft p-3">
        <H3>Your shelf</H3>

        <P muted>
          Keep track of what you're reading, bookmark your latest chapter, rate
          completed series, and manage your physical collection.
        </P>

        <Button
          label="Open my shelf →"
          small
          onPress={() => router.push("/")}
        />
      </View>

      <View className="gap-2 rounded-[4px] border-[1.5px] border-line-soft p-3">
        <H3>Price check</H3>

        <P muted>
          Compare volume prices across US and Canadian retailers, find the best
          deals, and explore price history to make smarter purchases.
          {priced > 0
            ? ` ${priced.toLocaleString("en-US")} volumes priced in the last 30 days.`
            : ""}
        </P>

        <Button
          label="Check a price →"
          small
          onPress={() => router.push("/prices")}
        />
      </View>

      {/* Contact */}
      <Rule />
      <H2>Contact</H2>

      <P>
        Have a feature in mind? Found a bug? Have feedback, questions, or just
        want to talk manga? I'd love to hear from you.
      </P>

      <Button
        label="Get in touch →"
        kind="primary"
        small
        onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
      />

      {/* Additional links */}
      <View className="mt-3 gap-3 border-t border-line-soft pt-4">
        <View className="items-center">
          <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>
        </View>

        <View className="flex-row items-center justify-center gap-4">
          <TextLink onPress={() => router.push("/acknowledgements")}>
            Acknowledgements
          </TextLink>

          <View className="h-3 w-px bg-line-soft" />

          <TextLink onPress={() => router.push("/privacy")}>
            Privacy policy
          </TextLink>
        </View>
      </View>
    </Page>
  );
}
