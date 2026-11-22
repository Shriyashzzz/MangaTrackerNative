// A series' prices, as the web's pages/Prices/PriceSeries.tsx on the phone:
// its cover with its score, what AniList says, Add to my to-read; box sets
// and editions beside it (SetsBox); Watched the anime; what collecting it
// costs; then Volumes and Editions as two tabs. Volumes: each as a cover
// card with its price, Yours and Next, Not on your shelf to see only the
// gaps with what they cost. The rules are the web's (core seriesPageRules,
// finishCost, useSeriesData)
import { todayOf } from "@/core/lib/editionNews";
import ToBuyBag from "@/components/ToBuyBag";
import Tap from "@/components/Tap";
import PullPage, { pause, usePullTop } from "@/components/PullRefresh";
import TrackPitch from "@/components/prices/TrackPitch";
import { useAuth } from "@/store/auth";
import Backdrop from "@/components/Backdrop";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import LoadingQuote from "@/components/LoadingQuote";
import Mascot from "@/components/Mascot";
import { H2 } from "@/components/Page";
import Segmented from "@/components/Segmented";
import SeriesCover from "@/components/SeriesCover";
import { BoxSetSearch } from "@/components/prices/BoxSets";
import DealsStrip from "@/components/prices/DealsStrip";
import OnShelfChip from "@/components/prices/OnShelfChip";
import OtherEditions from "@/components/prices/OtherEditions";
import { SeriesScoreBadge } from "@/components/prices/SeriesCard";
import SeriesCostBox from "@/components/prices/SeriesCostBox";
import SeriesFacts, {
  SeriesDescription,
} from "@/components/prices/SeriesFacts";
import SetsBox from "@/components/prices/SetsBox";
import ToReadButton from "@/components/prices/ToReadButton";
import VolumeCard from "@/components/prices/VolumeCard";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { getJson } from "@/core/lib/api";
import { headlineLine, type EditionLine } from "@/core/lib/editions";
import {
  finishCost,
  finishText,
  seriesCost,
  stillToGet,
  usedCopies,
} from "@/core/lib/finishCost";
import { buyNextOf, ownedOf, rangesText } from "@/core/lib/ownedVolumes";
import { formatCents, novelParts } from "@/core/lib/prices";
import { onSale } from "@/core/lib/releaseDate";
import { shownSets } from "@/core/pages/Prices/boxSetRules";
import {
  bookSubtitle,
  cardsOf,
  markOf,
  oneVolumeSubtitle,
  PAGE_SIZE,
  unlistedNumbers,
} from "@/core/pages/Prices/seriesPageRules";
import {
  useBoxSetScan,
  useSeriesLoad,
  useShelfMatch,
} from "@/core/pages/Prices/useSeriesData";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const Safe = withUniwind(SafeAreaView);
// the volume grid: four covers a row, as the Android app lays them
const COLUMNS = 4;
const GRID_GAP = 12;
const PAGE_SIDE = 16;
// how near the foot a scroll gets before the next volumes come in
const GROW_WITHIN_PX = 600;

export default function PriceSeriesScreen() {
  const params = useLocalSearchParams<{
    name: string;
    edition?: string;
    toget?: string;
  }>();
  const name = params.name;
  const c = useColors();
  const nextFor = usePrefs((s) => s.prefs.nextFor ?? "after");
  const series = useSeriesLoad(name);
  const mine = useShelfMatch(name);
  const scannedSets = useBoxSetScan(name, series.key, Boolean(series.data));
  const [tab, setTab] = useState<"volumes" | "editions">(
    params.edition ? "editions" : "volumes",
  );
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const [toGetOnly, setToGetOnly] = useState(params.toget === "1");
  // how many rows are shown, for the list they were grown for: a new series
  // or filter starts at the first page again
  // where the Volumes / Editions switch sits in the page, to scroll to
  const page = useRef<ComponentRef<typeof ScrollView>>(null);
  const listKey = `${name}|${toGetOnly}`;
  const [grown, setGrown] = useState({ key: listKey, count: PAGE_SIZE });
  const grownCount = grown.key === listKey ? grown.count : PAGE_SIZE;
  const setGrownCount = (count: number) => setGrown({ key: listKey, count });
  const [editions, setEditions] = useState<{
    name: string;
    lines: EditionLine[];
  }>({ name: "", lines: [] });
  // asked for with the page, and the page waits for it: the Editions tab,
  // the box-set box and which sets it lists all hang on the answer, and
  // drawing before it made them pop in and reshuffle a second later
  useEffect(() => {
    const controller = new AbortController();
    getJson<{ lines: EditionLine[] }>(
      `/api/prices/editions?${new URLSearchParams({ name })}`,
      controller.signal,
    )
      .then(({ lines }) => setEditions({ name, lines: lines ?? [] }))
      .catch((e) => {
        if ((e as Error).name !== "AbortError")
          setEditions({ name, lines: [] });
      });
    return () => controller.abort();
  }, [name]);
  const editionsKnown = editions.name === name;
  const pull = usePullTop();
  const isSignedIn = useAuth((st) => st.isSignedIn);
  const [askedEdition, setAskedEdition] = useState<string | null>(
    params.edition ?? null,
  );

  const frame = (title: string, body: React.ReactNode) => (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <Backdrop />
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Tap
          feel="round"
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Tap>
        <Text
          numberOfLines={1}
          className="flex-1 font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase"
        >
          {title}
          {"\u00A0"}
        </Text>
        <View className="pr-2">
          <ToBuyBag />
        </View>
      </View>
      <DoubleRule />
      {body}
    </Safe>
  );
  if (series.loading || (!series.error && !editionsKnown))
    return frame(name, <LoadingQuote />);
  if (series.error || !series.data) {
    const notFound = /couldn't find that series/i.test(series.error);
    return frame(
      name,
      <View className="items-center gap-3 px-6 pt-10">
        <Mascot mood={notFound ? "confused" : "panic"} width={110} />
        <Text className="text-center font-body text-[15px] text-ink-soft">
          {notFound ? "Search for it by the name on its cover." : series.error}
        </Text>
        <View className="flex-row gap-3">
          {!notFound ? (
            <Button label="Try again" small onPress={series.retry} />
          ) : null}
          <Button
            label={notFound ? "Search" : "Back to price check"}
            small
            onPress={() => router.push("/prices")}
          />
        </View>
      </View>,
    );
  }

  const data = series.data;
  const { info, volumes, incomplete } = data;
  // Nothing more is coming: the series has ended, every volume it had is
  // listed in English, and none of those is still to be released. Only
  // then is a "next volume" not promised (TrackPitch)
  const today = todayOf();
  const everyVolumeOut =
    info?.status === "FINISHED" &&
    info.volumes != null &&
    volumes.length >= info.volumes &&
    volumes.every((v) => !v.published || v.published <= today);
  const unlisted = unlistedNumbers(volumes);
  const editionLines = editions.name === name ? editions.lines : [];
  const boxSets = scannedSets ?? data.boxSets ?? [];
  const hasSets = shownSets(boxSets, editionLines.length > 0).length > 0;
  const headline = headlineLine(editionLines);
  const next = mine
    ? (buyNextOf(
        mine,
        onSale(volumes).map((v) => v.volume),
        nextFor === "gap",
      ) ?? undefined)
    : undefined;
  const toGet = mine ? stillToGet(volumes, mine) : volumes;
  const finish = mine ? finishCost(onSale(toGet), onSale(volumes)) : null;
  const whole = onSale(volumes).filter(
    (v) => v.volume >= 0 && Number.isInteger(v.volume),
  );
  const singles = seriesCost(whole);
  const cost = mine ? null : singles;
  const used = cost ? usedCopies(whole) : null;
  const wholeNumbers = volumes
    .map((v) => v.volume)
    .filter((n): n is number => n != null && Number.isInteger(n));
  const newestNumber = Math.max(0, ...wholeNumbers);
  const hasHole = new Set(wholeNumbers).size < newestNumber;
  const toGetShown = Boolean(mine) && toGetOnly;
  const tabbed = editionLines.length > 0;
  const onEditions = tabbed && tab === "editions";
  const list = toGetShown ? toGet : volumes;
  const shown = list.slice(0, grownCount);
  const named = novelParts(info?.name ?? data.name);
  const tileWidth = Math.floor(
    (screenWidth - PAGE_SIDE * 2 - GRID_GAP * (COLUMNS - 1)) / COLUMNS,
  );

  return frame(
    named.title,
    <PullPage
      refresh={async () => {
        series.retry();
        await pause();
      }}
      scrollTop={pull.top}
    >
      <ScrollView
        ref={page}
        contentContainerClassName="gap-8 px-4 pt-5 pb-20"
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={(e) => {
          pull.track(e);
          const { contentOffset, contentSize, layoutMeasurement } =
            e.nativeEvent;
          const left =
            contentSize.height - contentOffset.y - layoutMeasurement.height;
          if (left < GROW_WITHIN_PX && grownCount < list.length)
            setGrownCount(grownCount + PAGE_SIZE);
        }}
      >
        <DealsStrip />
        {/* the cover and the facts, then what it's about from under the cover,
          the page's full width */}
        <View className="gap-3">
          <View className="flex-row gap-4">
            {volumes[0]?.coverUrl || info?.coverUrl ? (
              <View>
                <View className="self-start">
                  <SeriesCover
                    name={named.title}
                    lightNovel={named.lightNovel}
                    url={volumes[0]?.coverUrl ?? info?.coverUrl}
                    width={94}
                    border={2}
                  />

                  <SeriesScoreBadge percent={info?.score} />
                </View>
                <OnShelfChip
                  name={info?.name ?? data.name}
                  altNames={info?.altNames}
                />
              </View>
            ) : null}
            <View className="min-w-0 flex-1 gap-2">
              <Text className="font-display text-[23px] leading-[27px] text-ink">
                {named.title}
              </Text>
              {named.lightNovel ? (
                <Text className="self-start rounded-[2px] border-[1.5px] border-line-soft px-1.5 font-body-medium text-[12px] text-ink-soft">
                  Novel
                </Text>
              ) : null}
              {info ? (
                <SeriesFacts info={info} withDescription={false} />
              ) : null}
              <ToReadButton
                name={info?.name ?? data.name}
                altNames={info?.altNames}
                cover={info?.coverUrl ?? null}
                genres={info?.genres}
              />
            </View>
          </View>
          {info ? <SeriesDescription info={info} /> : null}
        </View>

        {/* no account: the ticket runs the page's full width, so nothing is
          left empty under the cover */}
        {!isSignedIn ? (
          <TrackPitch name={named.title} finished={everyVolumeOut} />
        ) : null}

        <SetsBox
          key={data.slug}
          series={data.slug}
          sets={boxSets}
          links={data.boxSetLinks ?? []}
          lines={editionLines}
          headline={headline ?? null}
          owned={mine ? ownedOf(mine) : []}
          onSeeAllBooks={(key) => {
            setAskedEdition(key);
            setTab("editions");
          }}
        />
        {cost ? (
          <SeriesCostBox
            cost={cost}
            used={used}
            comingSoon={onSale(volumes).length < volumes.length}
          />
        ) : null}

        {tabbed ? (
          <View>
            <Segmented
              label="Show"
              options={[
                { value: "volumes", label: "Volumes" },
                { value: "editions", label: "Editions" },
              ]}
              value={onEditions ? "editions" : "volumes"}
              onChange={(value) => {
                setTab(value);
              }}
            />
          </View>
        ) : null}

        {/* tall enough that the switch above can stay where it is when the
          shorter of the two lists is showing */}
        <View className="gap-8" style={{ minHeight: screenHeight }}>
          {/* both lists stay drawn and the switch only shows one: nothing is
            built again on a tap, so it changes at once */}
          <View
            className="gap-3"
            style={{ display: onEditions ? "none" : "flex" }}
          >
            <View className="flex-row items-end justify-between">
              <H2>Volumes</H2>
              {volumes.length ? (
                <Text className="font-mono text-[12.5px] text-muted">
                  {volumes.length} {volumes.length === 1 ? "volume" : "volumes"}{" "}
                  in English
                </Text>
              ) : null}
            </View>
            {unlisted.length ? (
              <Text className="font-body text-[13.5px] text-ink-soft">
                {unlisted.length === 1 ? "Vol." : "Vols."}{" "}
                {rangesText(unlisted)} {unlisted.length === 1 ? "is" : "are"}{" "}
                missing from our list.
              </Text>
            ) : null}
            {finish || (mine && toGet.length < volumes.length) ? (
              <View className="flex-row flex-wrap items-center gap-3">
                {mine && toGet.length < volumes.length ? (
                  <Tap
                    onPress={() => setToGetOnly(!toGetOnly)}
                    accessibilityState={{ selected: toGetOnly }}
                    className={`rounded-[3px] border-[1.5px] px-2.5 py-1.5 ${toGetOnly ? "border-accent bg-accent-wash" : "border-line"}`}
                  >
                    <Text
                      className={`font-body-medium text-[14px] ${toGetOnly ? "text-accent-ink" : "text-ink"}`}
                    >
                      Not on your shelf ({toGet.length})
                    </Text>
                  </Tap>
                ) : null}
                {finish?.enough ? (
                  <Text className="font-body text-[14px] text-ink-soft">
                    {finishText(finish, formatCents)}
                  </Text>
                ) : null}
              </View>
            ) : null}
            {volumes.length ? (
              <>
                <View
                  className="flex-row flex-wrap"
                  style={{ rowGap: 20, columnGap: GRID_GAP }}
                >
                  {cardsOf(shown).map((card) => {
                    const first = card[0]!;
                    const mark = markOf(card, mine, next);
                    if (card.length === 1)
                      return (
                        <VolumeCard
                          lightNovel={named.lightNovel}
                          key={first.volume}
                          plainStandIn
                          {...first}
                          title={`Vol. ${first.volume}`}
                          priceCents={first.knownPriceCents}
                          subtitle={oneVolumeSubtitle(first)}
                          mark={mark}
                          seriesCoverUrl={info?.coverUrl ?? null}
                          width={tileWidth}
                          bare
                        />
                      );
                    const last = card[card.length - 1]!;
                    return (
                      <VolumeCard
                        lightNovel={named.lightNovel}
                        key={first.volume}
                        plainStandIn
                        {...first}
                        title={`Book ${first.inBook!.book}`}
                        volume={null}
                        holds={{ from: first.volume, to: last.volume }}
                        priceCents={first.knownPriceCents}
                        subtitle={bookSubtitle(card)}
                        mark={mark}
                        seriesCoverUrl={info?.coverUrl ?? null}
                        width={tileWidth}
                      />
                    );
                  })}
                </View>
              </>
            ) : incomplete ? (
              <View className="gap-2">
                <Text className="font-body text-[14.5px] text-ink-soft">
                  The book catalog is slow to answer right now, so volumes
                  didn't load. It usually works on the next try.
                </Text>
                <Button label="Try again" small onPress={series.retry} />
              </View>
            ) : (
              <View className="items-center gap-3 py-6">
                <Mascot mood="confused" width={100} />
                <Text className="text-center font-body text-[15px] leading-[22px] text-ink-soft">
                  No English volumes out yet.{"\n"}If one is, search it by name
                  or ISBN.
                </Text>
                <Button
                  center
                  small
                  label="Search a volume"
                  onPress={() => router.push("/prices")}
                />
              </View>
            )}
            {incomplete && volumes.length > 0 && hasHole ? (
              <Text className="font-body text-[13.5px] text-ink-soft">
                Some volumes may be missing: the book catalog was slow to
                answer.{" "}
                <Text
                  className="font-body-semibold text-ink underline"
                  onPress={series.retry}
                >
                  Try again
                </Text>
              </Text>
            ) : null}
          </View>

          <View style={{ display: tabbed && !onEditions ? "none" : "flex" }}>
            <OtherEditions
              name={name}
              asked={askedEdition}
              owned={mine ? ownedOf(mine) : []}
              lines={editionLines}
              singles={singles}
              seriesCoverUrl={info?.coverUrl ?? null}
            />
          </View>
        </View>
        {!hasSets && !onEditions ? (
          <BoxSetSearch links={data.boxSetLinks ?? []} />
        ) : null}
      </ScrollView>
    </PullPage>,
  );
}
