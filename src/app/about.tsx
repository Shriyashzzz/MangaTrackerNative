// About, as the web's pages/About/About.tsx: who made it and why, the
// problem in four panels, what it can do, and how to get in touch
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Linking, Text, View } from "react-native";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import Page, { H2, H3, P, TextLink } from "@/components/Page";
import { CONTACT_EMAIL } from "@/core/lib/contact";
import { getPricedCount } from "@/core/lib/prices";

const STRIP = [
  {
    mood: "confused",
    caption: "Ten series at once.",
    line: "Wait… which chapter was I on?",
  },
  {
    mood: "panic",
    caption: "Vol. 12 came out in May.",
    line: "How did I miss it??",
  },
  {
    mood: "confused",
    caption: "$14 for one volume.",
    line: "Is that… a good price?",
  },
  {
    mood: "happy",
    caption: "Now it's all in one place.",
    line: "Ch. 327. Vol. 12. Only $8!",
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
      <View className="items-center gap-3 rounded-[6px] border-2 border-line bg-card p-5">
        <Mascot mood="happy" width={120} />
        <Text className="text-center font-brand pr-1 text-[30px] leading-[34px] tracking-[1px] text-ink uppercase">
          <Text className="bg-accent text-on-accent"> Never lose </Text> your
          place again.
        </Text>
      </View>
      <P>
        Hello, I'm Shriyash. I am the solo developer behind Manga Tracker, I
        like to collect physical mangas. Keeping track of your bookmarks when
        you read multiple series concurrently can be difficult.
        {"\n"}It's also hard to keep track when new volumes come out for your
        favourite series. You can sign up for Shelf so you never have to
        manually look that up for every series you own.
      </P>
      <P>
        I'm also a broke college student, and this hobby can be expensive. You
        can use{" "}
        <TextLink onPress={() => router.push("/prices")}>Price check</TextLink>{" "}
        to find the cheapest deals across US and Canadian stores.
      </P>
      <P>
        One of my favourite series is Vagabond. It has very much changed my
        life.
      </P>
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
      <H2>What it can do</H2>
      <View className="gap-2 rounded-[4px] border-[1.5px] border-line-soft p-3">
        <H3>Your shelf</H3>
        <P muted>
          Save the last chapter you read, rate what you finish, track what you
          own.
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
          See what US and Canadian stores charge for any volume, and its price
          history.
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
      <H2>Feedback or questions?</H2>
      <P>
        Found a bug, want a feature or just want to say hi? Send me an email.
      </P>
      <Button
        label="Contact me"
        kind="primary"
        small
        onPress={() => void Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
      />
      <P muted>
        <TextLink href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</TextLink>
      </P>
      <TextLink onPress={() => router.push("/privacy")}>
        Privacy policy
      </TextLink>
    </Page>
  );
}
