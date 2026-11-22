// One series on New, as the Android app's card in a row (web MangaCard with
// news): its cover, name, what's out in the accent ("Vol. 15 next"), how far
// behind under it, what they have, and Hide. The words are the web's own
// (core shelfViews newsFor)
import { Link, type Href } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { newsFor, type ReleaseKind } from "@/core/pages/Home/shelfViews";
import type { Manga, ReleaseStatus } from "@/core/lib/types";
import { look } from "@/lib/platformLook";
import SeriesCover from "./SeriesCover";

export default function NewRow({
  manga,
  found,
  kind,
  onHide,
  hideWord = "Hide",
  onOpenList,
  href,
}: {
  manga: Manga;
  found: ReleaseStatus | null | undefined;
  kind: ReleaseKind;
  onHide: () => void;
  // "Show" on the hidden list
  hideWord?: string;
  // several behind: a tap opens the list of them instead of the series
  onOpenList?: () => void;
  // where a tap leads when it isn't the series' page: the next volume's
  // prices (core newTabLinks buyLinkFor)
  href?: Href | null;
}) {
  const news = newsFor(manga, found, kind);
  const body = (
    <Pressable
      onPress={onOpenList}
      className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70"
    >
      <SeriesCover
        name={manga.name}
        lightNovel={manga.lightNovel}
        url={manga.image}
        width={52}
      />
      <View className="min-w-0 flex-1 gap-[2px]">
        <Text numberOfLines={1} className="font-display text-[17px] text-ink">
          {manga.name}
        </Text>
        <Text
          className={`font-brand pr-[4px] text-[17px] tracking-[1px] uppercase ${news.behind ? "text-ink-soft" : "text-accent"}`}
        >
          {news.text}
          {"\u00A0"}
        </Text>
        {news.behind ? (
          <Text className="font-brand pr-[4px] text-[14px] tracking-[1px] text-ink-soft uppercase">
            {news.behind}
            {"\u00A0"}
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
  );
  return (
    <View className="flex-row items-center gap-3 py-2">
      {onOpenList ? (
        body
      ) : (
        <Link href={href ?? `/details/${manga.id}`} asChild>
          {body}
        </Link>
      )}
      <Pressable
        onPress={onHide}
        hitSlop={6}
        className={`bg-ink/10 px-3.5 py-2 active:opacity-70 ${look.buttonRadius}`}
        accessibilityLabel={`${hideWord} ${manga.name}`}
      >
        <Text className="font-body-medium text-[14px] text-ink">
          {hideWord}
        </Text>
      </Pressable>
    </View>
  );
}
