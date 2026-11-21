// One series on the shelf, as the Android app's row (web components/mangaCard
// MangaCard.tsx, its rows): cover, name, their stars under it, their place
// when the right side doesn't say it, the genre, and on the right how far
// through they are. The words come from the web's own rules (core cardText,
// reading), so the two apps always say the same
import SeriesCover from "@/components/SeriesCover";
import { Link } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { progressOf, rowKindLine } from "@/core/components/mangaCard/cardText";
import { ownedOf } from "@/core/lib/ownedVolumes";
import { placeText, tracksOf, type TrackBy } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import StarRating from "./StarRating";

export default function ShelfRow({
  manga,
  trackBy,
  latestChapter,
  latestVolume,
}: {
  manga: Manga;
  trackBy: TrackBy;
  latestChapter?: number | null;
  latestVolume?: number | null;
}) {
  const { unit, reading, knownTotal } = progressOf(
    manga,
    tracksOf(manga, trackBy),
    latestChapter ?? manga.latestChapter,
    latestVolume,
  );
  // the right side says "ch. 50 of 101" with its bar: the place isn't said twice
  const progressSaysPlace = !manga.status && reading > 0 && knownTotal != null;
  const place = placeText(manga, trackBy);
  const rowLine = progressSaysPlace ? null : manga.planned ? "to read" : place;
  const kindLine = rowKindLine(manga);
  const rating = Number(manga.rating) || 0;

  return (
    <Link href={`/details/${manga.id}`} asChild>
      <Pressable className="flex-row items-center gap-3 py-1.5 active:opacity-70">
        <SeriesCover
          name={manga.name}
          lightNovel={manga.lightNovel}
          url={manga.image}
          width={44}
        />
        <View className="min-w-0 flex-1 gap-[2px]">
          <Text numberOfLines={1} className="font-display text-[17px] text-ink">
            {manga.name}
          </Text>
          {rating > 0 && <StarRating value={rating} />}
          {rowLine ? (
            <Text
              numberOfLines={1}
              className="font-mono-medium text-[13.5px] text-ink-soft"
            >
              {rowLine}
            </Text>
          ) : null}
          {kindLine ? (
            <Text
              numberOfLines={1}
              className="font-mono text-[12.5px] text-muted"
            >
              {kindLine}
            </Text>
          ) : null}
        </View>
        <View className="w-[120px] items-end gap-1 pr-2">
          <RowProgress
            finished={manga.status}
            ownedCount={ownedOf(manga).length}
            unit={unit}
            reading={reading}
            knownTotal={knownTotal}
          />
        </View>
      </Pressable>
    </Link>
  );
}

// the right of a row: "Finished", how many books, or how far through with a
// bar under it (web MangaCard RowProgress)
function RowProgress({
  finished,
  ownedCount,
  unit,
  reading,
  knownTotal,
}: {
  finished: boolean;
  ownedCount: number;
  unit: "ch." | "vol.";
  reading: number;
  knownTotal: number | null;
}) {
  const text = "font-mono text-[12px] text-ink-soft text-right";
  if (finished) return <Text className={text}>Finished</Text>;
  if (!reading && ownedCount)
    return (
      <Text className={text}>
        {ownedCount} {ownedCount === 1 ? "vol" : "vols"}
      </Text>
    );
  if (knownTotal == null || reading <= 0) return null;
  const percent = knownTotal ? Math.min((reading / knownTotal) * 100, 100) : 0;
  return (
    <>
      <Text className={text}>
        {unit} {reading} of {knownTotal}
      </Text>
      <View className="h-1.5 w-full overflow-hidden rounded-full border border-line bg-card">
        <View className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </View>
    </>
  );
}
