// How New works, as the web's pages/NewReleases/NewReleases.tsx: what New
// shows, the questions people ask of it, the piles, and the settings that
// change what it lists (ReleaseControls)
import { router } from "expo-router";
import { Text, View } from "react-native";
import Mascot from "@/components/Mascot";
import DashedLine from "@/components/DashedLine";
import Page, { Bullet, H2, H3, P, Rule, TextLink } from "@/components/Page";
import ReleaseControls from "@/components/settings/ReleaseControls";
import { PILES_FROM } from "@/core/pages/Home/piles";
import { usePrefs } from "@/store/prefs";

// a New card, sketched: its cover number, the news, how far behind, yours
function CardSketch({
  cover,
  news,
  behind,
  yours,
  opens,
}: {
  cover: string;
  news: string;
  behind?: string;
  yours: string;
  opens?: string;
}) {
  return (
    <View className="mt-2 gap-1">
      <View className="flex-row gap-3 rounded-[4px] border-[1.5px] border-line bg-card p-2.5">
        <View className="h-[54px] w-[36px] items-center justify-center border-[1.5px] border-line bg-paper-2">
          <Text className="font-brand pr-[4px] text-[16px] text-ink">
            {cover}
            {"\u00A0"}
          </Text>
        </View>
        <View className="min-w-0 flex-1 justify-center">
          <Text className="font-brand pr-[4px] text-[15px] tracking-[1px] text-accent uppercase">
            {news}
            {"\u00A0"}
          </Text>
          {behind ? (
            <Text className="font-brand pr-[4px] text-[13px] tracking-[1px] text-ink-soft uppercase">
              {behind}
              {"\u00A0"}
            </Text>
          ) : null}
          <Text className="font-body text-[13px] text-ink-soft">{yours}</Text>
        </View>
      </View>
      {opens ? (
        <Text className="font-body text-[13px] text-muted">{opens}</Text>
      ) : null}
    </View>
  );
}

const QUESTIONS: { ask: string; answer: React.ReactNode }[] = [
  {
    ask: "Don't see a series?",
    answer: (
      <P muted>
        Add it to your shelf first. Then mark the volumes you own, or the
        chapter you've read up to.
      </P>
    ),
  },
  {
    ask: "All caught up?",
    answer: (
      <P muted>
        When the newest volume comes out, New says{" "}
        <Text className="font-body-semibold text-ink">“Vol. 15 next”</Text>.
      </P>
    ),
  },
  {
    ask: "Behind?",
    answer: (
      <View>
        <P muted>
          Say you own vol. 12, and 13 and 14 are out. New says{" "}
          <Text className="font-body-semibold text-ink">“Vol. 13 next”</Text>,
          with{" "}
          <Text className="font-body-semibold text-ink">
            “2 volumes behind”
          </Text>{" "}
          under it.
        </P>
        <CardSketch
          cover="13"
          news="Vol. 13 next"
          behind="2 volumes behind"
          yours="You own up to vol. 12"
        />
      </View>
    ),
  },
  {
    ask: "Reading by the chapter?",
    answer: (
      <View>
        <P muted>
          By default, the{" "}
          <Text className="font-body-semibold text-ink">Chapters</Text> list
          shows your next chapter once you're within 3 of the newest. You can
          change it below. The card also says which volume your chapter is in.
          Tap it to see which English volume has your next chapter.
        </P>
        <CardSketch
          cover="15"
          news="Ch. 101 next"
          behind="2 chapters behind"
          yours="Read up to ch. 100 · vol. 14"
          opens="Tap it and New shows: Vol. 15 has ch. 101–115, with its prices."
        />
      </View>
    ),
  },
  {
    ask: "Caught up with English?",
    answer: (
      <View>
        <P muted>
          New has an{" "}
          <Text className="font-body-semibold text-ink">In Japan</Text> list
          too: volumes out in Japan that may not be in English yet. It works
          like the English lists, but we can't link to Japanese manga or book
          stores yet.
        </P>
        <CardSketch
          cover="30"
          news="Vol. 30 in Japan"
          yours="You own up to vol. 29"
        />
      </View>
    ),
  },
  {
    ask: "Not out yet?",
    answer: (
      <P muted>
        The red{" "}
        <Text className="font-body-semibold text-ink">Upcoming Releases</Text>{" "}
        bar at the top of New lists volumes that aren't out yet, with the day
        each one comes out.
      </P>
    ),
  },
  {
    ask: "Already seen it?",
    answer: (
      <P muted>
        Tap <Text className="font-body-semibold text-ink">Hide</Text>. It leaves
        the list until something newer is out. Find it again under{" "}
        <Text className="font-body-semibold text-ink">Hidden</Text>, at the top
        of New.
      </P>
    ),
  },
];

export default function NewReleasesScreen() {
  const checksOn = usePrefs((s) => s.prefs.releaseChecks !== "off");
  return (
    <Page title="How New works" ruled>
      <View className="flex-row items-center gap-4">
        <View className="min-w-0 flex-1">
          <Text className="font-display text-[22px] leading-[26px] text-ink">
            New shows the next volume of each series you collect.
          </Text>
        </View>
        <Mascot mood="happy" width={80} />
      </View>
      <View className="flex-row gap-2">
        {[
          ["You own vol. 14.", "14"],
          ["Vol. 15 comes out.", "15"],
          ["New tells you.", "1"],
        ].map(([caption, mark], i) => (
          <View
            key={caption}
            className="flex-1 items-center gap-2 rounded-[4px] border-[1.5px] border-line bg-card p-2"
          >
            <View
              className={`h-10 w-7 items-center justify-center border-[1.5px] border-line ${i === 2 ? "rounded-full bg-accent" : "bg-paper-2"}`}
            >
              <Text
                className={`font-brand pr-[4px] text-[14px] ${i === 2 ? "text-on-accent" : "text-ink"}`}
              >
                {mark}
                {"\u00A0"}
              </Text>
            </View>
            <Text className="text-center font-body text-[12.5px] text-ink">
              {caption}
            </Text>
          </View>
        ))}
      </View>
      {/* ruled off between its parts, as the Android app's pages are: a line
          between sections, a quieter dashed one between the questions */}
      <Rule />
      <View className="gap-4">
        {QUESTIONS.map((one, i) => (
          <View key={one.ask} className="gap-4">
            {i > 0 ? <DashedLine /> : null}
            <View className="gap-1">
              <H3>{one.ask}</H3>
              {one.answer}
            </View>
          </View>
        ))}
      </View>
      <Rule />
      <View className="gap-2">
        <H2>A lot of news? It's sorted into piles</H2>
        <P muted>
          With {PILES_FROM} or more series on New, or any far behind, they're
          grouped by how far behind you are. "See all" opens a pile.
        </P>
      </View>
      <Rule />
      <View className="gap-3">
        <H2>Don't like how it works?</H2>
        <P>By default, New shows:</P>
        <Bullet>
          Volumes: the next volume of every series, however far behind you are.
        </Bullet>
        <Bullet>
          Chapters: your next chapter, once you're within 3 of the newest.
        </Bullet>
        {checksOn ? (
          <ReleaseControls />
        ) : (
          <P muted>
            Release checks are off in Settings. Switch them on to change what
            New lists.
          </P>
        )}
        <TextLink
          onPress={() =>
            router.push({
              pathname: "/settings",
              params: { tab: "new-releases" },
            })
          }
        >
          Settings, New releases
        </TextLink>
      </View>
    </Page>
  );
}
