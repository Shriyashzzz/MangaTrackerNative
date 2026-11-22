// A series on their shelf, as the Android app's (web pages/Details/
// Details.tsx): its cover and name, the edition they collect, Buy next, the
// little shelf of ticked volumes, where they are in it, what's newly out,
// their rating and notes, the books they own, their reviews, and Mark as
// finished. Edit and Delete are in the ⋮ menu. This file loads the series
// and saves changes to it; each part of the page is its own component, and
// every rule is the web's own (core pages/Details, core lib)
import Backdrop from "@/components/Backdrop";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Button from "@/components/Button";
import BuyStrip from "@/components/BuyStrip";
import DoubleRule from "@/components/DoubleRule";
import MenuSheet from "@/components/MenuSheet";
import NotesField from "@/components/NotesField";
import PickSheet from "@/components/PickSheet";
import RateVolume, { RateVolumeCard } from "@/components/RateVolume";
import RatingField from "@/components/RatingField";
import ReadingPlace, { type ReadingChange } from "@/components/ReadingPlace";
import ReleaseBar from "@/components/ReleaseBar";
import ReviewDialog from "@/components/ReviewDialog";
import SeriesCover from "@/components/SeriesCover";
import ShelfStrip from "@/components/ShelfStrip";
import Toast from "@/components/Toast";
import TwiceNote from "@/components/TwiceNote";
import YourBooks from "@/components/YourBooks";
import YourReviews from "@/components/YourReviews";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MoreIcon,
} from "@/core/components/icons/Icons";
import { apiFetch } from "@/core/lib/api";
import { ownEditionBook } from "@/core/lib/booksApi";
import type { EditionBook, EditionLine } from "@/core/lib/editions";
import { saveOrKeep } from "@/core/lib/offlineChanges";
import {
  ownedOf,
  ownedVolumes as ownedFrom,
  withOwned,
} from "@/core/lib/ownedVolumes";
import { tracksOf } from "@/core/lib/reading";
import type { ShelfVolume } from "@/core/lib/reviews";
import {
  getReleases,
  saveSeen,
  setOrdered,
  setVolumesOwned,
} from "@/core/lib/shelf";
import type { Manga, ReleaseData, ReleaseStatus } from "@/core/lib/types";
import { releaseNews } from "@/core/pages/Details/releaseNews";
import {
  closeUpcoming,
  isUpcomingClosed,
} from "@/core/pages/Details/upcomingClosed";
import { useRateVolume } from "@/core/pages/Details/useRateVolume";
import { useShelfReviews } from "@/core/pages/Details/useShelfReviews";
import { useColors } from "@/lib/colors";
import { useSeriesShelf } from "@/lib/useSeriesShelf";
import { usePrefs } from "@/store/prefs";
import { restoredAs, useShelf } from "@/store/shelf";
import { H2 } from "@/components/Page";
import { DEFAULT_TRACK_BY } from "@/lib/trackBy";
import LoadingQuote from "@/components/LoadingQuote";
import { lastChapterOf, volumesReadAt } from "@/lib/placeEquivalent";

const Safe = withUniwind(SafeAreaView);

const DIDNT_SAVE = "That didn't save. Try again.";
// the name shows in the bar once the page has scrolled past it
const TITLE_GONE_AT = 110;

function SectionTitle({ children }: { children: string }) {
  return <H2>{children}</H2>;
}

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  // a series brought back by Undo has a new id: its old address leads there
  const id = String(restoredAs(Number(params.id)) ?? params.id);
  const seriesId = Number(id);
  const c = useColors();
  const prefs = usePrefs((s) => s.prefs);
  const trackBy = prefs.trackBy ?? DEFAULT_TRACK_BY;
  const checksOn = prefs.releaseChecks !== "off";
  // the latest the shelf's own check found, until this page's answer comes
  const fromShelfCheck = useShelf((s) => s.releases[seriesId]);

  // ---------- what's loaded ----------
  const [manga, setManga] = useState<Manga | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [loadTry, setLoadTry] = useState(0);
  const [releaseData, setReleaseData] = useState<ReleaseData | null>(null);
  const [releaseStatus, setReleaseStatus] = useState<ReleaseStatus | null>(
    null,
  );

  // ---------- what they can change here ----------
  const [titleShown, setTitleShown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingEdition, setPickingEdition] = useState(false);
  // under the buttons: a failed save, or the undo for marking it finished
  const [actionNote, setActionNote] = useState("");
  const [canUndoStatus, setCanUndoStatus] = useState(false);
  // marked finished straight from To read: undo puts it back there
  const finishedFromPlanned = useRef(false);
  // a chapter was saved, so what's new for them needs asking again
  const [chapterSaves, setChapterSaves] = useState(0);
  // the counters start over from what's saved when it's set from outside them
  const [volumeSets, setVolumeSets] = useState(0);
  // a book was added somewhere else (Buy next): Your books asks again
  const [booksChanged, setBooksChanged] = useState(0);
  const [, setUpcomingClosedAt] = useState(0);

  // ---------- their reviews of its volumes ----------
  const ownedSoFar = manga ? ownedOf(manga).length : 0;
  const place = `${ownedSoFar}-${manga?.readVolume ?? 0}-${manga?.status ?? false}`;
  const reviews = useShelfReviews(seriesId, place);
  const volumeRating = useRateVolume(
    `${id}:${place}`,
    seriesId,
    reviews,
    reviews.reload,
  );
  const [reviewing, setReviewing] = useState<ShelfVolume | null>(null);

  // ordered and on their way, and not owned since: Buy next goes past them
  const ordered = manga
    ? (manga.orderedList ?? []).filter((v) => !ownedOf(manga).includes(v))
    : [];
  const shelf = useSeriesShelf(manga, setManga, {
    latest: releaseStatus?.latestVolume ?? fromShelfCheck?.latestVolume ?? null,
    ordered,
    readingFrom: releaseStatus?.nextChapterVolume ?? null,
    volumeStarts: releaseData?.volumeStarts ?? [],
  });
  const { buyOptions, editions } = shelf;

  // both counters kept: saving one moves the other to the same place, when
  // the volume list is sure where that is (lib/placeEquivalent.ts)
  const keepTheOtherInStep = async (saved: {
    bookmark?: number;
    readVolume?: number;
  }) => {
    if (!manga) return;
    const tracks = tracksOf(manga, trackBy);
    if (!tracks.chapters || !tracks.volumes) return;
    const starts = releaseData?.volumeStarts ?? [];
    if (saved.readVolume != null) {
      const chapter = lastChapterOf(saved.readVolume, starts);
      if (chapter == null || chapter === manga.bookmark) return;
      const res = await apiFetch(`/api/manga/${manga.id}/bookmark`, {
        method: "PATCH",
        body: { bookmark: chapter },
      }).catch(() => null);
      if (res?.ok) {
        setManga((now) => (now ? { ...now, bookmark: chapter } : now));
        setChapterSaves((n) => n + 1);
      }
    } else if (saved.bookmark != null) {
      const volume = volumesReadAt(saved.bookmark, starts);
      if (volume == null || volume < 1 || volume === manga.readVolume) return;
      const res = await apiFetch(`/api/manga/${manga.id}/reading`, {
        method: "PATCH",
        body: { readVolume: volume },
      }).catch(() => null);
      if (res?.ok) {
        setManga((now) => (now ? { ...now, readVolume: volume } : now));
        setChapterSaves((n) => n + 1);
      }
    }
  };

  // ---------- loading ----------
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
  }, [id, loadTry]);

  // can take a few seconds, so the page doesn't wait for it; the bar just
  // doesn't appear if this fails
  const loadedId = manga?.id;
  useEffect(() => {
    if (!checksOn || loadedId == null) return;
    const controller = new AbortController();
    getReleases(seriesId, controller.signal)
      .then((found) => {
        setReleaseData(found.releaseData);
        setReleaseStatus(found.releaseStatus);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [seriesId, chapterSaves, checksOn, loadedId]);

  if (failed)
    return (
      <Safe className="flex-1 items-center justify-center gap-4 bg-paper px-8">
        <Text className="text-center font-body text-[16px] text-ink-soft">
          {failed}
        </Text>
        <Button
          label="Try again"
          onPress={() => {
            setFailed(null);
            setLoadTry(loadTry + 1);
          }}
        />
      </Safe>
    );
  if (!manga)
    return (
      <Safe className="flex-1 bg-paper">
        <LoadingQuote />
      </Safe>
    );

  const m = manga;
  const finished = m.status;
  const planned = m.planned;
  const owned = shelf.owned;

  // ---------- saving ----------
  const saveReading = async (change: ReadingChange) => {
    const was = m;
    setManga({ ...m, ...change });
    setActionNote("");
    try {
      const res = await apiFetch(`/api/manga/${m.id}/reading`, {
        method: "PATCH",
        body: change,
      });
      if (!res.ok) throw new Error("Failed saving how it's read");
      setChapterSaves((n) => n + 1);
      setVolumeSets((n) => n + 1);
      void useShelf.getState().load();
    } catch {
      setManga(was);
      setActionNote(DIDNT_SAVE);
    }
  };

  const startReading = async () => {
    setManga({ ...m, planned: false });
    setActionNote("");
    try {
      await saveOrKeep(
        m.id,
        "state",
        { status: false, planned: true },
        { status: false, planned: false },
        () =>
          apiFetch(`/api/manga/${m.id}/planned`, {
            method: "PATCH",
            body: { planned: false },
          }),
      );
      setManga((now) => (now ? { ...now, planned: false, bookmark: 1 } : now));
      setActionNote(
        tracksOf(m, trackBy).chapters
          ? "Started! Ch. 1 marked as read."
          : "Started!",
      );
      void useShelf.getState().load();
    } catch {
      setManga((now) => (now ? { ...now, planned: true } : now));
      setActionNote(DIDNT_SAVE);
    }
  };

  // Mark as finished / Back to reading, and its Undo: one that came off To
  // read goes back on it
  const changeStatus = async (isUndo = false) => {
    const next = !finished;
    const wasPlanned = planned;
    setManga({ ...m, status: next, planned: false });
    setActionNote("");
    setCanUndoStatus(false);
    try {
      const backOnToRead = isUndo && finishedFromPlanned.current;
      await saveOrKeep(
        m.id,
        "state",
        { status: !next, planned: wasPlanned },
        { status: next, planned: backOnToRead },
        async () => {
          const res = await apiFetch(`/api/manga/${m.id}/status`, {
            method: "PATCH",
            body: { status: next },
          });
          if (!res.ok || !backOnToRead) return res;
          return apiFetch(`/api/manga/${m.id}/planned`, {
            method: "PATCH",
            body: { planned: true },
          });
        },
      );
      if (backOnToRead)
        setManga((now) => (now ? { ...now, planned: true } : now));
      finishedFromPlanned.current = !isUndo && next && wasPlanned;
      if (!isUndo) {
        setActionNote(next ? "Marked as finished." : "Back to reading.");
        setCanUndoStatus(true);
      }
      void useShelf.getState().load();
    } catch {
      setManga((now) =>
        now ? { ...now, status: !next, planned: wasPlanned } : now,
      );
      setActionNote(DIDNT_SAVE);
    }
  };

  // the red bar's ×: one that's out is marked seen (as New's Hide does);
  // one still coming is only silenced as a notice
  const hideRelease = (seen: {
    kind: "volume" | "chapter";
    number: number;
    upcoming: boolean;
  }) => {
    if (seen.upcoming) {
      closeUpcoming(m.id, seen.kind, seen.number);
      setUpcomingClosedAt((n) => n + 1);
      return;
    }
    const field = seen.kind === "volume" ? "seenVolume" : "seenChapter";
    const before = m[field] ?? null;
    setManga((now) => now && { ...now, [field]: seen.number });
    saveSeen(m.id, seen.kind, seen.number).catch(() =>
      setManga((now) => now && { ...now, [field]: before }),
    );
  };

  // Buy next's pills: the book or volume is theirs, or on its way
  const ownBook = async (line: EditionLine, book: EditionBook) => {
    const { owned: now, books } = await ownEditionBook(
      m.id,
      ownedOf(m),
      line,
      book,
    );
    setManga((was) => was && withOwned(was, now));
    setBooksChanged((n) => n + 1);
    void useShelf.getState().load();
    if (!books) throw new Error("The book didn't save");
  };
  const ownVolume = async (volume: number) => {
    const now = await setVolumesOwned(
      m.id,
      ownedFrom(null, [...ownedOf(m), volume]),
    );
    setManga((was) => was && withOwned(was, now));
    setBooksChanged((n) => n + 1);
    void useShelf.getState().load();
  };
  const orderVolumes = async (volumes: number[], on: boolean) => {
    const orderedList = await setOrdered(m.id, volumes, on);
    setManga((was) => (was ? { ...was, orderedList } : was));
  };

  // gone from the shelf, with the shelf's Undo note on offer
  const deleteSeries = async () => {
    try {
      const res = await apiFetch(`/api/manga/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed deleting manga");
      useShelf.getState().remove(m.id);
      useShelf.getState().setLastDeleted(m);
      router.back();
    } catch {
      setActionNote("That didn't delete. Try again.");
    }
  };
  const askToDelete = () =>
    Alert.alert(
      `Delete ${m.name}?`,
      "It comes off your shelf with its volumes and books, rating, reading progress and notes.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete it", style: "destructive", onPress: deleteSeries },
      ],
    );

  // ---------- what's shown ----------
  const { release, hideNextTicket } = releaseNews({
    manga: m,
    releaseStatus,
    releaseData,
    buyOptions,
    collectsEdition: Boolean(editions.line),
    edition: editions.line ? { line: editions.line, owned } : null,
    checksOn,
    planned,
    tracksChapters: tracksOf(m, trackBy).chapters,
    highestOwned: shelf.highest,
    upcomingClosed: (kind, number) => isUpcomingClosed(m.id, kind, number),
  });
  const statusWord = finished ? "Finished" : planned ? "To read" : "Reading";
  const genre = m.genre && m.genre !== "unlabled" ? m.genre : null;
  const editionOptions = [
    { value: "singles", label: "Single volumes" },
    ...editions.lines.map((l) => ({ value: l.key, label: l.label })),
  ];

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <Backdrop />
      {/* the app bar: back, the name once scrolled past it, and the menu */}
      <View className="h-[62px] flex-row items-center gap-2 px-2">
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
          className="flex-1 font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase"
        >
          {titleShown ? m.name : ""}
          {"\u00A0"}
        </Text>
        <Pressable
          onPress={() => setMenuOpen(true)}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="More"
        >
          <MoreIcon color={c.ink} width={22} height={22} />
        </Pressable>
      </View>
      <DoubleRule />
      <ScrollView
        contentContainerClassName="gap-6 px-4 pt-4 pb-16"
        scrollEventThrottle={64}
        onScroll={(e) =>
          setTitleShown(e.nativeEvent.contentOffset.y > TITLE_GONE_AT)
        }
        keyboardShouldPersistTaps="handled"
      >
        <TwiceNote manga={m} onMerged={() => setLoadTry((n) => n + 1)} />

        {/* the cover and name, with how they're getting on */}
        <View className="flex-row gap-4">
          <View>
            <SeriesCover
              name={m.name}
              lightNovel={m.lightNovel}
              url={m.image}
              width={96}
              border={2}
            />
            {finished ? (
              <View className="absolute right-[-6px] bottom-2 -rotate-6 border-2 border-accent bg-paper px-1.5">
                <Text className="font-brand pr-[4px] text-[16px] tracking-[1px] text-accent uppercase">
                  Done
                  {"\u00A0"}
                </Text>
              </View>
            ) : null}
          </View>
          <View className="min-w-0 flex-1 justify-center gap-2.5">
            <Text className="font-display text-[26px] leading-[30px] text-ink">
              {m.name}
            </Text>
            <View className="flex-row flex-wrap items-center gap-1.5">
              <Text
                className={`rounded-[2px] border-[1.5px] px-2 py-0.5 font-body-medium text-[13px] ${finished ? "border-ok text-ok" : "border-accent text-accent"}`}
              >
                {statusWord}
              </Text>
              {[m.lightNovel ? "Light novel" : null, genre]
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
            {/* the edition they collect, under the chips: its label says what
                it is, the value is the tap. The shelf, the counter and Buy
                next all follow it */}
            {editions.lines.length ? (
              <Pressable
                onPress={() => setPickingEdition(true)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={`Edition: ${editions.line?.label ?? "Single volumes"}. Change`}
                className="flex-row items-center gap-1 self-start active:opacity-70"
              >
                <Text className="font-body text-[13.5px] text-ink-soft">
                  Edition
                </Text>
                <Text
                  numberOfLines={1}
                  className="shrink font-body-semibold text-[13.5px] text-accent-ink"
                >
                  {editions.line?.label ?? "Single volumes"}
                </Text>
                <ChevronDownIcon color={c.accentInk} width={14} height={14} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <BuyStrip
          options={buyOptions}
          hideNext={hideNextTicket}
          barSells={release?.sellsIsbn ?? null}
          editions={editions}
          shelfTotal={shelf.total.isKnown ? shelf.total.size : 0}
          ownsNone={owned.length === 0}
          nextChapters={
            buyOptions.next &&
            buyOptions.next.volume === releaseStatus?.nextVolume
              ? releaseStatus?.nextVolumeChapters
              : null
          }
          onCollect={(edition) => saveReading({ edition })}
          onOwnBook={ownBook}
          onOwnVolume={ownVolume}
          ordered={ordered}
          onOrdered={orderVolumes}
        />

        <View className="gap-2">
          <View className="flex-row items-end justify-between">
            <SectionTitle>Your shelf</SectionTitle>
            <Text className="font-body text-[14px] text-ink-soft">
              {shelf.count}
            </Text>
          </View>
          <ShelfStrip shelf={shelf} />
        </View>

        {/* a rule above each section, as the Android app divides them */}
        <View className="gap-3 border-t border-line-soft pt-6">
          <ReadingPlace
            manga={m}
            finished={finished}
            planned={planned}
            trackBy={trackBy}
            highestOwned={shelf.highest}
            volumeSets={volumeSets}
            edition={shelf.editionShelf}
            newestChapter={releaseStatus?.latestChapter ?? null}
            onStart={startReading}
            onChange={saveReading}
            onPlaceSaved={(saved) => {
              setManga((now) => (now ? { ...now, ...saved } : now));
              setChapterSaves((n) => n + 1);
              void keepTheOtherInStep(saved).finally(
                () => void useShelf.getState().load(),
              );
            }}
          />
          {release ? (
            <ReleaseBar
              key={release.headline}
              headline={release.headline}
              link={release.link}
              onClose={() => hideRelease(release.seen)}
            />
          ) : null}
        </View>

        <View className="gap-4 border-t border-line-soft pt-6">
          <RatingField
            key={`rating-${m.id}`}
            mangaId={m.id}
            initial={m.rating ?? 0}
          />
          {/* the volume they've read last, asked about quietly beside the
              series' stars, or out loud in a banner when just finished */}
          {volumeRating.asked &&
          !planned &&
          !volumeRating.inBanner &&
          volumeRating.showTicket ? (
            <RateVolume volume={volumeRating} onWrite={setReviewing} />
          ) : null}
          {volumeRating.inBanner && !planned ? (
            <RateVolumeCard volume={volumeRating} onWrite={setReviewing} />
          ) : null}
          <NotesField key={m.id} id={m.id} initial={m.description} />
        </View>

        <View>
          <YourBooks
            mangaId={m.id}
            owned={owned}
            onRemoved={(left) => setManga((now) => now && withOwned(now, left))}
            lines={editions.lines}
            collects={shelf.editionShelf}
            onAdded={(now) => setManga((was) => was && withOwned(was, now))}
            booksChanged={booksChanged}
          />
          <YourReviews written={reviews.written} onEdit={setReviewing} />
        </View>

        <View className="gap-2">
          <Button
            label={finished ? "Mark as reading" : "Mark as finished"}
            wide
            onPress={() => changeStatus()}
          />
          {actionNote ? (
            <View className="flex-row items-baseline justify-center gap-3">
              <Text className="font-body text-[14px] text-ink-soft">
                {actionNote}
              </Text>
              {canUndoStatus ? (
                <Pressable onPress={() => changeStatus(true)} hitSlop={8}>
                  <Text className="font-body-semibold text-[14px] text-accent border-b pb-[2px] border-accent self-start">
                    Undo
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {shelf.undo ? (
        <Toast
          text={shelf.undo.text}
          action="Undo"
          onAction={shelf.undo.run}
          onGone={shelf.undo.drop}
        />
      ) : null}
      <MenuSheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        items={[
          {
            label: "Edit details",
            onPress: () =>
              router.push({
                pathname: "/edit/[id]",
                params: { id: String(m.id) },
              }),
          },
          { label: "Delete series", onPress: askToDelete, danger: true },
        ]}
      />
      <PickSheet
        open={pickingEdition}
        title="Collected as"
        options={editionOptions}
        picked={editions.line?.key ?? "singles"}
        onPick={(edition) => saveReading({ edition })}
        onClose={() => setPickingEdition(false)}
      />
      {reviewing ? (
        <ReviewDialog
          key={reviewing.volume}
          mangaId={m.id}
          volume={reviewing}
          current={
            reviews.written.find((one) => one.volume === reviewing.volume)
              ?.review ?? null
          }
          onChanged={reviews.reload}
          onClose={() => setReviewing(null)}
        />
      ) : null}
    </Safe>
  );
}
