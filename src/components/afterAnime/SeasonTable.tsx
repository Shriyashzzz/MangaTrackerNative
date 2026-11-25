// Every season at a glance (the web's SeasonTable.tsx), for a long show: what
// they watched, the chapter to start at, and the volume to buy, a row each
import { useNeedsConnection } from "@/lib/needsConnection";
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { buyVolume, tableRow, type AnimeStop } from "@/core/lib/afterAnimeText";
import type { SeriesVolume } from "@/core/lib/types";
import { bookFor } from "@/core/pages/AfterAnime/bookFor";

const cell = "font-body text-[14px] text-ink";
const linkClass = "font-body-semibold text-[14px] text-ink underline";

function VolumeCell({
  stop,
  seriesName,
  volumes,
}: {
  stop: AnimeStop;
  seriesName: string;
  volumes: SeriesVolume[] | null;
}) {
  const { link } = useNeedsConnection();
  if (stop.coversAll)
    return (
      <Text accessibilityLabel="Nothing to buy next" className={cell}>
        —
      </Text>
    );
  const volume = buyVolume(stop);
  if (volume === null)
    return (
      <Text
        {...link(() =>
          router.push({
            pathname: "/prices/series",
            params: { name: seriesName },
          }),
        )}
        className={linkClass}
      >
        See volumes
      </Text>
    );
  const book = volumes ? bookFor(volumes, volume) : null;
  if (!book) return <Text className={cell}>{volume}</Text>;
  return (
    <Text
      {...link(() => router.push(`/prices/${book.isbn13.trim()}`))}
      accessibilityLabel={`${book.inBook ? `Book ${book.inBook.book}` : `Volume ${volume}`} prices`}
      className={linkClass}
    >
      {book.inBook ? `Book ${book.inBook.book}` : volume}
    </Text>
  );
}

export default function SeasonTable({
  stops,
  seriesName,
  volumes,
}: {
  stops: AnimeStop[];
  seriesName: string;
  volumes: SeriesVolume[] | null;
}) {
  const head = "font-mono text-[11px] tracking-[1px] text-muted uppercase";
  return (
    <View
      accessibilityLabel="The chapter to start at and the volume to buy, by the last season you watched"
      className="rounded-[4px] border-[1.5px] border-line-soft"
    >
      <View className="flex-row gap-2 border-b border-line-soft px-3 py-2">
        <Text className={`flex-[1.4] ${head}`}>You watched</Text>
        <Text className={`flex-1 ${head}`}>Start at chapter</Text>
        <Text className={`flex-1 ${head}`}>Buy volume</Text>
      </View>
      {stops.map((stop, i) => {
        const row = tableRow(stop);
        return (
          <Tap
            feel="none"
            key={stop.label}
            className={`flex-row items-center gap-2 px-3 py-2.5 ${i ? "border-t border-dotted border-line-soft" : ""}`}
          >
            <Text
              className={`flex-[1.4] font-body-semibold text-[14px] text-ink`}
            >
              {row.watched}
            </Text>
            <Text className={`flex-1 ${cell}`}>{row.start || "Not known"}</Text>
            <View className="flex-1">
              <VolumeCell
                stop={stop}
                seriesName={seriesName}
                volumes={volumes}
              />
            </View>
          </Tap>
        );
      })}
    </View>
  );
}
