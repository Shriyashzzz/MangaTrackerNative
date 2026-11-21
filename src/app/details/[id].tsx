// A series' page, as the Android app's (web pages/Details/Details.tsx): the
// cover with its name, status and the edition they collect; Buy next; Your
// shelf; Reading (where they are); Your take (rating and notes); and Mark as
// finished. Edit and Delete are in the ⋮ menu. The rules are the web's own
// (core pages/Details hooks, core lib); the screen is React Native's
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Button from "@/components/Button";
import BuyNext from "@/components/BuyNext";
import DoubleRule from "@/components/DoubleRule";
import MenuSheet from "@/components/MenuSheet";
import NotesField from "@/components/NotesField";
import PickSheet from "@/components/PickSheet";
import RatingField from "@/components/RatingField";
import ReadingPlace, { type ReadingChange } from "@/components/ReadingPlace";
import SeriesCover from "@/components/SeriesCover";
import ShelfStrip from "@/components/ShelfStrip";
import Toast from "@/components/Toast";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  MoreIcon,
} from "@/core/components/icons/Icons";
import { apiFetch } from "@/core/lib/api";
import { saveOrKeep } from "@/core/lib/offlineChanges";
import { tracksOf } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import { useColors } from "@/lib/colors";
import { useSeriesShelf } from "@/lib/useSeriesShelf";
import { usePrefs } from "@/store/prefs";
import { restoredAs, useShelf } from "@/store/shelf";

const Safe = withUniwind(SafeAreaView);

const DIDNT_SAVE = "That didn't save. Try again.";
// the name shows in the bar once the page has scrolled past it
const TITLE_GONE_AT = 110;

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
      {children}
    </Text>
  );
}

export default function DetailsScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  // a series brought back by Undo has a new id: its old address leads there
  const id = String(restoredAs(Number(params.id)) ?? params.id);
  const c = useColors();
  const trackBy = usePrefs((s) => s.prefs.trackBy ?? "series");
  const latest = useShelf((s) => s.releases[Number(id)]);
  const [manga, setManga] = useState<Manga | null>(null);
  const [failed, setFailed] = useState<string | null>(null);
  const [loadTry, setLoadTry] = useState(0);
  const [titleShown, setTitleShown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickingEdition, setPickingEdition] = useState(false);
  // what the page last did, said under Mark as finished, with its undo
  const [actionNote, setActionNote] = useState("");
  const [canUndoStatus, setCanUndoStatus] = useState(false);
  const finishedFromPlanned = useRef(false);
  // the counters start over from what's saved when it's set from outside them
  const [volumeSets, setVolumeSets] = useState(0);

  const shelf = useSeriesShelf(manga, setManga, {
    latest: latest?.latestVolume ?? null,
  });
  const { buyOptions, editions } = shelf;

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
  if (!manga) return <Safe className="flex-1 bg-paper" />;

  const m = manga;
  const finished = m.status;
  const planned = m.planned;

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

  const statusWord = finished ? "Finished" : planned ? "To read" : "Reading";
  const genre = m.genre && m.genre !== "unlabled" ? m.genre : null;
  const editionOptions = [
    { value: "singles", label: "Single volumes" },
    ...editions.lines.map((l) => ({ value: l.key, label: l.label })),
  ];

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
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
          className="flex-1 font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase"
        >
          {titleShown ? m.name : ""}
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
        contentContainerClassName="gap-7 px-4 pt-4 pb-16"
        scrollEventThrottle={64}
        onScroll={(e) =>
          setTitleShown(e.nativeEvent.contentOffset.y > TITLE_GONE_AT)
        }
        keyboardShouldPersistTaps="handled"
      >
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
                <Text className="font-brand pr-1 text-[16px] tracking-[1px] text-accent uppercase">
                  Done
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
              {/* the edition they collect, or single volumes: the shelf, the
                  counter and Buy next all follow it */}
              {editions.lines.length ? (
                <Pressable
                  onPress={() => setPickingEdition(true)}
                  accessibilityLabel={`Collected as ${editions.line?.label ?? "single volumes"}. Change`}
                  className="flex-row items-center gap-1 rounded-[2px] border-[1.5px] border-line-soft px-2 py-0.5 active:bg-accent-wash"
                >
                  <Text className="font-body-medium text-[13px] text-ink">
                    {editions.line?.label ?? "Single volumes"}
                  </Text>
                  <ChevronDownIcon color={c.ink} width={14} height={14} />
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>

        {/* Buy next. Its room is kept while it loads, so nothing jumps */}
        {buyOptions.loading ? <View className="h-[92px]" /> : null}
        <BuyNext
          options={buyOptions}
          edition={
            editions.line && editions.plan
              ? { line: editions.line, plan: editions.plan }
              : null
          }
          highest={shelf.highest}
          gaps={shelf.isEdition ? [] : shelf.gaps}
        />

        <View className="gap-2">
          <View className="flex-row items-baseline justify-between">
            <SectionTitle>Your shelf</SectionTitle>
            <Text className="font-body text-[14px] text-ink-soft">
              {shelf.count}
            </Text>
          </View>
          <ShelfStrip shelf={shelf} />
        </View>

        <View className="gap-3">
          <SectionTitle>Reading</SectionTitle>
          <ReadingPlace
            manga={m}
            finished={finished}
            planned={planned}
            trackBy={trackBy}
            highestOwned={shelf.highest}
            volumeSets={volumeSets}
            edition={shelf.editionShelf}
            newestChapter={latest?.latestChapter ?? null}
            onStart={startReading}
            onChange={saveReading}
            onPlaceSaved={(place) => {
              setManga((now) => (now ? { ...now, ...place } : now));
              void useShelf.getState().load();
            }}
          />
        </View>

        <View className="gap-4">
          <SectionTitle>Your take</SectionTitle>
          <RatingField
            key={`rating-${m.id}`}
            mangaId={m.id}
            initial={m.rating ?? 0}
          />
          <NotesField key={m.id} id={m.id} initial={m.description} />
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
                  <Text className="font-body-semibold text-[14px] text-accent underline">
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
        items={[{ label: "Delete series", onPress: askToDelete, danger: true }]}
      />
      <PickSheet
        open={pickingEdition}
        title="Collected as"
        options={editionOptions}
        picked={editions.line?.key ?? "singles"}
        onPick={(edition) => saveReading({ edition })}
        onClose={() => setPickingEdition(false)}
      />
    </Safe>
  );
}
