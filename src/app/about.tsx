import { openOutside } from "@/lib/openOutside";
import { useCorners } from "@/lib/mangaThemes";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import Page, { H2, H3, P, Rule, TextLink } from "@/components/Page";
import { CONTACT_EMAIL } from "@/core/lib/contact";
import { getPricedCount } from "@/core/lib/prices";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

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

// the story behind the app, a chapter at a time
const STORY: { title: string; words: string; priceCheck?: boolean }[] = [
  {
    title: "Hey, I'm Shriyash",
    words:
      "I'm the solo developer behind Manga Tracker and, like you, I love collecting and reading manga.",
  },
  {
    title: "The problem",
    words:
      "Keeping up with a pile of series isn't easy. I kept forgetting which chapter I was on, missing new volumes, and spending more than I should on physical manga.",
  },
  {
    title: "So I built this",
    words:
      "Your collection, your place in each series, upcoming releases and price comparisons, all in one place.",
  },
  {
    title: "On a student budget",
    words:
      "I'm a college student, so a good deal matters. Price Check compares manga prices across US and Canadian stores before you buy.",
    priceCheck: true,
  },
];

export default function AboutScreen() {
  const corners = useCorners();
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
      <View
        className="items-center gap-3 rounded-[14px] border border-line-soft bg-card p-5"
        style={corners.panel}
      >
        <Mascot mood="happy" width={120} />

        <Text className="text-center font-brand pr-[7px] text-[30px] leading-[34px] tracking-[1px] text-ink uppercase">
          {"\u00A0"}
          <Text className="bg-accent text-on-accent"> Never lose </Text> your
          place again.
          {"\u00A0"}
        </Text>
      </View>

      {/* the story, told as the chapters of a short manga: one idea a box,
          each with its number, the way a volume's contents page reads */}
      <View className="gap-3">
        {STORY.map((part, i) => (
          // a solid card under the tinted ones, so the page's background
          // drawing never shows through the words
          <View
            key={part.title}
            className="overflow-hidden rounded-[14px] bg-card"
            style={corners.panel}
          >
            <View
              className={`gap-1.5 rounded-[14px] border p-4 ${i % 2 ? "border-accent/30 bg-accent-wash" : "border-line-soft"}`}
              style={corners.panel}
            >
              <Text className="font-mono-medium text-[11.5px] tracking-[1.5px] text-accent-ink uppercase">
                Ch. {String(i + 1).padStart(2, "0")}
              </Text>
              <Text className="font-brand pr-[5px] text-[21px] leading-[25px] tracking-[1px] text-ink uppercase">
                {part.title}
                {"\u00A0"}
              </Text>
              <Text className="font-body text-[15.5px] leading-[23px] text-ink">
                {part.words}
              </Text>
              {part.priceCheck ? (
                <Button
                  label="Try Price Check →"
                  small
                  onPress={() => router.push("/prices")}
                />
              ) : null}
            </View>
          </View>
        ))}
        {/* the author's note at the back of the volume */}
        <View
          className="flex-row items-center gap-3 rounded-[14px] border border-dashed border-line bg-paper-2 p-4"
          style={corners.panel}
        >
          <Mascot mood="reading" width={64} />
          <View className="min-w-0 flex-1 gap-1">
            <Text className="font-mono-medium text-[11.5px] tracking-[1.5px] text-ink-soft uppercase">
              Author's note
            </Text>
            <Text className="font-display-italic text-[16px] leading-[23px] text-ink">
              One of my all-time favourites is Vagabond. It genuinely changed
              the way I look at life.
            </Text>
          </View>
        </View>
      </View>

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
        onPress={() => openOutside(`mailto:${CONTACT_EMAIL}`)}
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
