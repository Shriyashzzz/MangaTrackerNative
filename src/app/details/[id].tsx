// A series' page, as the Android app's (web pages/Details): its cover and
// name, Buy next, and Your shelf, the strip of books to mark as theirs. The
// rules are the web's own hooks (core pages/Details): what's out, the edition
// they collect, how big the shelf is, and saving what they own. Reading,
// rating, notes and their books come in phase 4
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import BuyNext from "@/components/BuyNext";
import DoubleRule from "@/components/DoubleRule";
import SeriesCover from "@/components/SeriesCover";
import ShelfStrip from "@/components/ShelfStrip";
import Toast from "@/components/Toast";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { apiFetch } from "@/core/lib/api";
import type { Manga } from "@/core/lib/types";
import { useColors } from "@/lib/colors";
import { useSeriesShelf } from "@/lib/useSeriesShelf";

const Safe = withUniwind(SafeAreaView);

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const [manga, setManga] = useState<Manga | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const shelf = useSeriesShelf(manga, setManga);
  const { buyOptions, editions } = shelf;

  useEffect(() => {
    let live = true;
    apiFetch(`/api/manga/${id}`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "This series isn't on your shelf."
              : "It didn't load.",
          );
        const data = (await res.json()) as { manga: Manga };
        if (live) setManga(data.manga);
      })
      .catch((e: Error) => live && setFailed(e.message));
    return () => {
      live = false;
    };
  }, [id]);

  if (failed)
    return (
      <Safe className="flex-1 items-center justify-center bg-paper px-8">
        <Text className="font-body text-[16px] text-ink-soft">{failed}</Text>
      </Safe>
    );
  if (!manga) return <Safe className="flex-1 bg-paper" />;

  const statusWord = manga.status
    ? "Finished"
    : manga.planned
      ? "To read"
      : "Reading";

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      {/* the app bar: back, and the series' name */}
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase"
        >
          {manga.name}
        </Text>
      </View>
      <DoubleRule />
      <ScrollView contentContainerClassName="gap-6 px-4 pt-4 pb-16">
        {/* the cover and name, with how they're getting on */}
        <View className="flex-row gap-3.5">
          <SeriesCover
            name={manga.name}
            lightNovel={manga.lightNovel}
            url={manga.image}
            width={90}
            border={2}
          />
          <View className="min-w-0 flex-1 gap-2">
            <Text className="font-display text-[24px] leading-[28px] text-ink">
              {manga.name}
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {[
                statusWord,
                manga.lightNovel ? "Light novel" : null,
                manga.genre && manga.genre !== "unlabled" ? manga.genre : null,
                editions.line ? `as ${editions.line.label}` : null,
              ]
                .filter(Boolean)
                .map((chip) => (
                  <Text
                    key={chip}
                    className="rounded-[2px] border-[1.5px] border-line-soft px-2 py-0.5 font-body-medium text-[13px] text-ink-soft"
                  >
                    {chip}
                  </Text>
                ))}
            </View>
          </View>
        </View>

        {/* Buy next. Its room is kept while it loads, so the shelf under it
            doesn't jump when it arrives */}
        {buyOptions.loading ? <View className="h-[92px]" /> : null}
        <BuyNext
          options={buyOptions}
          edition={
            editions.line && editions.plan
              ? { line: editions.line, plan: editions.plan }
              : null
          }
          highest={shelf.highest}
          gaps={shelf.isEdition ? [] : shelf.gaps}
        />

        {/* Your shelf */}
        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
              Your shelf
            </Text>
            <Text className="font-body text-[14px] text-ink-soft">
              {shelf.count}
            </Text>
          </View>
          <ShelfStrip shelf={shelf} />
        </View>
      </ScrollView>
      {shelf.undo ? (
        <Toast
          text={shelf.undo.text}
          action="Undo"
          onAction={shelf.undo.run}
          onGone={shelf.undo.drop}
        />
      ) : null}
    </Safe>
  );
}
