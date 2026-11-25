// Stats: the collection in numbers. What they own and what it's worth, what
// they've paid year by year (only what they entered under Your books), how
// complete it is and where the biggest gaps are, the genres, and the
// longest runs. Every figure is from lib/collectionStats.ts or the server's
// own shelf totals; a number the app can't know isn't shown as one
import { DENSE } from "@/lib/textScale";
import { useCorners } from "@/lib/mangaThemes";
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Mascot from "@/components/Mascot";
import Page, { H2, P, Rule } from "@/components/Page";
import { getJson } from "@/core/lib/api";
import type { OwnedBook } from "@/core/lib/books";
import { ownedCount } from "@/core/lib/ownedVolumes";
import { formatCents, wholeMoney } from "@/core/lib/prices";
import { useShelfTools } from "@/core/pages/Home/useShelfTools";
import {
  completion,
  longestRuns,
  seriesByGenre,
  spendByYear,
} from "@/lib/collectionStats";
import { useShelf } from "@/store/shelf";

const GENRES_SHOWN = 6;
const RUNS_SHOWN = 5;

// one figure with what it counts under it
function Figure({ value, label }: { value: string; label: string }) {
  const corners = useCorners();
  return (
    <View
      className="min-w-[46%] flex-1 gap-0.5 rounded-[14px] border border-line-soft bg-card px-4 py-3"
      style={corners.panel}
    >
      <Text
        maxFontSizeMultiplier={DENSE}
        className="font-brand pr-[7px] text-[28px] leading-[32px] text-ink"
      >
        {value}
        {" "}
      </Text>
      <Text
        maxFontSizeMultiplier={DENSE}
        className="font-body text-[13px] text-ink-soft"
      >
        {label}
      </Text>
    </View>
  );
}

// a named row with its bar: how big it is against the biggest in its list
function BarRow({
  name,
  value,
  of,
  onPress,
}: {
  name: string;
  value: string;
  of: number;
  onPress?: () => void;
}) {
  return (
    <Tap
      onPress={onPress}
      disabled={!onPress}
      className="gap-1 py-2 active:opacity-70"
    >
      <View className="flex-row items-baseline justify-between gap-3">
        <Text
          maxFontSizeMultiplier={DENSE}
          numberOfLines={1}
          className="min-w-0 flex-1 font-body-medium text-[15px] text-ink"
        >
          {name}
        </Text>
        <Text
          maxFontSizeMultiplier={DENSE}
          className="font-mono text-[13px] text-ink-soft"
        >
          {value}
        </Text>
      </View>
      <View className="h-[6px] overflow-hidden rounded-full bg-ink/10">
        <View
          className="h-full rounded-full bg-accent"
          style={{ width: `${Math.max(3, Math.min(100, of * 100))}%` }}
        />
      </View>
    </Tap>
  );
}

export default function StatsScreen() {
  const manga = useShelf((s) => s.manga);
  const load = useShelf((s) => s.load);
  const tools = useShelfTools();
  // every book they've listed, with what was paid; null until it answers,
  // an empty list if it can't be asked
  const [books, setBooks] = useState<OwnedBook[] | null>(null);
  const loadBooks = () =>
    getJson<{ books: OwnedBook[] }>("/api/manga/books")
      .then((answer) => setBooks(answer.books))
      .catch(() => setBooks([]));
  useEffect(() => {
    if (!manga) void load();
    void loadBooks();
  }, [manga, load]);

  const series = manga ?? [];
  const volumes = series.reduce((sum, m) => sum + ownedCount(m), 0);
  if (manga && !volumes && !series.length)
    return (
      <Page title="Stats" center>
        <View className="items-center gap-3">
          <Mascot mood="curious" width={100} />
          <Text className="text-center font-body text-[15px] text-ink-soft">
            Add a series and mark the volumes you own. Your numbers show up
            here.
          </Text>
        </View>
      </Page>
    );

  const done = completion(volumes, tools?.finish ?? []);
  const years = spendByYear(books ?? []);
  const paidBooks = years.reduce((sum, y) => sum + y.books, 0);
  const paidCents = years.reduce((sum, y) => sum + y.cents, 0);
  const mostInAYear = Math.max(1, ...years.map((y) => y.cents));
  const genres = seriesByGenre(series).slice(0, GENRES_SHOWN);
  const runs = longestRuns(series, RUNS_SHOWN);
  const worthCents = tools?.value.estimateCents ?? tools?.value.cents ?? null;
  const open = (id: number) =>
    router.push({ pathname: "/details/[id]", params: { id: String(id) } });

  return (
    <Page
      title="Stats"
      onRefresh={async () => {
        await Promise.all([load(), loadBooks()]);
      }}
    >
      <View className="flex-row flex-wrap gap-3">
        <Figure value={String(series.length)} label="series on your shelf" />
        <Figure value={volumes.toLocaleString()} label="volumes you own" />
        <Figure
          value={
            worthCents ? `about ${wholeMoney(worthCents)}` : "no total yet"
          }
          label="what the shelf is worth today"
        />
        <Figure
          value={done.percent == null ? "–" : `${done.percent}%`}
          label="of the volumes out for what you collect"
        />
      </View>

      <Rule />
      <View className="gap-2">
        <H2>What you've paid</H2>
        {years.length ? (
          <>
            <P muted>
              {formatCents(paidCents)} across {paidBooks}{" "}
              {paidBooks === 1 ? "book" : "books"} you gave a price. Books with
              no price aren't counted.
            </P>
            <View>
              {years.map((y) => (
                <BarRow
                  key={y.year ?? "none"}
                  name={y.year ?? "No date"}
                  value={`${formatCents(y.cents)} · ${y.books} ${y.books === 1 ? "book" : "books"}`}
                  of={y.cents / mostInAYear}
                />
              ))}
            </View>
          </>
        ) : (
          <P muted>
            {books === null
              ? "Adding it up…"
              : "Nothing yet. Open a series, go to Your books, and add what you paid for a volume. It adds up here by year."}
          </P>
        )}
      </View>

      <Rule />
      <View className="gap-2">
        <H2>Left to collect</H2>
        {done.mostToGet.length ? (
          <>
            <P muted>
              {done.missing.toLocaleString()}{" "}
              {done.missing === 1 ? "volume" : "volumes"} out that you don't
              have yet. The longest lists:
            </P>
            <View>
              {done.mostToGet.map((row) => (
                <BarRow
                  key={row.mangaId}
                  name={row.name}
                  value={`${row.missing.length} to get`}
                  of={row.missing.length / done.mostToGet[0]!.missing.length}
                  onPress={() => open(row.mangaId)}
                />
              ))}
            </View>
          </>
        ) : (
          <P muted>
            {tools
              ? "Nothing left to get for the series you collect."
              : "Counting…"}
          </P>
        )}
      </View>

      {runs.length ? (
        <>
          <Rule />
          <View className="gap-2">
            <H2>Longest runs</H2>
            <View>
              {runs.map((row) => (
                <BarRow
                  key={row.id}
                  name={row.name}
                  value={`${row.volumes} ${row.volumes === 1 ? "vol" : "vols"}`}
                  of={row.volumes / runs[0]!.volumes}
                  onPress={() => open(row.id)}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}

      {genres.length ? (
        <>
          <Rule />
          <View className="gap-2">
            <H2>By genre</H2>
            <View>
              {genres.map((row) => (
                <BarRow
                  key={row.genre}
                  name={row.genre}
                  value={`${row.series} series`}
                  of={row.series / genres[0]!.series}
                />
              ))}
            </View>
          </View>
        </>
      ) : null}
    </Page>
  );
}
