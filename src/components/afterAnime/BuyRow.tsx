// The volume to buy after a season (the web's pages/AfterAnime/BuyRow.tsx):
// its cover, why this one, the best saved price and the store, or the way
// to its prices when none is saved
import { coverAt } from "@/lib/coverAt";
import LightNovelBand from "@/components/LightNovelBand";
import Tap from "@/components/Tap";
import { openOutside } from "@/lib/openOutside";
import { Image } from "expo-image";
import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { CoverFallback } from "@/components/prices/VolumeCard";
import type { BuyOffer, UsedOffer } from "@/core/lib/afterAnime";
import { formatCents, novelParts, timeAgo } from "@/core/lib/prices";
import type { SeriesVolume } from "@/core/lib/types";
import { bookShort, bookWords } from "@/core/pages/AfterAnime/bookFor";

const COVER_WIDTH = 80;

export default function BuyRow({
  volume,
  why,
  book,
  offer,
  used,
  seriesCoverUrl,
  lead = false,
  chapters = null,
}: {
  volume: number;
  why: string;
  book: SeriesVolume;
  offer: BuyOffer | null;
  used: UsedOffer | null;
  seriesCoverUrl: string | null;
  // the page's main answer: bigger words
  lead?: boolean;
  // "Chapters 53–61 are in this volume.", under the volume's name
  chapters?: string | null;
}) {
  const words = bookWords(book, volume);
  const heading = words[0]!.toUpperCase() + words.slice(1);
  const short = bookShort(book, volume);
  const main = offer ?? used;
  const openPrices = () => router.push(`/prices/${book.isbn13.trim()}`);
  const cheaperUsed = offer && used && used.cents < offer.cents ? used : null;
  const cheaperElsewhere =
    offer && book.knownPriceCents !== null && book.knownPriceCents < offer.cents
      ? ` (from ${formatCents(book.knownPriceCents)})`
      : "";
  return (
    <View className="rounded-[4px] border-[1.5px] border-line bg-card p-3">
      <View className="flex-row gap-3">
        <Tap
          onPress={openPrices}
          accessibilityLabel={`${heading} prices`}
          style={{ width: COVER_WIDTH, aspectRatio: 2 / 3 }}
        >
          <CoverFallback
            number={volume}
            seriesCoverUrl={seriesCoverUrl}
            width={COVER_WIDTH}
            numbered
          />
          {book.coverUrl ? (
            <Image
              source={{ uri: coverAt(book.coverUrl, COVER_WIDTH) }}
              style={{ width: COVER_WIDTH, aspectRatio: 2 / 3 }}
              contentFit="cover"
            />
          ) : null}
          {novelParts(book.title).lightNovel ? (
            <LightNovelBand width={COVER_WIDTH} />
          ) : null}
        </Tap>
        <View className="min-w-0 flex-1 gap-1.5">
          <Text
            className={`font-display text-ink ${lead ? "text-[20px]" : "text-[17px]"}`}
          >
            {heading}
          </Text>
          {/* which chapters it holds when that's known, else why this one */}
          <Text className="font-body text-[13.5px] leading-[19px] text-ink-soft">
            {chapters ?? why}
          </Text>
          {main ? (
            <Text className="font-body text-[14px] text-ink">
              <Text className="font-mono-medium text-[16px]">
                {formatCents(main.cents)}
              </Text>{" "}
              {offer ? "new" : "used"} at {main.store}
            </Text>
          ) : null}
          <View className="flex-row flex-wrap items-center gap-2 pt-1">
            {main ? (
              <Button
                kind="primary"
                small
                label={`Buy${offer ? "" : " used"} at ${main.store}`}
                onPress={() => openOutside(main.url)}
              />
            ) : (
              <Button
                small
                label={`Check ${short} prices`}
                onPress={openPrices}
              />
            )}
          </View>
          {main ? (
            <View className="gap-0.5">
              {cheaperUsed ? (
                <Text
                  onPress={() => openOutside(cheaperUsed.url)}
                  className="font-body-medium text-[13.5px] text-ink underline"
                >
                  Used, {formatCents(cheaperUsed.cents)} at {cheaperUsed.store}
                </Text>
              ) : null}
              <Text
                onPress={openPrices}
                className="font-body-medium text-[13.5px] text-ink underline"
              >
                Compare all stores{cheaperElsewhere}
              </Text>
              <Text className="font-mono text-[12px] text-muted">
                Price checked {timeAgo(main.checkedAt)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}
