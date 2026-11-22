// Where they are in a series, as the web's pages/Details/ReadingPlace.tsx.
// One of four things shows:
//   finished          "Read all the way through."
//   on To read        "Not started yet." and a Start reading button
//   no place saved    a choice between tracking chapters and volumes
//   otherwise         the chapter counter, the volume counter, or both
// Which counters show is core lib/reading tracksOf
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import {
  insideOf,
  readPastTheBooks,
  slotsRead,
  volumeReadAfter,
  type EditionShelf,
} from "@/core/lib/editionShelf";
import { tracksOf, type TrackBy } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import Button from "./Button";
import ReadingStepper from "./ReadingStepper";

// a change to how the series is read, saved by the page
export type ReadingChange = {
  byVolume?: boolean;
  readVolume?: number;
  edition?: string;
};

const Line = ({ children }: { children: React.ReactNode }) => (
  <Text className="font-display-regular text-[18px] text-ink">{children}</Text>
);

export default function ReadingPlace({
  manga,
  finished,
  planned,
  trackBy,
  highestOwned,
  volumeSets,
  newestChapter = null,
  onStart,
  onChange,
  onPlaceSaved,
  edition = null,
}: {
  manga: Manga;
  finished: boolean;
  planned: boolean;
  trackBy: TrackBy;
  highestOwned: number;
  // changes when the read volume is set from outside its counter, so the
  // counter starts over from the saved number
  volumeSets: number;
  newestChapter?: number | null;
  onStart: () => void;
  onChange: (change: ReadingChange) => void;
  onPlaceSaved: (place: { bookmark?: number; readVolume?: number }) => void;
  // the shelf seen through the edition they collect: the volume counter
  // then counts its books. Null for single volumes
  edition?: EditionShelf | null;
}) {
  // a collector of the books who asked for the chapter counter after all
  const [chaptersShown, setChaptersShown] = useState(false);
  // with both kept, which counter is showing: the chapter if they have
  // one saved, else the volume
  const [shown, setShown] = useState<"chapters" | "volumes">(
    manga.bookmark ? "chapters" : "volumes",
  );
  const booksRead = edition
    ? slotsRead(edition.slots, manga.readVolume ?? null)
    : 0;
  // counted in the edition's books, unless they've read past its last one
  const inBooks =
    edition != null &&
    !readPastTheBooks(edition.slots, manga.readVolume ?? null);

  if (finished) return <Line>Read all the way through.</Line>;

  if (planned)
    return (
      <View className="flex-row flex-wrap items-center gap-3">
        <Line>Not started yet.</Line>
        <Button label="Start reading" kind="primary" small onPress={onStart} />
      </View>
    );

  const nothingSaved =
    trackBy === "series" && !manga.byVolume && !manga.bookmark;
  if (nothingSaved && !chaptersShown)
    return (
      <View className="flex-row flex-wrap items-center gap-3">
        <Line>Keep my place by</Line>
        <View className="flex-row gap-2">
          <Button
            label="Chapter"
            small
            onPress={() => setChaptersShown(true)}
          />
          <Button
            label="Volume"
            small
            onPress={() => onChange({ byVolume: true })}
          />
        </View>
      </View>
    );

  const tracks = tracksOf(manga, trackBy);
  const ownsPastWhatTheyveRead =
    tracks.volumes && highestOwned > (manga.readVolume ?? 0);
  // both kept: one counter shows at a time, the other a tap away
  const both = tracks.chapters && tracks.volumes;
  const showChapters = tracks.chapters && (!both || shown === "chapters");
  const showVolumes = tracks.volumes && (!both || shown === "volumes");
  return (
    <View className="gap-3">
      {showChapters ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
          <Line>Read up to ch.</Line>
          <ReadingStepper
            key={`${manga.id}-${volumeSets}`}
            mangaId={manga.id}
            value={manga.bookmark}
            newest={newestChapter}
            onSaved={(chapter) => onPlaceSaved({ bookmark: chapter })}
          />
        </View>
      ) : null}
      {showVolumes && !inBooks ? (
        <View className="flex-row flex-wrap items-center gap-x-3 gap-y-2">
          <Line>Read up to vol.</Line>
          <ReadingStepper
            key={`${manga.id}-volume-${volumeSets}`}
            mangaId={manga.id}
            unit="volume"
            value={manga.readVolume ?? null}
            onSaved={(volume) => onPlaceSaved({ readVolume: volume })}
          />
        </View>
      ) : null}
      {showVolumes && inBooks && edition ? (
        // the same place counted in the edition's books: "Definitive 4" is
        // saved as the last volume that book holds
        // the counter has its note under it here: the label is level with
        // the counter, not with the two together
        <View className="flex-row flex-wrap items-start gap-x-3 gap-y-2">
          <View className="h-11 justify-center">
            <Line>Read up to {edition.line.label}</Line>
          </View>
          <ReadingStepper
            key={`${manga.id}-${edition.line.key}-${volumeSets}`}
            mangaId={manga.id}
            unit="volume"
            value={booksRead}
            books={{
              count: edition.slots.length,
              volumeAfter: (count) => volumeReadAfter(edition.slots, count),
              inside: (count) => {
                const book = edition.slots[count - 1];
                return book ? insideOf(book) : "";
              },
              savedVolume: manga.readVolume ?? null,
            }}
            onSaved={(count) =>
              onPlaceSaved({
                readVolume: volumeReadAfter(edition.slots, count),
              })
            }
          />
        </View>
      ) : null}
      <View className="flex-row flex-wrap gap-x-5 gap-y-2">
        {both ? (
          <Pressable
            onPress={() =>
              setShown(shown === "chapters" ? "volumes" : "chapters")
            }
            hitSlop={6}
          >
            <Text className="font-body-semibold text-[14.5px] text-accent">
              {shown === "chapters" ? "Show volume" : "Show chapter"}
            </Text>
          </Pressable>
        ) : null}
        {/* each series its own way: the other one is a tap away */}
        {trackBy === "series" ? (
          <Pressable
            onPress={() => onChange({ byVolume: !manga.byVolume })}
            hitSlop={6}
          >
            <Text className="font-body-semibold text-[14.5px] text-accent">
              {manga.byVolume
                ? "Track chapters instead"
                : "Track volumes instead"}
            </Text>
          </Pressable>
        ) : null}
        {ownsPastWhatTheyveRead ? (
          <Pressable
            onPress={() => onChange({ readVolume: highestOwned })}
            hitSlop={6}
          >
            <Text className="font-body-semibold text-[14.5px] text-ink-soft">
              Read everything I own
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
