// A series' page, as the Android app's (web pages/Details): its cover and
// name, Buy next, and Your shelf, the strip of books to mark as theirs. The
// rules are the web's own hooks (core pages/Details): what's out, the edition
// they collect, how big the shelf is, and saving what they own. Reading,
// rating, notes and their books come in phase 4
import SeriesCover from "@/components/SeriesCover";
import { router, useLocalSearchParams } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import BuyNext from "@/components/BuyNext";
import DoubleRule from "@/components/DoubleRule";
import Toast from "@/components/Toast";
import VolumeStrip, { type StripSlots } from "@/components/VolumeStrip";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { apiFetch } from "@/core/lib/api";
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
import { todayOf } from "@/core/lib/editionNews";
import { placeOnShelf } from "@/core/lib/chapterVolumes";
import { ownedOf, rangesText } from "@/core/lib/ownedVolumes";
import { formatCents, priceName } from "@/core/lib/prices";
import { tracksOf } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import { shelfSize } from "@/core/pages/Details/releaseNews";
import { useBuyOptions } from "@/core/pages/Details/useBuyOptions";
import { useEditions } from "@/core/pages/Details/useEditions";
import { useOwnedVolumes } from "@/core/pages/Details/useOwnedVolumes";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";

const Safe = withUniwind(SafeAreaView);

// what a slide did, for its Undo note: "6 volumes marked yours"
function slideText(before: number[], now: number[]) {
  const added = now.filter((v) => !before.includes(v)).length;
  const removed = before.filter((v) => !now.includes(v)).length;
  const volumes = (n: number) => `${n} ${n === 1 ? "volume" : "volumes"}`;
  if (added && !removed) return `${volumes(added)} marked yours`;
  if (removed && !added) return `${volumes(removed)} taken off your shelf`;
  return `${volumes(added + removed)} changed`;
}

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const trackBy = usePrefs((s) => s.prefs.trackBy ?? "series");
  const [manga, setManga] = useState<Manga | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const [undoTo, setUndoTo] = useState<number[] | null>(null);
  const dropUndo = useCallback(() => setUndoTo(null), []);
  // what they owned when the slide began: each step of it, and its Undo,
  // start from this (the web's ShelfBox slideStart), never from a shelf
  // still being saved between one step and the next
  const slideStart = useRef<number[] | null>(null);
  const slideEvents = {
    onSlideStart: () => {
      slideStart.current = owned;
    },
    onSlideDone: () => {
      setUndoTo(slideStart.current);
      slideStart.current = null;
    },
  };

  useEffect(() => {
    let live = true;
    apiFetch(`/api/manga/${id}`)
      .then(async (res) => {
        if (!res.ok)
          throw new Error(
            res.status === 404
              ? "This series isn't on your shelf."
              : "It didn't load.",
          );
        const data = (await res.json()) as { manga: Manga };
        if (live) setManga(data.manga);
      })
      .catch((e: Error) => live && setFailed(e.message));
    return () => {
      live = false;
    };
  }, [id]);

  const owned = manga ? ownedOf(manga) : [];
  const buyOptions = useBuyOptions(manga ? priceName(manga) : null, {
    volumesOwned: manga?.volumesOwned ?? null,
    ownedList: manga?.ownedList,
  });
  const editions = useEditions(
    manga && !manga.lightNovel ? priceName(manga) : null,
    manga?.id ?? null,
    manga?.edition,
    owned,
    buyOptions.volumes.map((v) => v.isbn13),
  );
  const ownedVolumes = useOwnedVolumes({
    manga,
    setManga,
    onTick: () => setSaveFailed(false),
    onFailed: () => setSaveFailed(true),
  });

  if (failed)
    return (
      <Safe className="flex-1 items-center justify-center bg-paper px-8">
        <Text className="font-body text-[16px] text-ink-soft">{failed}</Text>
      </Safe>
    );
  if (!manga) return <Safe className="flex-1 bg-paper" />;

  const highest = Math.floor(Math.max(0, ...owned));
  const total = shelfSize(highest, null, buyOptions);
  const place = placeOnShelf(manga, tracksOf(manga, trackBy), []);
  const statusWord = manga.status
    ? "Finished"
    : manga.planned
      ? "To read"
      : "Reading";

  // the shelf seen as the edition they collect: its books in place of volumes
  const slots =
    editions.line && total.isKnown
      ? slotsOf(editions.line, total.size, todayOf())
      : null;
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
  const inEdition = slots ? placeInSlots(slots, place) : null;
  const count = slots
    ? ownedCaption(slots, owned)
    : `You own ${owned.length}${total.isKnown ? ` of ${total.size} volumes` : ` volume${owned.length === 1 ? "" : "s"}`}`;
  const gaps = Array.from({ length: highest }, (_, i) => i + 1).filter(
    (v) => !owned.includes(v),
  );

  // Buy next: the one rule (core buyNextOf, through useBuyOptions)
  const next = buyOptions.next;

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      {/* the app bar: back, and the series' name */}
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
          {manga.name}
        </Text>
      </View>
      <DoubleRule />
      <ScrollView contentContainerClassName="gap-6 px-4 pt-4 pb-16">
        {/* the cover and name, with how they're getting on */}
        <View className="flex-row gap-3.5">
          <SeriesCover
            name={manga.name}
            lightNovel={manga.lightNovel}
            url={manga.image}
            width={90}
            border={2}
          />
          <View className="min-w-0 flex-1 gap-2">
            <Text className="font-display text-[24px] leading-[28px] text-ink">
              {manga.name}
            </Text>
            <View className="flex-row flex-wrap gap-1.5">
              {[
                statusWord,
                manga.lightNovel ? "Light novel" : null,
                manga.genre && manga.genre !== "unlabled" ? manga.genre : null,
                editions.line ? `as ${editions.line.label}` : null,
              ]
                .filter(Boolean)
                .map((chip) => (
                  <Text
                    key={chip}
                    className="rounded-[2px] border-[1.5px] border-line-soft px-2 py-0.5 font-body-medium text-[13px] text-ink-soft"
                  >
                    {chip}
                  </Text>
                ))}
            </View>
          </View>
        </View>

        {/* Buy next. Its room is kept while it loads, so the shelf under it
            doesn't jump when it arrives */}
        {buyOptions.loading ? <View className="h-[92px]" /> : null}
        <BuyNext
          options={buyOptions}
          edition={
            editions.line && editions.plan
              ? { line: editions.line, plan: editions.plan }
              : null
          }
          highest={highest}
          gaps={gaps}
        />

        {/* Your shelf */}
        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
              Your shelf
            </Text>
            <Text className="font-body text-[14px] text-ink-soft">{count}</Text>
          </View>
          {slots && stripSlots ? (
            <VolumeStrip
              total={slots.length}
              owned={slotsIn(slots, owned, "all")}
              here={inEdition?.slot ?? null}
              opensAt={null}
              slots={stripSlots}
              onToggle={(n) =>
                ownedVolumes.paint(toggleSlot(slots[n - 1]!, owned))
              }
              onPaint={(painted) =>
                ownedVolumes.paint(
                  volumesAfterPaint(
                    slots,
                    slideStart.current ?? owned,
                    painted,
                  ),
                )
              }
              {...slideEvents}
            />
          ) : (
            <VolumeStrip
              total={total.size}
              owned={owned}
              here={place?.volume ?? null}
              opensAt={gaps[0] ?? null}
              onToggle={(v) => ownedVolumes.toggle(v)}
              onPaint={(next) => ownedVolumes.paint(next)}
              {...slideEvents}
            />
          )}
          <Text className="text-center font-mono text-[12.5px] text-muted">
            {inEdition
              ? inEdition.text
              : place
                ? `${place.kind === "reading" ? "Reading" : "Read up to"} vol. ${place.volume}`
                : "Tap a book to mark it yours."}
          </Text>
          {saveFailed ? (
            <Text className="text-center font-body-medium text-[14px] text-accent">
              That didn't save. Try again.
            </Text>
          ) : null}
        </View>
      </ScrollView>
      {undoTo && slideText(undoTo, owned) && owned.join() !== undoTo.join() ? (
        <Toast
          text={slideText(undoTo, owned)}
          action="Undo"
          onAction={() => {
            ownedVolumes.paint(undoTo);
            setUndoTo(null);
          }}
          onGone={dropUndo}
        />
      ) : null}
    </Safe>
  );
}
