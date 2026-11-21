// After the anime, as the web's pages/AfterAnime/AfterAnimeIndex.tsx: search
// an anime or manga, or pick a show from the list, to find the chapter and
// volume to read next
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import Mascot from "@/components/Mascot";
import Page, { P } from "@/components/Page";
import SeriesCard from "@/components/prices/SeriesCard";
import SeriesCover from "@/components/SeriesCover";
import { openShow } from "@/components/afterAnime/MoreShows";
import { SearchIcon } from "@/core/components/icons/Icons";
import { getAfterAnimeIndex, type AfterAnimeShow } from "@/core/lib/afterAnime";
import { DID_YOU_MEAN } from "@/core/lib/nearMatches";
import { findSeries, novelParts } from "@/core/lib/prices";
import type { SeriesHit } from "@/core/lib/types";
import { useColors } from "@/lib/colors";

const DEBOUNCE_MS = 300;
const SUGGESTED = 6;
const CARDS_A_PAGE = 12;
const COLUMNS = 3;

export default function AfterAnimeIndex() {
  const c = useColors();
  const [shows, setShows] = useState<AfterAnimeShow[] | null>(null);
  const [shownCount, setShownCount] = useState(CARDS_A_PAGE);
  useEffect(() => {
    const controller = new AbortController();
    getAfterAnimeIndex(controller.signal)
      .then(setShows)
      .catch((e: Error) => {
        if (e.name !== "AbortError") setShows([]);
      });
    return () => controller.abort();
  }, []);

  // the search box's suggestions (the web's SeriesSearchBox)
  const [text, setText] = useState("");
  const [found, setFound] = useState<{
    q: string;
    items: SeriesHit[];
    guessed?: boolean;
  }>({ q: "", items: [] });
  const q = text.trim();
  useEffect(() => {
    if (q.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      findSeries(q, controller.signal)
        .then(({ hits, guessed }) => setFound({ q, items: hits, guessed }))
        .catch((e) => {
          if (e.name !== "AbortError") setFound({ q, items: [] });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q]);
  const suggested = found.q === q ? found.items.slice(0, SUGGESTED) : [];
  const go = (name: string) => {
    setText("");
    openShow(name);
  };

  return (
    <Page title="After the anime">
      <View className="gap-2">
        <Text className="font-brand pr-1 text-[30px] leading-[36px] tracking-[1px] text-ink uppercase">
          Where does the <Text className="text-accent">anime</Text> leave off?
        </Text>
        <P muted>
          Finished a season? Find the chapter and volume to read next.
        </P>
      </View>

      <View className="gap-1">
        <View className="flex-row items-center gap-2 rounded-[4px] border-2 border-line bg-card px-3">
          <SearchIcon color={c.inkSoft} width={18} height={18} />
          <TextInput
            value={text}
            onChangeText={setText}
            onSubmitEditing={() => q && go(q)}
            placeholder="Search an anime or manga"
            placeholderTextColor={c.muted}
            autoCorrect={false}
            returnKeyType="search"
            className="min-h-[46px] flex-1 font-body text-[16px] text-ink"
          />
        </View>
        {suggested.map((s) => (
          <Pressable
            key={s.slug}
            onPress={() => go(s.name)}
            className="flex-row items-center gap-3 border-b border-dotted border-line-soft py-2 active:opacity-70"
          >
            <SeriesCover
              name={s.name}
              lightNovel={s.lightNovel}
              url={s.thumbUrl ?? s.coverUrl}
              width={36}
            />
            <Text
              numberOfLines={1}
              className="flex-1 font-body-semibold text-[15.5px] text-ink"
            >
              {novelParts(s.name).title}
            </Text>
          </Pressable>
        ))}
        {q.length >= 2 && found.q === q && found.guessed && suggested.length ? (
          <Text className="pt-1 font-body text-[13px] text-muted">
            {DID_YOU_MEAN}
          </Text>
        ) : null}
      </View>

      {shows === null ? (
        <View className="flex-row flex-wrap gap-3" accessibilityLabel="Loading">
          {Array.from({ length: 6 }, (_, i) => (
            <View
              key={i}
              className="basis-[30%] grow"
              style={{ aspectRatio: 2 / 3, backgroundColor: c.paper2 }}
            />
          ))}
        </View>
      ) : null}
      {shows && shows.length === 0 ? (
        <View className="items-center gap-2 pt-4">
          <Mascot mood="confused" width={100} />
          <P muted>The list didn't load. Try again in a moment.</P>
        </View>
      ) : null}
      {shows && shows.length > 0 ? (
        <View className="gap-3">
          <Text className="font-brand pr-1 text-[20px] tracking-[1px] text-ink uppercase">
            Pick a show
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {shows.slice(0, shownCount).map((show) => (
              <View
                key={show.slug}
                style={{ width: `${100 / COLUMNS - 2.5}%` }}
              >
                <SeriesCard
                  series={{ name: show.name, coverUrl: show.coverUrl }}
                  width={104}
                  onPress={() => openShow(show.name)}
                />
              </View>
            ))}
          </View>
          {shownCount < shows.length ? (
            <Pressable
              onPress={() => setShownCount(shownCount + CARDS_A_PAGE)}
              className="self-center rounded-[4px] border-2 border-line bg-card px-4 py-2.5 active:opacity-80"
            >
              <Text className="font-body-semibold text-[15px] text-ink">
                Show {Math.min(CARDS_A_PAGE, shows.length - shownCount)} more
              </Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </Page>
  );
}
