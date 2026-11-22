// Prices, as the web's pages/Prices/PriceSearch.tsx on the phone: search a
// series or an ISBN (the box opens full screen with suggestions and recent
// searches, as the app's does), a few to try, the way to After the anime,
// and the highlights: Popular this season, Latest deals, Prices
// just checked. A search lists the series found, with Did you mean for a
// typo. The rules are the web's (core findSeries, nearMatches, askedEdition)
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";
import Button from "@/components/Button";
import PressScale from "@/components/PressScale";
import Mascot from "@/components/Mascot";
import SeriesCover from "@/components/SeriesCover";
import CountrySwitch from "@/components/prices/CountrySwitch";
import DealsStrip from "@/components/prices/DealsStrip";
import SeriesCard from "@/components/prices/SeriesCard";
import VolumeCard from "@/components/prices/VolumeCard";
import { ChevronLeftIcon, SearchIcon } from "@/core/components/icons/Icons";
import { isbnFromTyped } from "@/core/lib/barcode";
import { inCanada } from "@/core/lib/country";
import { askedEdition } from "@/core/lib/editions";
import { DID_YOU_MEAN } from "@/core/lib/nearMatches";
import { findSeries, getHighlights, novelParts } from "@/core/lib/prices";
import { recentSearches, rememberSearch } from "@/core/lib/recentSearches";
import type { Highlights, SeriesHit } from "@/core/lib/types";
import { starsOf } from "@/core/pages/Prices/reviews/reviewText";
import { useColors } from "@/lib/colors";
import { look } from "@/lib/platformLook";
import { usePrefs } from "@/store/prefs";
import { H2 } from "@/components/Page";

const Safe = withUniwind(SafeAreaView);

// the phone's picks on the web (PriceSearch QUICK_PICKS)
const TRY = ["One Piece", "Frieren", "Berserk", "Dandadan", "Bleach", "Naruto"];
const SHOWN = 5;
const DEBOUNCE_MS = 250;

function HighlightsStrip() {
  const [data, setData] = useState<Highlights | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getHighlights(controller.signal)
      .then(setData)
      .catch(() => setData({ trending: [], deals: [], recent: [] }));
    return () => controller.abort();
  }, []);
  const canada = inCanada();
  if (!data) return null;
  const row = (children: React.ReactNode) => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
    >
      {children}
    </ScrollView>
  );
  return (
    <>
      {data.trending.length ? (
        <View className="gap-2">
          <View className="flex-row items-end justify-between">
            <H2>Popular this season</H2>
            <Pressable onPress={() => router.push("/series")} hitSlop={6}>
              <Text className="font-body-medium text-[14px] text-ink underline">
                All series →
              </Text>
            </Pressable>
          </View>
          {row(
            data.trending.map((s) => <SeriesCard key={s.slug} series={s} />),
          )}
        </View>
      ) : null}
      {!canada && data.deals.length ? (
        <View className="gap-2">
          <View className="flex-row items-end justify-between">
            <H2>Latest deals</H2>
            <Pressable onPress={() => router.push("/deals")} hitSlop={6}>
              <Text className="font-body-medium text-[14px] text-ink underline">
                All deals →
              </Text>
            </Pressable>
          </View>
          {row(
            data.deals.map((d) => (
              <VolumeCard
                key={d.isbn13}
                {...d}
                priceCents={d.priceCents}
                wasCents={d.avgCents}
                width={104}
              />
            )),
          )}
        </View>
      ) : null}
      {!canada && data.recent.length ? (
        <View className="gap-2">
          <H2>Prices just checked</H2>
          {row(
            data.recent.map((r) => (
              <VolumeCard
                key={r.isbn13}
                {...r}
                priceCents={r.priceCents}
                width={104}
              />
            )),
          )}
        </View>
      ) : null}
    </>
  );
}

export default function PricesScreen() {
  const c = useColors();
  const country = usePrefs((s) => (s.prefs.country === "ca" ? "ca" : "us"));
  const [text, setText] = useState("");
  const [full, setFull] = useState(false);
  const [found, setFound] = useState<{
    q: string;
    items: SeriesHit[];
    guessed?: boolean;
    loading: boolean;
  }>({ q: "", items: [], loading: false });
  const [result, setResult] = useState<{
    query: string;
    items: SeriesHit[];
    guessed?: boolean;
    error: string;
  } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const q = text.trim();
  const isbn = isbnFromTyped(q);

  // suggestions while typing (the web's SeriesSearchBox)
  useEffect(() => {
    if (!full || q.length < 2 || isbn) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setFound((f) => ({ ...f, loading: true }));
      findSeries(askedEdition(q).series, controller.signal)
        .then(({ hits, guessed }) =>
          setFound({ q, items: hits, guessed, loading: false }),
        )
        .catch((e) => {
          if (e.name !== "AbortError")
            setFound({ q, items: [], loading: false });
        });
    }, DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [q, full, isbn]);
  // the search itself (the web's PriceSearch results)
  const query = result?.query ?? "";
  useEffect(() => {
    if (query.length < 2) return;
    const controller = new AbortController();
    findSeries(query, controller.signal)
      .then(({ hits, guessed }) =>
        setResult({ query, items: hits, guessed, error: "" }),
      )
      .catch((e) => {
        if (e.name !== "AbortError")
          setResult({ query, items: [], error: e.message });
      });
    return () => controller.abort();
  }, [query, attempt]);

  const pick = (series: Pick<SeriesHit, "name">) => {
    setFull(false);
    rememberSearch(series.name);
    const { edition } = askedEdition(q);
    router.push({
      pathname: "/prices/series",
      params: { name: series.name, ...(edition ? { edition } : {}) },
    });
  };
  const seeAll = () => {
    setFull(false);
    if (isbn) return router.push(`/prices/${isbn}`);
    if (q.length >= 2)
      setResult({ query: askedEdition(q).series, items: [], error: "" });
  };
  const searching = query.length >= 2;
  const fresh = found.q === q;
  const shown = fresh ? found.items.slice(0, SHOWN) : [];
  const recent = full && q.length < 2 ? recentSearches() : [];
  const isbnDigits = query.replace(/[\s-]/g, "");
  const badIsbn =
    /^(\d{13}|\d{9}[\dXx])$/.test(isbnDigits) && !isbnFromTyped(query);

  // the box, full screen: suggestions, or the recent searches
  if (full)
    return (
      <Safe edges={["top"]} className="flex-1 bg-paper">
        <View className="flex-row items-center gap-2 px-2 pt-2 pb-2">
          <Pressable
            onPress={() => setFull(false)}
            hitSlop={8}
            className="p-2"
            accessibilityLabel="Close search"
          >
            <ChevronLeftIcon color={c.ink} width={24} height={24} />
          </Pressable>
          <View className="flex-1 flex-row items-center gap-2 rounded-[14px] border border-line-soft bg-card px-3">
            <SearchIcon color={c.inkSoft} width={18} height={18} />
            <TextInput
              autoFocus
              value={text}
              onChangeText={setText}
              onSubmitEditing={seeAll}
              placeholder="Title or ISBN"
              placeholderTextColor={c.muted}
              autoCorrect={false}
              returnKeyType="search"
              className="min-h-[44px] flex-1 font-body text-[16px] text-ink"
            />
          </View>
        </View>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-4 pb-10"
        >
          {recent.length ? (
            <View className="gap-1">
              <Text className="pt-2 pb-1 font-mono text-[11.5px] tracking-[1px] text-muted uppercase">
                Recent
              </Text>
              {recent.map((name) => (
                <Pressable
                  key={name}
                  onPress={() => pick({ name })}
                  className="py-2.5"
                >
                  <Text className="font-body text-[16px] text-ink">{name}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
          {q.length >= 2 && !isbn
            ? shown.map((s) => (
                <Pressable
                  key={s.slug}
                  onPress={() => pick(s)}
                  className="flex-row items-center gap-3 border-b border-dotted border-line-soft py-2 active:opacity-70"
                >
                  <SeriesCover
                    name={s.name}
                    lightNovel={s.lightNovel}
                    url={s.thumbUrl ?? s.coverUrl}
                    width={40}
                  />
                  <View className="min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-body-semibold text-[15.5px] text-ink"
                    >
                      {novelParts(s.name).title}
                    </Text>
                    <Text className="font-mono text-[12px] text-muted">
                      {[
                        s.lightNovel && "Light novel",
                        s.year,
                        s.volumes ? `${s.volumes} vols` : null,
                        s.score ? `★ ${starsOf(s.score)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </Pressable>
              ))
            : null}
          {q.length >= 2 && fresh && found.guessed && shown.length ? (
            <Text className="pt-2 font-body text-[13px] text-muted">
              {DID_YOU_MEAN}
            </Text>
          ) : null}
          {q.length >= 2 ? (
            <Pressable onPress={seeAll} className="py-3">
              <Text className="font-body-semibold text-[15px] text-ink underline">
                {isbn ? `Open ISBN ${isbn}` : `See all results for “${q}”`}
              </Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </Safe>
    );

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <AppHeader />
      <ScrollView
        contentContainerClassName="gap-5 px-4 pt-5 pb-10"
        keyboardShouldPersistTaps="handled"
      >
        {!searching ? <DealsStrip /> : null}
        <View className="gap-3">
          <Text className="font-brand pr-1 text-[30px] tracking-[1px] text-ink uppercase">
            Price check
          </Text>
          <Text className="font-body text-[14.5px] text-ink-soft">
            Find a series, then see what{" "}
            {country === "ca" ? "stores in Canada" : "US stores"} charge for
            each volume.
          </Text>
          <View className="w-[140px]">
            <CountrySwitch />
          </View>
          <Pressable
            onPress={() => setFull(true)}
            className="flex-row items-center gap-2 rounded-[14px] border border-line-soft bg-card px-3"
            accessibilityLabel="Search a series or an ISBN"
          >
            <SearchIcon color={c.inkSoft} width={20} height={20} />
            <Text
              className={`min-h-[46px] flex-1 py-3 font-body text-[16px] ${query ? "text-ink" : "text-muted"}`}
            >
              {query || "Title or ISBN"}
            </Text>
          </Pressable>
          {!searching ? (
            <View className="gap-2">
              <Text className="font-body text-[14px] text-ink-soft">Try</Text>
              <View className="flex-row flex-wrap gap-2">
                {TRY.map((name) => (
                  <PressScale
                    key={name}
                    onPress={() =>
                      router.push({
                        pathname: "/prices/series",
                        params: { name },
                      })
                    }
                    style={{ flexBasis: "30%", flexGrow: 1 }}
                    className={`min-h-[40px] items-center justify-center overflow-hidden border border-line-soft ${look.buttonRadius}`}
                  >
                    <Text className="font-body-medium text-[14px] text-ink">
                      {name}
                    </Text>
                  </PressScale>
                ))}
              </View>
            </View>
          ) : null}
        </View>

        {!searching ? (
          <PressScale
            onPress={() => router.push("/after-anime")}
            accessibilityRole="link"
            className="gap-2 rounded-[14px] border border-line-soft bg-card px-4 pt-3.5 pb-3.5"
          >
            {/* the door to After the anime: a small stamped title, the
                words, the way in; a side door, not the main one */}
            <View
              className="self-start bg-accent px-1.5 pt-0.5"
              style={{ transform: [{ rotate: "-2deg" }] }}
            >
              <Text className="font-brand pr-1 text-[14px] tracking-[1px] text-on-accent uppercase">
                Finished the anime?
              </Text>
            </View>
            <Text className="font-body text-[14.5px] leading-[20px] text-ink-soft">
              Find the chapter and volume of the manga to start from.
            </Text>
            <Text className="font-body-semibold text-[14.5px] text-ink underline">
              Find where to start →
            </Text>
          </PressScale>
        ) : null}

        {searching && result?.error ? (
          <View className="items-center gap-3 py-6">
            <Mascot mood="panic" width={100} />
            <Text className="font-body text-[15px] text-ink-soft">
              Check your connection and try again in a moment.
            </Text>
            <Button
              label="Try again"
              small
              onPress={() => setAttempt((n) => n + 1)}
            />
          </View>
        ) : null}
        {searching && result && !result.error && result.items.length === 0 ? (
          <View className="items-center gap-3 py-6">
            <Mascot mood="confused" width={100} />
            <Text className="text-center font-body text-[15px] text-ink-soft">
              {badIsbn
                ? "A digit may be off. Check it against the back of the book."
                : "Try the name printed on the US cover, or paste the ISBN from the back of a volume."}
            </Text>
            <Pressable onPress={() => router.push("/series")} hitSlop={6}>
              <Text className="font-body-semibold text-[14.5px] text-ink underline">
                Browse every series
              </Text>
            </Pressable>
          </View>
        ) : null}
        {searching && result && result.items.length ? (
          <View className="gap-3">
            <Text className="font-display text-[19px] text-ink">
              {result.guessed
                ? DID_YOU_MEAN
                : `${result.items.length} series for “${query}”`}
            </Text>
            <View
              className="flex-row flex-wrap justify-between"
              style={{ rowGap: 18 }}
            >
              {result.items.map((s) => (
                <SeriesCard key={s.slug} series={s} width={104} />
              ))}
            </View>
            <Pressable
              onPress={() => {
                setResult(null);
                setText("");
              }}
              hitSlop={6}
              className="self-start"
            >
              <Text className="font-body-medium text-[14px] text-ink-soft underline">
                Clear the search
              </Text>
            </Pressable>
          </View>
        ) : null}

        {!searching ? <HighlightsStrip /> : null}
      </ScrollView>
    </Safe>
  );
}
