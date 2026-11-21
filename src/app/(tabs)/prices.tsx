// Prices, as the Android app's search (web pages/Prices/PriceSearch.tsx): a
// series' name or an ISBN; a few to try before typing. A name gives the
// series it matches (with "Did you mean" for a typo, core findSeries); an
// ISBN opens that volume's prices
import { Link, router } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";
import DashedLine from "@/components/DashedLine";
import SeriesCover from "@/components/SeriesCover";
import { SearchIcon } from "@/core/components/icons/Icons";
import { isbnFromTyped } from "@/core/lib/barcode";
import { findSeries } from "@/core/lib/prices";
import type { SeriesHit } from "@/core/lib/types";
import { useColors } from "@/lib/colors";

const Safe = withUniwind(SafeAreaView);

// the phone's picks on the web (PriceSearch QUICK_PICKS)
const TRY = ["One Piece", "Frieren", "Berserk", "Dandadan", "Bleach", "Naruto"];
// a search waits this long after the last letter
const TYPING_MS = 400;

export default function PricesScreen() {
  const c = useColors();
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<SeriesHit[] | null>(null);
  const [guessed, setGuessed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query.trim().slice(0, 100).trim();
    if (q.length < 2) {
      setHits(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      findSeries(q, controller.signal)
        .then(({ hits, guessed }) => {
          setHits(hits);
          setGuessed(guessed);
          setError(null);
        })
        .catch((e: Error) => !controller.signal.aborted && setError(e.message));
    }, TYPING_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const submit = () => {
    const isbn = isbnFromTyped(query);
    if (isbn) router.push(`/prices/${isbn}`);
  };

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <AppHeader />
      <View className="gap-3 px-4 pt-5">
        <View className="flex-row items-center gap-2 rounded-[4px] border-2 border-line bg-card px-3">
          <SearchIcon color={c.inkSoft} width={20} height={20} />
          <TextInput
            className="flex-1 py-3 font-body text-[16px] text-ink"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={submit}
            placeholder="A series, or an ISBN"
            placeholderTextColorClassName="accent-muted"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        {/* a few to try: three even buttons a row, as the web's on a phone,
            never a ragged row */}
        {hits === null ? (
          <View className="gap-2">
            <Text className="font-body text-[14px] text-ink-soft">Try</Text>
            <View className="flex-row flex-wrap gap-2">
              {TRY.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => setQuery(name)}
                  style={{ flexBasis: "30%" }}
                  className="flex-1 items-center rounded-[3px] border-[1.5px] border-line py-2 active:bg-accent-wash"
                >
                  <Text className="font-body-medium text-[14px] text-ink">
                    {name}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
        {error ? (
          <Text className="font-body text-[14px] text-accent">{error}</Text>
        ) : null}
        {guessed && hits?.length ? (
          <Text className="font-body text-[14px] text-ink-soft">
            Did you mean:
          </Text>
        ) : null}
        {hits && !hits.length ? (
          <Text className="font-body text-[15px] text-ink-soft">
            No English series found. Try the name on the US cover, or an ISBN.
          </Text>
        ) : null}
      </View>
      <FlatList
        data={hits ?? []}
        keyExtractor={(h) => h.slug}
        ItemSeparatorComponent={DashedLine}
        contentContainerClassName="px-4 pt-2 pb-10"
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <Link
            href={{ pathname: "/prices/series", params: { name: item.name } }}
            asChild
          >
            <Pressable className="flex-row items-center gap-3 py-2 active:opacity-70">
              <SeriesCover
                name={item.name}
                lightNovel={item.lightNovel}
                url={item.thumbUrl ?? item.coverUrl}
                width={44}
              />
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="font-display text-[17px] text-ink"
                >
                  {item.name}
                </Text>
                <Text className="font-mono text-[12.5px] text-muted">
                  {[item.year, item.volumes ? `${item.volumes} vols` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
    </Safe>
  );
}
