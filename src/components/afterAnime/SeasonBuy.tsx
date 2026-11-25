// What to buy after a season (the web's pages/AfterAnime/SeasonBuy.tsx): the
// volume's BuyRow, the one after it for someone who has it, or why there's
// nothing to point at yet, with the way to every volume
import { useNeedsConnection } from "@/lib/needsConnection";
import { router } from "expo-router";
import { Text, View } from "react-native";
import type { VolumeOffers } from "@/core/lib/afterAnime";
import {
  buyVolume,
  chaptersInVolume,
  keepNumbers,
  volumeAfter,
  whyThisVolume,
  type AnimeStop,
} from "@/core/lib/afterAnimeText";
import type { SeriesVolume } from "@/core/lib/types";
import { bookAfter, bookFor, bookShort } from "@/core/pages/AfterAnime/bookFor";
import { ALL_VOLUMES } from "@/core/pages/AfterAnime/words";
import BuyRow from "./BuyRow";

const Line = ({ children }: { children: string }) => (
  <Text className="font-body text-[14.5px] leading-[21px] text-ink-soft">
    {children}
  </Text>
);

export function AllVolumesLink({ seriesName }: { seriesName: string }) {
  const { link } = useNeedsConnection();
  return (
    <Text
      {...link(() =>
        router.push({
          pathname: "/prices/series",
          params: { name: seriesName },
        }),
      )}
      className="self-start font-body-semibold text-[15px] text-ink underline"
    >
      {ALL_VOLUMES}
    </Text>
  );
}

export default function SeasonBuy({
  stop,
  seriesName,
  volumes,
  offers,
  seriesCoverUrl,
  lead = false,
}: {
  stop: AnimeStop;
  seriesName: string;
  // the series' English books; null while they load
  volumes: SeriesVolume[] | null;
  offers: Record<string, VolumeOffers>;
  seriesCoverUrl: string | null;
  lead?: boolean;
}) {
  const { link } = useNeedsConnection();
  const toBuy = buyVolume(stop);
  const book = toBuy !== null && volumes ? bookFor(volumes, toBuy) : null;
  const after = volumeAfter(stop);
  const next =
    after !== null && toBuy !== null && volumes
      ? bookAfter(volumes, toBuy)
      : null;
  const notListed = toBuy !== null && volumes !== null && !book;
  const volumeUnknown =
    toBuy === null && !stop.coversAll && stop.nextChapter !== null;

  return (
    <View className="gap-2">
      {toBuy !== null && volumes === null ? (
        <View className="h-[132px] rounded-[4px] bg-paper-2" />
      ) : null}
      {book ? (
        <BuyRow
          volume={toBuy!}
          why={keepNumbers(whyThisVolume(stop))}
          book={book}
          offer={offers[book.isbn13.trim()]?.new ?? null}
          used={offers[book.isbn13.trim()]?.used ?? null}
          seriesCoverUrl={seriesCoverUrl}
          lead={lead}
          chapters={chaptersInVolume(stop)}
        />
      ) : null}
      {/* for someone who already has the pick */}
      {book && next ? (
        <Text className="font-body text-[14px] text-ink-soft">
          Already have{" "}
          {book.inBook ? bookShort(book, toBuy!) : `volume ${toBuy}`}?{" "}
          <Text
            {...link(() => router.push(`/prices/${next.isbn13.trim()}`))}
            className="font-body-semibold text-ink underline"
          >
            {next.inBook ? bookShort(next, after!) : `Volume ${after}`} is next
          </Text>
        </Text>
      ) : null}
      {notListed ? (
        <>
          <Line>{`Volume ${toBuy} isn't out in English yet.`}</Line>
          <AllVolumesLink seriesName={seriesName} />
        </>
      ) : null}
      {volumeUnknown ? (
        <>
          <Line>{`We don't know yet which volume has chapter ${stop.nextChapter}.`}</Line>
          <AllVolumesLink seriesName={seriesName} />
        </>
      ) : null}
      {/* the anime told all of it: nothing to carry on with, but the manga
          is still there to own */}
      {stop.coversAll ? <AllVolumesLink seriesName={seriesName} /> : null}
    </View>
  );
}
