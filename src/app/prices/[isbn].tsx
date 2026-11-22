// A volume's prices, as the web's pages/Prices/PriceVolume.tsx: its cover,
// title, what it is, where it stands on their shelf (ShelfAction), the
// prices (stored ones first, then a live check when it's worth one; or
// Canada's), the box-set note, more places to look, the price history,
// about the series, readers' reviews, and the volumes beside it. Every rule
// is the web's (core volumePageRules, offerLabels, useVolumeLoad)
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import Mascot from "@/components/Mascot";
import OfferList from "@/components/OfferList";
import StoreButtons from "@/components/prices/StoreButtons";
import CountrySwitch from "@/components/prices/CountrySwitch";
import DealsStrip from "@/components/prices/DealsStrip";
import PriceAges from "@/components/prices/PriceAges";
import SeriesFacts from "@/components/prices/SeriesFacts";
import ShelfAction from "@/components/prices/ShelfAction";
import VolumeCard from "@/components/prices/VolumeCard";
import VolumeReviews from "@/components/prices/VolumeReviews";
import { BoxSetNote } from "@/components/prices/BoxSets";
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

const Safe = withUniwind(SafeAreaView);
// a history kind's name: the offer labels' words for new print and ebooks
const KIND_LABEL: Record<string, string> = {
  new: TYPE_LABEL.newPrint.label,
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

const H2 = ({ children }: { children: string }) => (
  <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
    {children}
  </Text>
);
export default function PriceVolumeScreen() {
  const { isbn } = useLocalSearchParams<{ isbn: string }>();
  const c = useColors();
  const country = usePrefs((s) => (s.prefs.country === "ca" ? "ca" : "us"));
  const hideEbooks = usePrefs((s) => s.prefs.hideEbooks === "yes");
  const page = useVolumeLoad(isbn, country);
  const loadedBook = page.data?.book ?? null;
  const canada = useCanadaPrices(
    country === "ca" ? (loadedBook?.isbn13 ?? null) : null,
  );
  const reviews = useVolumeReviews(loadedBook?.isbn13 ?? null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const frame = (title: string, body: React.ReactNode) => (
    <Safe edges={["top"]} className="flex-1 bg-paper">
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
          {title}
        </Text>
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
  if (page.loading) return frame("Prices", null);
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
    <ScrollView contentContainerClassName="gap-6 px-4 pt-4 pb-16">
      <DealsStrip />
      <View className="flex-row gap-3.5">
        <View
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
            <Text className="font-brand pr-1 text-[40px] text-ink">
              {volume ?? "?"}
            </Text>
          ) : null}
          {book.coverUrl ? (
            <Image
              source={{ uri: coverSrc(book.coverUrl) }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
            />
          ) : null}
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
              <Text className="rounded-[2px] bg-accent px-1.5 font-brand pr-1 text-[12px] tracking-[1px] text-on-accent uppercase">
                Preorder · out {releaseDay(preorder)}
              </Text>
            ) : null}
            {volume != null ? (
              <Text className="rounded-[2px] border-[1.5px] border-line px-1.5 font-brand pr-1 text-[12px] tracking-[1px] text-ink uppercase">
                Vol. {volume}
              </Text>
            ) : null}
            {inBook ? (
              <Text className="rounded-[2px] border-[1.5px] border-line-soft px-1.5 font-body-medium text-[12px] text-ink-soft">
                Vols. {inBook.from}–{inBook.to} in one book
              </Text>
            ) : null}
            {shownBook.lightNovel ? (
              <Text className="rounded-[2px] border-[1.5px] border-line-soft px-1.5 font-body-medium text-[12px] text-ink-soft">
                Light novel
              </Text>
            ) : null}
          </View>
          <Pressable onPress={openSeries} hitSlop={4}>
            <Text className="font-body text-[14px] text-ink-soft">
              Part of{" "}
              <Text className="font-body-semibold text-ink underline">
                {shownSeries}
              </Text>
            </Text>
          </Pressable>
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
        <View className="flex-row items-center justify-between gap-3">
          <H2>{inCanada ? "Prices in Canada" : "Prices"}</H2>
          <View className="flex-row items-center gap-3">
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
            <View className="w-[132px]">
              <CountrySwitch />
            </View>
          </View>
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
              <View className="gap-2">
                <Text className="font-body text-[15px] text-ink">
                  <Text className="font-body-semibold">Preorder</Text>: out{" "}
                  <Text className="font-body-semibold">
                    {releaseDay(preorder)}
                  </Text>
                  . Order it now and it ships on release day.
                </Text>
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
              <Text className="font-body text-[14px] text-ink-soft">
                {page.refreshing
                  ? "Checking stores for prices…"
                  : liveSources.length
                    ? "No live prices for this one right now. It's often still in stock, so check the store links below for Amazon, Barnes & Noble and more."
                    : "Live prices aren't switched on yet. Check the store links below for now."}
              </Text>
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
        <View className="gap-2 border-y border-dashed border-line-soft py-2">
          <Pressable
            onPress={() => setHistoryOpen(!historyOpen)}
            accessibilityState={{ expanded: historyOpen }}
            className="flex-row items-center gap-3"
          >
            <Text className="font-body-semibold text-[15px] text-ink">
              Price history
            </Text>
            <Text className="font-mono text-[12.5px] text-muted">
              lowest {formatCents(lowestInHistory)}
            </Text>
            <View
              className="ml-auto"
              style={{
                transform: [{ rotate: historyOpen ? "180deg" : "0deg" }],
              }}
            >
              <ChevronDownIcon color={c.muted} width={18} height={18} />
            </View>
          </Pressable>
          {historyOpen ? (
            <View className="gap-3 pb-1">
              {history.kinds.map((k) => (
                <View key={k.kind} className="gap-1">
                  <Text className="font-mono text-[11.5px] tracking-[1px] text-muted uppercase">
                    {KIND_LABEL[k.kind] ?? k.kind}
                  </Text>
                  <View className="flex-row gap-3">
                    {[
                      ["Lowest", k.lowCents, k.lowStore],
                      ["Highest", k.highCents, k.highStore],
                      [
                        "Median",
                        k.medianCents,
                        `${k.listings} price${k.listings === 1 ? "" : "s"} seen`,
                      ],
                    ].map(([label, cents, note]) => (
                      <View key={String(label)} className="flex-1">
                        <Text className="font-body text-[12px] text-muted">
                          {label}
                        </Text>
                        <Text className="font-brand pr-1 text-[18px] text-ink">
                          {formatCents(cents as number)}
                        </Text>
                        <Text
                          numberOfLines={1}
                          className="font-mono text-[11px] text-muted"
                        >
                          {note}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
              <Text className="font-body text-[12.5px] text-muted">
                Every in-stock price at the stores we check, across{" "}
                {history.checks} check{history.checks === 1 ? "" : "s"},{" "}
                {shortDate(history.since)}
                {history.checks > 1 ? ` to ${shortDate(history.lastSeen)}` : ""}
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
          <View className="flex-row items-baseline justify-between">
            <H2>From the same series</H2>
            <Pressable onPress={openSeries} hitSlop={6}>
              <Text className="font-body-medium text-[14px] text-ink underline">
                See them all
              </Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
          >
            {nearby.map((v) => (
              <VolumeCard
                key={v.isbn13}
                {...v}
                title={v.inBook ? `Book ${v.inBook.book}` : `Vol. ${v.volume}`}
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
    </ScrollView>,
  );
}
