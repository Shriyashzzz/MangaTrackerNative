// A series' shelf, wherever it's shown (the series page, an opened series on
// the Volumes tab): what they own, the edition they collect, how many books
// the shelf has, saving a tap or a slide, and a slide's Undo. One hook, so the
// two places can't behave differently, as the web's ShelfBox serves both.
// The rules are the web's own (core pages/Details hooks, core editionShelf)
import {
  useCallback,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { StripSlots } from "@/components/VolumeStrip";
import { placeOnShelf } from "@/core/lib/chapterVolumes";
import { todayOf } from "@/core/lib/editionNews";
import {
  ownedCaption,
  placeInSlots,
  shareOwned,
  slotsIn,
  slotsOf,
  spineOf,
  toggleSlot,
  volumesAfterPaint,
} from "@/core/lib/editionShelf";
import { ownedOf, ownedVolumes as ownedFrom } from "@/core/lib/ownedVolumes";
import { priceName } from "@/core/lib/prices";
import { tracksOf } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import { shelfSize } from "@/core/pages/Details/releaseNews";
import { useBuyOptions } from "@/core/pages/Details/useBuyOptions";
import { useEditions } from "@/core/pages/Details/useEditions";
import { useOwnedVolumes } from "@/core/pages/Details/useOwnedVolumes";
import { usePrefs } from "@/store/prefs";

// what a slide did, for its Undo note: "6 volumes marked yours"
function slideText(before: number[], now: number[]) {
  const added = now.filter((v) => !before.includes(v)).length;
  const removed = before.filter((v) => !now.includes(v)).length;
  const volumes = (n: number) => `${n} ${n === 1 ? "volume" : "volumes"}`;
  if (added && !removed) return `${volumes(added)} marked yours`;
  if (removed && !added) return `${volumes(removed)} taken off your shelf`;
  return `${volumes(added + removed)} changed`;
}

// where it's shown can say more than the series page knows: the newest out
// from the shelf's release check, and the book the strip opens at (a tap on
// a Volumes row's bar)
type Options = {
  latest?: number | null;
  opensAt?: number | null;
  // ordered and on their way: Buy next and the edition's plan go past them
  ordered?: number[];
  // with none owned: the volume their next chapter is in (the series page
  // knows it from the release check)
  readingFrom?: number | null;
  // where each volume starts, by chapter, for their place on the shelf
  volumeStarts?: { volume: number; firstChapter: number }[];
};

export function useSeriesShelf(
  manga: Manga | null,
  setManga: Dispatch<SetStateAction<Manga | null>>,
  {
    latest = null,
    opensAt,
    ordered = [],
    readingFrom = null,
    volumeStarts = [],
  }: Options = {},
) {
  const trackBy = usePrefs((s) => s.prefs.trackBy ?? "series");
  const [saveFailed, setSaveFailed] = useState(false);
  const [undoTo, setUndoTo] = useState<number[] | null>(null);
  const dropUndo = useCallback(() => setUndoTo(null), []);
  // what they owned when the slide began: each step of it, and its Undo,
  // start from this (the web's ShelfBox slideStart), never from a shelf
  // still being saved between one step and the next
  const slideStart = useRef<number[] | null>(null);

  const owned = manga ? ownedOf(manga) : [];
  const buyOptions = useBuyOptions(
    manga ? priceName(manga) : null,
    ordered.length
      ? ownedFrom(null, [...owned, ...ordered])
      : {
          volumesOwned: manga?.volumesOwned ?? null,
          ownedList: manga?.ownedList,
        },
    readingFrom,
  );
  const editions = useEditions(
    manga && !manga.lightNovel ? priceName(manga) : null,
    manga?.id ?? null,
    manga?.edition,
    // ordered counts as theirs here too: the next book is the one after
    [...owned, ...ordered],
    buyOptions.volumes.map((v) => v.isbn13),
    readingFrom,
  );
  const ownedVolumes = useOwnedVolumes({
    manga,
    setManga,
    onTick: () => setSaveFailed(false),
    onFailed: () => setSaveFailed(true),
  });

  const highest = Math.floor(Math.max(0, ...owned));
  const total = shelfSize(highest, latest, buyOptions);
  const place = manga
    ? placeOnShelf(manga, tracksOf(manga, trackBy), volumeStarts)
    : null;
  const gaps = Array.from({ length: highest }, (_, i) => i + 1).filter(
    (v) => !owned.includes(v),
  );

  // the shelf seen as the edition they collect: its books in place of volumes
  const slots =
    editions.line && total.isKnown
      ? slotsOf(editions.line, total.size, todayOf())
      : null;
  const inEdition = slots ? placeInSlots(slots, place) : null;
  const count = slots
    ? ownedCaption(slots, owned)
    : `You own ${owned.length}${total.isKnown ? ` of ${total.size} volumes` : ` volume${owned.length === 1 ? "" : "s"}`}`;
  const placeText = inEdition
    ? inEdition.text
    : place
      ? `${place.kind === "reading" ? "Reading" : "Read up to"} vol. ${place.volume}`
      : "Tap a book to mark it yours.";

  const slideEvents = {
    onSlideStart: () => {
      slideStart.current = owned;
    },
    onSlideDone: () => {
      setUndoTo(slideStart.current);
      slideStart.current = null;
    },
  };
  const stripSlots: StripSlots | undefined =
    slots && editions.line
      ? {
          bookWidth: 30,
          spine: (n) => spineOf(slots[n - 1]!),
          share: (n) => shareOwned(slots, owned, n),
          runName: (n) =>
            slots[n - 1]?.book ? editions.line!.label : "Singles",
          startsRun: (n) =>
            n > 1 &&
            Boolean(slots[n - 1]?.book) !== Boolean(slots[n - 2]?.book),
        }
      : undefined;
  // everything the strip takes, for singles or the edition's books
  const strip =
    slots && stripSlots
      ? {
          total: slots.length,
          owned: slotsIn(slots, owned, "all"),
          here: inEdition?.slot ?? null,
          opensAt: opensAt ?? null,
          slots: stripSlots,
          onToggle: (n: number) =>
            ownedVolumes.paint(toggleSlot(slots[n - 1]!, owned)),
          onPaint: (painted: number[]) =>
            ownedVolumes.paint(
              volumesAfterPaint(slots, slideStart.current ?? owned, painted),
            ),
          ...slideEvents,
        }
      : {
          total: total.size,
          owned,
          here: place?.volume ?? null,
          opensAt: opensAt ?? gaps[0] ?? null,
          onToggle: (v: number) => ownedVolumes.toggle(v),
          onPaint: (next: number[]) => ownedVolumes.paint(next),
          ...slideEvents,
        };

  // a slide's Undo, while it would change something
  const undo =
    undoTo && owned.join() !== undoTo.join()
      ? {
          text: slideText(undoTo, owned),
          run: () => {
            ownedVolumes.paint(undoTo);
            setUndoTo(null);
          },
          drop: dropUndo,
        }
      : null;

  return {
    owned,
    place,
    total,
    buyOptions,
    editions,
    highest,
    gaps,
    count,
    placeText,
    isEdition: Boolean(slots),
    // the edition they collect with its books, for the reading counter
    editionShelf:
      slots && editions.line ? { line: editions.line, slots } : null,
    strip,
    saveFailed,
    undo,
  };
}

export type SeriesShelf = ReturnType<typeof useSeriesShelf>;
