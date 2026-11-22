// Your year in manga, as the web's pages/Year/Year.tsx: cards swiped
// sideways, each on its own pastel ink with Kenji's line: volumes added,
// chapters read with the series read most, series finished, what was
// spent, the highlights, and the shelf as it stands. The numbers and words
// are the web's (core lib/year). The web also draws the year as a magazine
// cover to share; the app shares the words for now
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  ScrollView,
  Share,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import Page, { P } from "@/components/Page";
import SeriesCover from "@/components/SeriesCover";
import { getJson } from "@/core/lib/api";
import { formatCents } from "@/core/lib/prices";
import {
  counted,
  dayText,
  emptyYear,
  kenjiSays,
  many,
  monthName,
  shelfLength,
  sinceText,
  yearSeason,
  type YearInManga,
} from "@/core/lib/year";

const INKS = ["#f8d46b", "#bfe6c8", "#cdd6fb", "#f2c9bf"];
const INK_ON = "#1d1a16";

function Card({
  ink,
  width,
  children,
}: {
  ink: number;
  width: number;
  children: ReactNode;
}) {
  return (
    <View
      style={{
        width,
        backgroundColor: INKS[ink % INKS.length],
        transform: [{ rotate: ink % 2 ? "0.6deg" : "-0.6deg" }],
      }}
      className="min-h-[300px] justify-between gap-3 rounded-[8px] border-2 border-line p-4"
    >
      {children}
    </View>
  );
}
const Kenji = ({ says }: { says: string }) => (
  <View className="flex-row items-center gap-3">
    <Mascot mood="happy" width={64} />
    <Text
      style={{ color: INK_ON }}
      className="shrink font-display-italic text-[15px]"
    >
      “{says}”
    </Text>
  </View>
);
const Big = ({ children }: { children: ReactNode }) => (
  <Text
    style={{ color: INK_ON }}
    className="font-brand pr-[11px] text-[44px] leading-[46px]"
  >
    {children}
    {"\u00A0"}
  </Text>
);
const Line = ({
  children,
  strong = false,
}: {
  children: ReactNode;
  strong?: boolean;
}) => (
  <Text
    style={{ color: INK_ON }}
    className={`${strong ? "font-body-semibold" : "font-body"} text-[15px] leading-[21px]`}
  >
    {children}
  </Text>
);
const Covers = ({
  series,
}: {
  series: { name: string; image: string | null }[];
}) => (
  <View className="flex-row gap-2">
    {series.slice(0, 3).map((s, i) => (
      <View
        key={`${s.name}-${i}`}
        style={{ transform: [{ rotate: `${[-4, 2, -1][i]}deg` }] }}
      >
        <SeriesCover name={s.name} url={s.image} width={56} />
      </View>
    ))}
  </View>
);

export default function YearScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = width - 56;
  const season = yearSeason();
  const [year, setYear] = useState<YearInManga | null>(null);
  const [failed, setFailed] = useState("");
  const [showing, setShowing] = useState(0);
  useEffect(() => {
    if (season === null) return;
    getJson<YearInManga>(`/api/history/year?year=${season}`)
      .then(setYear)
      .catch(() => setFailed("Your year didn't load. Try again."));
  }, [season]);

  if (season === null)
    return (
      <Page title="Your year">
        <P>Your year in manga comes back on Nov 25.</P>
        <Button
          label="Back to your shelf"
          small
          onPress={() => router.back()}
        />
      </Page>
    );
  if (failed)
    return (
      <Page title="Your year">
        <P>{failed}</P>
      </Page>
    );
  if (!year) return <Page title="Your year">{null}</Page>;

  const since = sinceText(year);
  const read = year.chaptersRead > 0 || year.volumesRead > 0;
  const spent = year.booksBought > 0 && year.spentCents > 0;
  const length = shelfLength(year.shelf.volumes);
  const highlights = [
    year.biggestDay && {
      label: "Biggest day",
      text: `${dayText(year.biggestDay.day)}: ${many(year.biggestDay.chapters, "chapter")}, mostly ${year.biggestDay.series}`,
    },
    year.longestStreak > 1 && {
      label: "Longest streak",
      text: `${year.longestStreak} days in a row`,
    },
    year.firstVolume && {
      label: "First volume of the year",
      text: `${year.firstVolume.series} vol. ${year.firstVolume.volume}, ${dayText(year.firstVolume.day)}`,
    },
    year.lastFinished && {
      label: "Last one you finished",
      text: `${year.lastFinished.series}, ${dayText(year.lastFinished.day)}`,
    },
  ].filter((h): h is { label: string; text: string } => Boolean(h));
  const empty = emptyYear(year);
  const cards: ReactNode[] = [];
  if (empty)
    cards.push(
      <>
        <Kenji says="Next year's the one." />
        <View className="gap-1">
          <Line strong>
            Nothing counted yet this year. Your year fills in as you:
          </Line>
          <Line>• Tick the volumes you buy.</Line>
          <Line>• Move your place as you read.</Line>
          <Line>• Mark a series finished.</Line>
        </View>
        <Button label="To your shelf" small onPress={() => router.back()} />
      </>,
    );
  else {
    cards.push(
      <>
        <Mascot mood="happy" width={90} />
        <View>
          <Big>{year.title.name}</Big>
          <Line>{year.title.line}</Line>
        </View>
      </>,
    );
    if (year.volumesAdded > 0)
      cards.push(
        <>
          <Kenji says={kenjiSays.volumes(year.volumesAdded)} />
          <View>
            <Big>{counted(year.volumesAdded)}</Big>
            <Line>
              {year.volumesAdded === 1 ? "volume" : "volumes"} added to your
              shelf
            </Line>
            {year.seriesAdded > 0 ? (
              <Line>
                Including {many(year.seriesAdded, "new series", "new series")}.
              </Line>
            ) : null}
          </View>
        </>,
      );
    if (read)
      cards.push(
        <>
          {year.topSeries.length > 0 ? (
            <Covers series={year.topSeries} />
          ) : (
            <Kenji says={kenjiSays.chapters(year.chaptersRead)} />
          )}
          <View>
            <Big>{counted(year.chaptersRead || year.volumesRead)}</Big>
            <Line>
              {year.chaptersRead
                ? `${year.chaptersRead === 1 ? "chapter" : "chapters"} read`
                : `${year.volumesRead === 1 ? "volume" : "volumes"} read`}
            </Line>
            {year.chaptersRead > 0 && year.volumesRead > 0 ? (
              <Line>And {many(year.volumesRead, "volume")} read.</Line>
            ) : null}
            {year.topSeries.length > 0 ? (
              <Line>
                Read most:{" "}
                <Line strong>
                  {year.topSeries.map((t) => t.name).join(", ")}
                </Line>
              </Line>
            ) : null}
          </View>
        </>,
      );
    if (year.seriesFinished > 0)
      cards.push(
        <>
          <Kenji says={kenjiSays.finished(year.seriesFinished)} />
          <View>
            <Big>{counted(year.seriesFinished)}</Big>
            <Line>
              {year.seriesFinished === 1
                ? "series finished"
                : "series finished"}
            </Line>
          </View>
        </>,
      );
    if (spent)
      cards.push(
        <>
          <Kenji says={kenjiSays.spent()} />
          <View>
            <Big>{formatCents(year.spentCents)}</Big>
            <Line>spent on {many(year.booksBought, "book")}</Line>
          </View>
        </>,
      );
    if (highlights.length > 0)
      cards.push(
        <View className="gap-3">
          {highlights.map((h) => (
            <View key={h.label}>
              <Text
                style={{ color: INK_ON }}
                className="font-mono text-[11.5px] tracking-[1px] uppercase"
              >
                {h.label}
              </Text>
              <Line strong>{h.text}</Line>
            </View>
          ))}
          {year.busiestMonth ? (
            <View>
              <Text
                style={{ color: INK_ON }}
                className="font-mono text-[11.5px] tracking-[1px] uppercase"
              >
                Busiest month
              </Text>
              <Line strong>{monthName(year.busiestMonth)}</Line>
              <Line>{kenjiSays.month()}</Line>
            </View>
          ) : null}
        </View>,
      );
  }
  cards.push(
    <>
      {year.shelf.fiveStars.length > 0 ? (
        <Covers series={year.shelf.fiveStars} />
      ) : (
        <Kenji says={kenjiSays.shelf()} />
      )}
      <View>
        <Line strong>
          {many(year.shelf.series, "series", "series")} ·{" "}
          {many(year.shelf.volumes, "volume")}
        </Line>
        {length ? (
          <Line>
            About {length.metres} m of spines: {length.picture}.
          </Line>
        ) : null}
        {year.shelf.topGenre ? (
          <Line>Mostly {year.shelf.topGenre}.</Line>
        ) : null}
        {year.shelf.fiveStars.length > 0 ? (
          <Line>
            Five stars:{" "}
            <Line strong>
              {year.shelf.fiveStars.map((s) => s.name).join(", ")}
            </Line>
          </Line>
        ) : null}
      </View>
    </>,
  );
  if (!empty)
    cards.push(
      <>
        <Kenji says="Tell them." />
        <View className="gap-2">
          <Line strong>Share your year.</Line>
          <Button
            label="Share my year"
            kind="primary"
            small
            onPress={() =>
              void Share.share({
                message: [
                  `My ${year.year} in manga: ${year.title.name}.`,
                  year.volumesAdded
                    ? `${many(year.volumesAdded, "volume")} added.`
                    : "",
                  year.chaptersRead
                    ? `${many(year.chaptersRead, "chapter")} read.`
                    : "",
                  year.seriesFinished
                    ? `${many(year.seriesFinished, "series", "series")} finished.`
                    : "",
                  `${many(year.shelf.series, "series", "series")}, ${many(year.shelf.volumes, "volume")} on the shelf.`,
                  "mangatracker.xyz",
                ]
                  .filter(Boolean)
                  .join(" "),
              }).catch(() => {})
            }
          />
        </View>
      </>,
    );

  return (
    <Page title={`Your ${year.year}`}>
      {since ? <P muted>{since}, when your history began.</P> : null}
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={cardWidth + 12}
        decelerationRate="fast"
        contentContainerStyle={{ gap: 12, paddingRight: 24 }}
        onScroll={(e) =>
          setShowing(
            Math.round(e.nativeEvent.contentOffset.x / (cardWidth + 12)),
          )
        }
        scrollEventThrottle={64}
        style={{ marginHorizontal: -4 }}
      >
        {cards.map((card, i) => (
          <Card key={i} ink={i} width={cardWidth}>
            {card}
          </Card>
        ))}
      </ScrollView>
      {cards.length > 1 ? (
        <View className="flex-row justify-center gap-1.5">
          {cards.map((_, i) => (
            <Tap
              feel="none"
              key={i}
              className={`h-2 w-2 rounded-full ${i === showing ? "bg-ink" : "bg-line-soft"}`}
            />
          ))}
        </View>
      ) : null}
    </Page>
  );
}
