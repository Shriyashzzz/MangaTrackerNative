// A volume's prices, as the web's pages/Prices/PriceVolume.tsx: its cover,
// title, what it is, where it stands on their shelf (ShelfAction), the
// prices (stored ones first, then a live check when it's worth one; or
// Canada's), the box-set note, more places to look, the price history,
// about the series, readers' reviews, and the volumes beside it. Every rule
// is the web's (core volumePageRules, offerLabels, useVolumeLoad)
import { coverAt } from "@/lib/coverAt";
import LightNovelBand from "@/components/LightNovelBand";
import ToBuyBag from "@/components/ToBuyBag";
import Tap from "@/components/Tap";
import PullPage, { pause, usePullTop } from "@/components/PullRefresh";
import Backdrop from "@/components/Backdrop";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import LoadingQuote from "@/components/LoadingQuote";
import Mascot from "@/components/Mascot";
import OfferList from "@/components/OfferList";
import { H2 } from "@/components/Page";
import { BoxSetNote } from "@/components/prices/BoxSets";
import CountrySwitch from "@/components/prices/CountrySwitch";
import DealsStrip from "@/components/prices/DealsStrip";
import PriceAges from "@/components/prices/PriceAges";
import SeriesFacts from "@/components/prices/SeriesFacts";
import ShelfAction from "@/components/prices/ShelfAction";
import StoreButtons from "@/components/prices/StoreButtons";
import VolumeCard from "@/components/prices/VolumeCard";
import VolumeReviews from "@/components/prices/VolumeReviews";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@/core/components/icons/Icons";
import { isbnFromTyped } from "@/core/lib/barcode";
import { bookName } from "@/core/lib/bookName";
import {
  coverSrc,
  formatCents,
  novelParts,
  olderThanDays,
  seriesTitle,
  shopName,
  timeAgo,
} from "@/core/lib/prices";
import { isCollection } from "@/core/lib/types";
import { useCanadaPrices } from "@/core/pages/Prices/canada/useCanadaPrices";
import { knownStoreLow, TYPE_LABEL } from "@/core/pages/Prices/offerLabels";
import { useVolumeReviews } from "@/core/pages/Prices/reviews/useVolumeReviews";
import { useVolumeLoad } from "@/core/pages/Prices/useVolumeLoad";
import {
  nearbyVolumes,
  releaseDay,
  shortDate,
  shownHistory,
  shownOffers,
  storeLinksToShow,
  usualWhenWellBelow,
} from "@/core/pages/Prices/volumePageRules";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

const Safe = withUniwind(SafeAreaView);
// a history kind's name: the offer labels' words for new print and ebooks
const KIND_LABEL: Record<string, string> = {
  new: TYPE_LABEL.newPrint.label,
  used: "Used & marketplace",
  ebook: TYPE_LABEL.ebook.label,
};
const AFFILIATE_NOTE =
  "Some store links are affiliate links, which help keep Manga Tracker running at no cost to you.";
const WHY_NONE_CA: Record<string, string> = {
  ok: "No Canadian store listed this volume when we checked. Try the stores below.",
  budget:
    "We've checked as many Canadian prices as we can this month. The stores below have it.",
  unknown:
    "We don't have Canadian prices for this volume yet. Try the stores below.",
  off: "Canadian prices aren't available right now. Try the stores below.",
  error: "Canadian prices aren't available right now. Try the stores below.",
};

export default function PriceVolumeScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const c = useColors();
  const country = usePrefs((s) => (s.prefs.country === "ca" ? "ca" : "us"));
  const hideEbooks = usePrefs((s) => s.prefs.hideEbooks === "yes");
  const page = useVolumeLoad(isbn, country);
  const pull = usePullTop();
  const loadedBook = page.data?.book ?? null;
  const canada = useCanadaPrices(
    country === "ca" ? (loadedBook?.isbn13 ?? null) : null,
  );
  const reviews = useVolumeReviews(loadedBook?.isbn13 ?? null);
  const [historyOpen, setHistoryOpen] = useState(false);

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
  const oops = (
    mood: "confused" | "panic",
    text: string,
    retry?: () => void,
  ) => (
    <View className="items-center gap-3 px-6 pt-10">
      <Mascot mood={mood} width={110} />
      <Text className="text-center font-body text-[15px] text-ink-soft">
        {text}
      </Text>
      <View className="flex-row gap-3">
        {retry ? <Button label="Try again" small onPress={retry} /> : null}
        <Button
          label="Back to price check"
          small
          onPress={() => router.push("/prices")}
        />
      </View>
    </View>
  );
  if (!isbnFromTyped(isbn))
    return frame(
      "Prices",
      oops(
        "confused",
        "Search by name, or type the 13 digits from the back of a volume.",
      ),
    );
  if (page.loading) return frame("Prices", <LoadingQuote />);
  if (page.error || !page.data)
    return frame(
      "Prices",
      oops(
        "panic",
        "Check your connection and try again in a moment.",
        page.retry,
      ),
    );

  const {
    book,
    series,
    volume,
    inBook,
    preorder,
    siblings,
    edition,
    offers: allOffers,
    history: allHistory,
    checkedAt,
    liveSources,
    storeLinks,
  } = page.data;
  const seriesLabel = series.info?.name ?? series.name;
  const shownSeries = novelParts(seriesLabel).title;
  const shownBook = novelParts(page.data.heading ?? book.title);
  const inCanada = country === "ca";
  const { shown: offers, hiddenEbooks } = shownOffers(allOffers, hideEbooks);
  const { shown: countryOffers } = inCanada
    ? shownOffers(canada?.offers ?? [], hideEbooks)
    : { shown: offers };
  const { history, lowestCents: lowestInHistory } = shownHistory(
    inCanada ? (canada?.history ?? null) : allHistory,
    hideEbooks,
  );
  const nearby = nearbyVolumes(siblings, volume, inBook);
  const unknownBook = !series.info && volume == null;
  const { buttons: preorderAt, others: otherStores } = storeLinksToShow(
    storeLinks,
    offers,
    Boolean(preorder),
  );
  const best = countryOffers.find(
    (o) => o.condition === "new" && o.format === "print",
  );
  const cheapestSecondHand = countryOffers.find(
    (o) => o.format === "print" && o.condition !== "new" && !isCollection(o),
  );
  const secondHandIsCheaper =
    best && cheapestSecondHand
      ? cheapestSecondHand.priceCents < best.priceCents
      : false;
  const knownBest = knownStoreLow(countryOffers);
  const aboveUsual = usualWhenWellBelow(
    siblings,
    book.isbn13,
    best?.priceCents,
  );
  const stale =
    best && olderThanDays(best.fetchedAt, 3) ? timeAgo(best.fetchedAt) : null;
  let otherStoresTitle = "Check price at:";
  if (preorder) otherStoresTitle = "Or preorder at:";
  else if (offers.length > 0) otherStoresTitle = "More places to look:";
  const openSeries = () =>
    router.push({ pathname: "/prices/series", params: { name: seriesLabel } });
  const title = volume != null ? `Vol. ${volume}` : shownBook.title;

  // Canada's own offers and links (the web's CanadaPrices)
  const caAllOffers = canada?.offers ?? [];
  const caOffers = caAllOffers.filter(
    (o) => !(hideEbooks && o.format === "ebook") && o.format !== "set",
  );
  const caHiddenEbooks = hideEbooks
    ? caAllOffers.filter((o) => o.format === "ebook").length
    : 0;
  const caLinks = canada?.links ?? [];
  const caPreorderAt = preorder
    ? ["Amazon.ca", "eBay.ca"].flatMap(
        (name) => caLinks.find((s) => s.store === name) ?? [],
      )
    : [];
  const caOthers = caLinks.filter((s) => !caPreorderAt.includes(s));

  return frame(
    `${shownSeries}, ${title}`,
    <PullPage
      refresh={async () => {
        page.retry();
        await pause();
      }}
      scrollTop={pull.top}
    >
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-4 pb-16"
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={pull.track}
      >
        <DealsStrip />
        <View className="flex-row gap-3.5">
          <View>
            <Tap
              onPress={openSeries}
              accessibilityLabel={`${shownSeries}: open the series`}
              style={{
                width: 102,
                aspectRatio: 2 / 3,
                borderWidth: 2,
                borderColor: c.line,
                backgroundColor: c.paper2,
                overflow: "hidden",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!book.coverUrl && series.info?.coverUrl ? (
                <Image
                  source={{ uri: coverSrc(series.info.coverUrl) }}
                  style={{
                    position: "absolute",
                    width: "100%",
                    height: "100%",
                    opacity: 0.35,
                  }}
                  contentFit="cover"
                />
              ) : null}
              {!book.coverUrl ? (
                <Text className="font-brand pr-[10px] text-[40px] text-ink">
                  {volume ?? "?"}
                  {"\u00A0"}
                </Text>
              ) : null}
              {book.coverUrl ? (
                <Image
                  source={{ uri: coverAt(book.coverUrl, 102) }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              ) : null}
              {shownBook.lightNovel ? <LightNovelBand width={102} /> : null}
            </Tap>
          </View>
          <View className="min-w-0 flex-1 gap-1.5">
            <Text className="font-display text-[21px] leading-[25px] text-ink">
              {shownBook.title}
            </Text>
            <Text className="font-body text-[13.5px] text-ink-soft">
              {[book.authors, book.publisher, book.year]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {preorder ? (
                <Text className="rounded-[2px] bg-accent px-1.5 font-brand pr-[4px] text-[12px] tracking-[1px] text-on-accent uppercase">
                  Preorder · out {releaseDay(preorder)}
                  {"\u00A0"}
                </Text>
              ) : null}
              {volume != null ? (
                <Text className="rounded-[2px] border-[1.5px] border-line px-1.5 font-brand pr-[4px] text-[12px] tracking-[1px] text-ink uppercase">
                  Vol. {volume}
                  {"\u00A0"}
                </Text>
              ) : null}
              <Text className="rounded-[2px] border border-line-soft px-1.5 font-mono text-[11px] text-ink-soft">
                ISBN-13 {book.isbn13.trim()}
              </Text>
              {inBook ? (
                <Text className="rounded-[2px] border-[1.5px] border-line-soft px-1.5 font-body-medium text-[12px] text-ink-soft">
                  Vols. {inBook.from}–{inBook.to} in one book
                </Text>
              ) : null}
              {shownBook.lightNovel ? (
                <Text className="rounded-[2px] border-[1.5px] border-line-soft px-1.5 font-body-medium text-[12px] text-ink-soft">
                  Novel
                </Text>
              ) : null}
            </View>
            <Tap onPress={openSeries} hitSlop={4}>
              <Text className="font-body text-[14px] text-ink-soft">
                Part of{" "}
                <Text className="font-body-semibold text-ink border-b pb-[2px] border-ink self-start">
                  {shownSeries}
                </Text>
              </Text>
            </Tap>
            {best ? (
              <Text className="font-body text-[14px] text-ink">
                {preorder ? "Preorder from" : "New from"}{" "}
                <Text className="font-body-semibold">
                  {formatCents(best.priceCents)}
                </Text>{" "}
                at {shopName(best.store)}
                {knownBest ? (
                  <>
                    , or{" "}
                    <Text className="font-body-semibold">
                      {formatCents(knownBest.priceCents)}
                    </Text>{" "}
                    at {shopName(knownBest.store)}
                  </>
                ) : null}
                {secondHandIsCheaper && cheapestSecondHand ? (
                  <Text className="text-ink-soft">
                    {" "}
                    ·{" "}
                    {cheapestSecondHand.condition === "used"
                      ? "used"
                      : "resold"}{" "}
                    from {formatCents(cheapestSecondHand.priceCents)}
                  </Text>
                ) : null}
                {aboveUsual != null ? (
                  <Text className="text-ink-soft">
                    {" "}
                    · most volumes are about {formatCents(aboveUsual)}
                  </Text>
                ) : null}
                {stale ? (
                  <Text className="text-ink-soft">
                    {" "}
                    · this price seen {stale}
                  </Text>
                ) : null}
              </Text>
            ) : null}
          </View>
        </View>

        {unknownBook ? (
          <Text className="font-body text-[14px] text-ink-soft">
            We don't know this book as a manga.
          </Text>
        ) : (
          <ShelfAction
            isbn13={book.isbn13.trim()}
            // this page can't tell whether every English volume is out, so
            // a series that has ended is never promised a next one
            finished={series.info?.status === "FINISHED"}
            series={seriesLabel}
            alsoCalled={series.name}
            title={edition ? seriesLabel : seriesTitle(book.title)}
            volume={volume}
            editionBook={
              edition && volume != null
                ? {
                    name: bookName(edition.label, volume),
                    title: book.title,
                    holds: edition.volumes,
                  }
                : undefined
            }
          />
        )}

        {/* one country's prices at a time */}
        <View className="gap-3">
          <View className="flex-row items-end justify-between gap-3">
            <H2>{inCanada ? "Prices in Canada" : "Prices"}</H2>
            <View className="w-[160px]">
              <CountrySwitch />
            </View>
          </View>
          {/* when they were checked, on its own line under the heading */}
          <View className="-mt-1 flex-row">
            {inCanada ? (
              canada?.checkedAt ? (
                <Text className="font-body text-[13px] text-muted">
                  checked {timeAgo(canada.checkedAt)}
                </Text>
              ) : null
            ) : page.refreshing ? (
              <Text className="font-body text-[13px] text-muted">
                checking stores…
              </Text>
            ) : (
              <PriceAges offers={offers} checkedAt={checkedAt} />
            )}
          </View>
          {inCanada ? (
            <>
              {preorder ? (
                <View className="gap-2">
                  <Text className="font-body text-[15px] text-ink">
                    <Text className="font-body-semibold">Preorder</Text>: out{" "}
                    <Text className="font-body-semibold">
                      {releaseDay(preorder)}
                    </Text>
                    . Order it now and it ships on release day.
                  </Text>
                  {caPreorderAt.length ? (
                    <StoreButtons links={caPreorderAt} lead />
                  ) : null}
                  {caOffers.length ? (
                    <OfferList offers={caOffers} formatPrice={formatCents} />
                  ) : null}
                </View>
              ) : !canada ? (
                <Text className="font-body text-[14px] text-ink-soft">
                  Checking Canadian stores…
                </Text>
              ) : caOffers.length ? (
                <OfferList offers={caOffers} formatPrice={formatCents} />
              ) : (
                <Text className="font-body text-[14px] text-ink-soft">
                  {WHY_NONE_CA[canada.status]}
                </Text>
              )}
              <BoxSetNote offers={caAllOffers} onOpen={openSeries} />
              {caHiddenEbooks > 0 ? (
                <Text className="font-body text-[13px] text-muted">
                  {caHiddenEbooks} ebook{" "}
                  {caHiddenEbooks === 1 ? "price" : "prices"} hidden.
                </Text>
              ) : null}
              {caOthers.length ? (
                <View className="gap-2">
                  <Text className="font-body-medium text-[14px] text-ink-soft">
                    {preorder
                      ? "Or preorder at:"
                      : caOffers.length
                        ? "More places to look:"
                        : "Check price at:"}
                  </Text>
                  <StoreButtons links={caOthers} />
                </View>
              ) : null}
              {caLinks.some((s) => s.affiliate) ? (
                <Text className="font-body text-[12px] text-muted">
                  {AFFILIATE_NOTE}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {preorder ? (
                <View className="gap-3">
                  <View className="gap-1 rounded-[14px] bg-accent-wash px-4 py-3.5">
                    <Text className="self-start bg-accent px-1.5 pt-0.5 font-brand pr-[4px] text-[13px] tracking-[1px] text-on-accent uppercase">
                      Preorder
                      {"\u00A0"}
                    </Text>
                    <Text className="font-display text-[20px] text-ink">
                      Out {releaseDay(preorder)}
                    </Text>
                    <Text className="font-body text-[14px] text-ink-soft">
                      Order now, it ships on release day.
                    </Text>
                  </View>
                  {preorderAt.length ? (
                    <StoreButtons links={preorderAt} lead />
                  ) : null}
                  {offers.length ? (
                    <OfferList offers={offers} formatPrice={formatCents} />
                  ) : null}
                </View>
              ) : offers.length ? (
                <OfferList offers={offers} formatPrice={formatCents} />
              ) : (
                // no prices to list: the same box the prices come in, so the
                // page keeps its shape
                <View className="rounded-[14px] border border-line-soft bg-card px-4 py-3.5">
                  <Text className="font-body text-[14.5px] leading-[21px] text-ink-soft">
                    {page.refreshing
                      ? "Checking stores for prices…"
                      : liveSources.length
                        ? "No live prices for this one right now. It's often still in stock, so check the store links below for Amazon, Barnes & Noble and more."
                        : "Live prices aren't switched on yet. Check the store links below for now."}
                  </Text>
                </View>
              )}
              <BoxSetNote offers={allOffers} onOpen={openSeries} />
              {hiddenEbooks > 0 ? (
                <Text className="font-body text-[13px] text-muted">
                  {hiddenEbooks} ebook {hiddenEbooks === 1 ? "price" : "prices"}{" "}
                  hidden.{" "}
                  <Text
                    className="font-body-medium text-ink underline"
                    onPress={() =>
                      router.push({
                        pathname: "/settings",
                        params: { tab: "prices" },
                      })
                    }
                  >
                    Change in settings
                  </Text>
                </Text>
              ) : null}
              {otherStores.length ? (
                <View className="gap-2">
                  <Text className="font-body-medium text-[14px] text-ink-soft">
                    {otherStoresTitle}
                  </Text>
                  <StoreButtons links={otherStores} />
                </View>
              ) : null}
              {storeLinks.some((s) => s.affiliate) ? (
                <Text className="font-body text-[12px] text-muted">
                  {AFFILIATE_NOTE}
                </Text>
              ) : null}
            </>
          )}
        </View>

        {history ? (
          <View className="gap-3">
            <Tap
              onPress={() => setHistoryOpen(!historyOpen)}
              accessibilityRole="button"
              accessibilityState={{ expanded: historyOpen }}
              className="flex-row items-start gap-3"
            >
              <H2>Price history</H2>
              {/* level with the heading's words, not the rule under them */}
              <Text className="pt-[9px] font-mono text-[12.5px] text-muted">
                lowest {formatCents(lowestInHistory)}
              </Text>
              <View
                className="ml-auto h-[30px] justify-center"
                style={{
                  transform: [{ rotate: historyOpen ? "180deg" : "0deg" }],
                }}
              >
                <ChevronDownIcon color={c.muted} width={20} height={20} />
              </View>
            </Tap>
            {historyOpen ? (
              <View className="gap-3">
                {history.kinds.map((k) => (
                  <View
                    key={k.kind}
                    className="gap-3 rounded-[14px] border border-line-soft bg-card p-4"
                  >
                    <Text
                      className={`self-start px-1.5 pt-0.5 font-brand pr-[4px] text-[13px] tracking-[1px] uppercase ${k.kind === "new" ? "bg-award-new text-on-award-new" : "bg-award-market text-stamp-ink"}`}
                    >
                      {KIND_LABEL[k.kind] ?? k.kind}
                      {"\u00A0"}
                    </Text>
                    <View className="flex-row gap-3">
                      {(
                        [
                          ["Lowest", k.lowCents, k.lowStore],
                          ["Highest", k.highCents, k.highStore],
                          ["Median", k.medianCents, `${k.listings} seen`],
                        ] as const
                      ).map(([label, cents, note]) => (
                        <View key={label} className="flex-1 gap-0.5">
                          <Text className="font-body text-[12.5px] text-muted">
                            {label}
                          </Text>
                          <Text className="font-mono-medium text-[17px] text-ink">
                            {formatCents(cents)}
                          </Text>
                          <Text
                            numberOfLines={1}
                            className="font-body text-[12px] text-ink-soft"
                          >
                            {note}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
                <Text className="font-body text-[12.5px] text-muted">
                  Across {history.checks} check{history.checks === 1 ? "" : "s"}
                  , {shortDate(history.since)}
                  {history.checks > 1
                    ? ` to ${shortDate(history.lastSeen)}`
                    : ""}
                </Text>
              </View>
            ) : null}
          </View>
        ) : null}

        {series.info ? (
          <View className="gap-2">
            <H2>About this series</H2>
            <SeriesFacts info={series.info} />
          </View>
        ) : null}

        {reviews.data && !unknownBook ? (
          <VolumeReviews
            isbn13={book.isbn13}
            volumeLabel={volume != null ? `vol. ${volume}` : "this book"}
            data={reviews.data}
            reload={reviews.reload}
          />
        ) : null}

        {nearby.length ? (
          <View className="gap-2">
            <View className="flex-row items-end justify-between">
              <H2>From the same series</H2>
              <Tap onPress={openSeries} hitSlop={6}>
                <Text className="font-body-medium text-[14px] text-ink border-b pb-[2px] border-ink self-start">
                  See them all
                </Text>
              </Tap>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
            >
              {nearby.map((v) => (
                <VolumeCard
                  key={v.isbn13}
                  lightNovel={shownBook.lightNovel}
                  {...v}
                  title={
                    v.inBook ? `Book ${v.inBook.book}` : `Vol. ${v.volume}`
                  }
                  seriesCoverUrl={series.info?.coverUrl}
                  priceCents={v.knownPriceCents}
                  width={104}
                />
              ))}
            </ScrollView>
          </View>
        ) : null}
        {storeLinks.some((s) => s.store === "Amazon" && s.affiliate) ? (
          <Text className="font-body text-[12px] text-muted">
            As an Amazon Associate I earn from qualifying purchases.
          </Text>
        ) : null}
      </ScrollView>
    </PullPage>,
  );
}
