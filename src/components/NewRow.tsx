// One series on New, as the Android app's card in a row (web MangaCard with
// news): its cover, name, what's out in the accent ("Vol. 15 next"), how far
// behind under it, what they have, and Hide. The words are the web's own
// (core shelfViews newsFor)
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { newsFor, type ReleaseKind } from "@/core/pages/Home/shelfViews";
import type { Manga, ReleaseStatus } from "@/core/lib/types";
import SeriesCover from "./SeriesCover";

export default function NewRow({
  manga,
  found,
  kind,
  onHide,
}: {
  manga: Manga;
  found: ReleaseStatus | null | undefined;
  kind: ReleaseKind;
  onHide: () => void;
}) {
  const news = newsFor(manga, found, kind);
  return (
    <View className="flex-row items-center gap-3 py-2">
      <Link href={`/details/${manga.id}`} asChild>
        <Pressable className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70">
          <SeriesCover
            name={manga.name}
            lightNovel={manga.lightNovel}
            url={manga.image}
            width={52}
          />
          <View className="min-w-0 flex-1 gap-[2px]">
            <Text
              numberOfLines={1}
              className="font-display text-[17px] text-ink"
            >
              {manga.name}
            </Text>
            <Text
              className={`font-brand pr-1 text-[17px] tracking-[1px] uppercase ${news.behind ? "text-ink-soft" : "text-accent"}`}
            >
              {news.text}
            </Text>
            {news.behind ? (
              <Text className="font-brand pr-1 text-[14px] tracking-[1px] text-ink-soft uppercase">
                {news.behind}
              </Text>
            ) : null}
            {news.yours ? (
              <Text
                numberOfLines={1}
                className="font-body text-[13px] text-ink-soft"
              >
                {news.yours}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Link>
      <Pressable
        onPress={onHide}
        hitSlop={6}
        className="rounded-[3px] border-[1.5px] border-line px-3 py-1.5 active:bg-accent-wash"
        accessibilityLabel={`Hide ${manga.name}`}
      >
        <Text className="font-body-medium text-[14px] text-ink">Hide</Text>
      </Pressable>
    </View>
  );
}
