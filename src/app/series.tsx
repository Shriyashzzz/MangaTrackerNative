// Every series, as the web's pages/Prices/SeriesIndex.tsx: popular, top
// rated or A to Z, by genre, each a way to its prices
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Mascot from "@/components/Mascot";
import Page, { H2, P, TextLink } from "@/components/Page";
import PickSheet from "@/components/PickSheet";
import Segmented from "@/components/Segmented";
import SeriesCard from "@/components/prices/SeriesCard";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { pickGenre } from "@/core/lib/anilist";
import { getSeriesIndex } from "@/core/lib/prices";
import type { SeriesIndexEntry } from "@/core/lib/types";
import { useColors } from "@/lib/colors";

const PAGE = 40;
const letterOf = (name: string) => {
  const first =
    name
      .replace(/^the\s+/i, "")
      .trim()[0]
      ?.toUpperCase() ?? "#";
  return /[A-Z]/.test(first) ? first : "#";
};
const sortName = (name: string) => name.replace(/^the\s+/i, "").toLowerCase();
const SORTS = [
  { value: "popular", label: "Popular" },
  { value: "rated", label: "Top rated" },
  { value: "az", label: "A to Z" },
] as const;
type Sort = (typeof SORTS)[number]["value"];
const byPopularity = (a: SeriesIndexEntry, b: SeriesIndexEntry) =>
  (a.popularityRank ?? Infinity) - (b.popularityRank ?? Infinity) ||
  (b.score ?? 0) - (a.score ?? 0);
const scoreGroup = (s: SeriesIndexEntry) =>
  s.score == null ? 2 : s.fewRaters ? 1 : 0;
const byScore = (a: SeriesIndexEntry, b: SeriesIndexEntry) =>
  scoreGroup(a) - scoreGroup(b) ||
  (b.score ?? 0) - (a.score ?? 0) ||
  byPopularity(a, b);
const byName = (a: SeriesIndexEntry, b: SeriesIndexEntry) =>
  sortName(a.name).localeCompare(sortName(b.name));
const ORDER: Record<Sort, typeof byName> = {
  popular: byPopularity,
  rated: byScore,
  az: byName,
};

export default function SeriesIndexScreen() {
  const c = useColors();
  const [sort, setSort] = useState<Sort>("popular");
  const [genre, setGenre] = useState("");
  const [pickingGenre, setPickingGenre] = useState(false);
  const [shownCount, setShownCount] = useState(PAGE);
  const [state, setState] = useState<{
    series: SeriesIndexEntry[] | null;
    error: boolean;
  }>({ series: null, error: false });
  useEffect(() => {
    const controller = new AbortController();
    getSeriesIndex(controller.signal)
      .then((series) => setState({ series, error: false }))
      .catch((e) => {
        if (e.name !== "AbortError") setState({ series: [], error: true });
      });
    return () => controller.abort();
  }, []);
  const all = state.series;
  const genres = useMemo(
    () => [...new Set((all ?? []).flatMap((s) => s.genres))].sort(),
    [all],
  );
  const shown = useMemo(
    () =>
      (all ?? [])
        .filter((s) => !genre || s.genres.includes(genre))
        .sort(ORDER[sort]),
    [all, sort, genre],
  );
  const page = shown.slice(0, shownCount);
  const card = (s: SeriesIndexEntry) => (
    <SeriesCard
      key={s.name}
      series={{
        ...s,
        genre: pickGenre(s.genres),
        englishVolumes: s.knownVolumes,
      }}
      width={104}
    />
  );
  // A to Z: grouped under their letters
  const groups: [string, SeriesIndexEntry[]][] = [];
  if (sort === "az")
    for (const s of page) {
      const l = letterOf(s.name);
      const last = groups.at(-1);
      if (last?.[0] === l) last[1].push(s);
      else groups.push([l, [s]]);
    }
  return (
    <Page title="All series">
      <P muted>
        Every series we have volumes for{all?.length ? ` (${all.length})` : ""}.
        Pick one to compare its volumes across US stores.
      </P>
      <TextLink onPress={() => router.push("/editions")}>
        Omnibus and deluxe editions →
      </TextLink>
      <Segmented
        label="Sort"
        options={SORTS}
        value={sort}
        onChange={(v) => {
          setSort(v);
          setShownCount(PAGE);
        }}
      />
      {genres.length ? (
        <Pressable
          onPress={() => setPickingGenre(true)}
          className="min-h-[44px] flex-row items-center justify-between rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3"
          accessibilityLabel={`Genre: ${genre || "All genres"}. Change`}
        >
          <Text className="font-body text-[15px] text-ink">
            {genre || "All genres"}
          </Text>
          <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
        </Pressable>
      ) : null}
      {all === null ? null : shown.length === 0 ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <P>
            {state.error
              ? "The list didn't load."
              : "Nothing in that genre yet."}
          </P>
          <P muted>
            {state.error
              ? "Try again in a moment, or search for a series directly."
              : "Series show up here once someone looks them up."}
          </P>
        </View>
      ) : sort === "az" ? (
        groups.map(([letter, list]) => (
          <View key={letter} className="gap-2">
            <H2>{letter}</H2>
            <View
              className="flex-row flex-wrap justify-between"
              style={{ rowGap: 18 }}
            >
              {list.map(card)}
            </View>
          </View>
        ))
      ) : (
        <View
          className="flex-row flex-wrap justify-between"
          style={{ rowGap: 18 }}
        >
          {page.map(card)}
        </View>
      )}
      {shownCount < shown.length ? (
        <Pressable
          onPress={() => setShownCount(shownCount + PAGE)}
          className="self-center rounded-[3px] border-[1.5px] border-line px-4 py-2"
        >
          <Text className="font-body-semibold text-[14px] text-ink">
            Show {Math.min(PAGE, shown.length - shownCount)} more
          </Text>
        </Pressable>
      ) : null}
      <PickSheet
        open={pickingGenre}
        title="Genre"
        options={[
          { value: "", label: "All genres" },
          ...genres.map((g) => ({ value: g, label: g })),
        ]}
        picked={genre}
        onPick={(g) => {
          setGenre(g);
          setShownCount(PAGE);
        }}
        onClose={() => setPickingGenre(false)}
      />
    </Page>
  );
}
