// The shelf's Volumes tab, as the Android app's (web pages/Home/
// VolumesView.tsx): what they own, series by series. Each is a row with a bar
// of what's theirs, a break wherever a volume or book isn't. A tap opens the
// series' own shelf under it (the series page's strip, opened at their first
// gap; a tap on the bar moves it there), and what finishing it costs.
// One series is open at a time, so its shelf (useSeriesShelf) lives here and
// a slide's Undo sits at the foot of the screen
import { useTabFoot } from "@/lib/tabHeader";
import { columnStyle } from "@/lib/wide";
import TourTarget from "./TourTarget";
import { useTourScroll } from "@/lib/tourScroll";
import { useTour } from "@/store/tour";
import Tap from "@/components/Tap";
import { Link } from "expo-router";
import { useRef, useState, type Dispatch, type SetStateAction } from "react";
import { FlatList, Text, View } from "react-native";
import type { SharedValue } from "react-native-reanimated";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { totalText, type FinishRow } from "@/core/lib/collector";
import { wholeMoney } from "@/core/lib/country";
import { ownedCount, ownedOf, rangesText } from "@/core/lib/ownedVolumes";
import { priceName } from "@/core/lib/prices";
import type { Manga } from "@/core/lib/types";
import { useShelfTools } from "@/core/pages/Home/useShelfTools";
import { useColors } from "@/lib/colors";
import { useSeriesShelf, type SeriesShelf } from "@/lib/useSeriesShelf";
import { useShelf } from "@/store/shelf";
import DashedLine from "./DashedLine";
import FinishList from "./FinishList";
import OwnedBar from "./OwnedBar";
import SeriesCover from "./SeriesCover";
import ShelfStrip from "./ShelfStrip";
import ShelfTotals from "./ShelfTotals";
import Toast from "./Toast";

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

// "48, 55–56 +2 more": a long list of gaps never fills the line
function shortRanges(volumes: number[]) {
  const runs = rangesText(volumes).split(", ");
  const more = runs.length > 2 ? ` +${runs.length - 2} more` : "";
  return runs.slice(0, 2).join(", ") + more;
}

// the series the tour's steps on this view are about
const TOURED = "Haikyu!!";

export default function VolumesView({
  manga,
  scrollTop,
}: {
  // the shelf's series that own any volume
  manga: Manga[];
  // how far it's scrolled, for the shelf tab's pull to refresh
  scrollTop: SharedValue<number>;
}) {
  const foot = useTabFoot(96, 64);
  const releases = useShelf((s) => s.releases);
  const tools = useShelfTools();
  const [openId, setOpenId] = useState<number | null>(null);
  // a tap on the open row's bar: its shelf starts again at that volume
  const [jump, setJump] = useState<{ at: number; n: number } | null>(null);

  // the open series as just saved, shown at once before the shelf's list
  // comes back with it; a new list from the shelf starts it again
  const fromShelf = manga.find((m) => m.id === openId) ?? null;
  const [kept, setKept] = useState({ from: fromShelf, manga: fromShelf });
  if (kept.from !== fromShelf) setKept({ from: fromShelf, manga: fromShelf });
  const open = kept.from === fromShelf ? kept.manga : fromShelf;
  const setOpenManga: Dispatch<SetStateAction<Manga | null>> = (next) =>
    setKept((k) => ({
      ...k,
      manga: (typeof next === "function" ? next(k.manga) : next) ?? k.manga,
    }));
  const latestOf = (m: Manga) => releases[m.id]?.latestVolume ?? null;
  const shelf = useSeriesShelf(open, setOpenManga, {
    latest: open ? latestOf(open) : null,
    opensAt: jump?.at,
  });

  const finishOf = new Map(tools?.finish.map((f) => [f.mangaId, f]));
  // each series' worth, by the shelf total's rule, in whole dollars
  const worthOf = new Map(
    (tools?.seriesWorth ?? []).map((w) => {
      const all = w.volumes + w.unlisted;
      const text = totalText(w.cents, w.priced, all, w.estimateCents);
      return [w.mangaId, text && w.priced >= all ? wholeMoney(w.cents) : text];
    }),
  );
  const volumes = manga.reduce((sum, m) => sum + ownedCount(m), 0);
  // Kenji's tour: its steps here are about one series (the one with gaps on
  // the collector's practice shelf). The list scrolls to it, and the step
  // about its open shelf opens it
  const list = useRef<FlatList<Manga>>(null);
  const tourScroller = useRef({
    scrollTo: ({ y }: { y: number }) =>
      list.current?.scrollToOffset({ offset: y, animated: true }),
  });
  useTourScroll(tourScroller, scrollTop);
  const tourStep = useTour((tour) => tour.steps[tour.at]?.target ?? null);
  const toured = manga.find((m) => m.name === TOURED)?.id ?? null;
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (tourStep !== openedFor) {
    setOpenedFor(tourStep);
    if (tourStep === "gaps-open" && toured != null) setOpenId(toured);
  }
  const toggle = (id: number) => {
    setOpenId(openId === id ? null : id);
    setJump(null);
  };

  return (
    <View className="flex-1">
      <FlatList
        ref={list}
        data={manga}
        keyExtractor={(m) => String(m.id)}
        extraData={[open, shelf, jump, tools]}
        ItemSeparatorComponent={DashedLine}
        contentContainerClassName="px-4 pt-3"
        contentContainerStyle={{ ...columnStyle, paddingBottom: foot }}
        // the shelf tab's pull to refresh is around this list: it's told
        // how far this one is scrolled
        overScrollMode="never"
        scrollEventThrottle={16}
        onScroll={(e) => scrollTop.set(e.nativeEvent.contentOffset.y)}
        ListHeaderComponent={
          <View>
            <Text className="mb-3 font-mono text-[13px] text-muted">
              {plural(volumes, "volume")} across{" "}
              {plural(manga.length, "series", "series")}
            </Text>
            {tools ? <ShelfTotals tools={tools} owned={volumes} /> : null}
          </View>
        }
        ListEmptyComponent={
          <View className="items-center gap-2 border-[1.5px] border-dashed border-line-soft p-8">
            <Text className="font-display text-[22px] text-ink">
              No volumes on your shelf yet.
            </Text>
            <Text className="text-center font-body text-[15px] text-ink-soft">
              Open a series and tick the volumes you own.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isOpen = item.id === openId && open !== null;
          const m = isOpen ? open : item;
          return (
            <View>
              {m.id === toured ? (
                <TourTarget name="gaps">
                  <SeriesRow
                    manga={m}
                    latest={latestOf(m)}
                    worth={worthOf.get(m.id) ?? null}
                    open={isOpen}
                    onToggle={() => toggle(m.id)}
                    onPick={(at) => setJump({ at, n: (jump?.n ?? 0) + 1 })}
                  />
                </TourTarget>
              ) : (
                <SeriesRow
                  manga={m}
                  latest={latestOf(m)}
                  worth={worthOf.get(m.id) ?? null}
                  open={isOpen}
                  onToggle={() => toggle(m.id)}
                  onPick={(at) => setJump({ at, n: (jump?.n ?? 0) + 1 })}
                />
              )}
              {isOpen ? (
                m.id === toured ? (
                  <TourTarget name="gaps-open">
                    <SeriesPanel
                      manga={m}
                      shelf={shelf}
                      jumpKey={jump?.n ?? 0}
                      finish={finishOf.get(m.id)}
                    />
                  </TourTarget>
                ) : (
                  <SeriesPanel
                    manga={m}
                    shelf={shelf}
                    jumpKey={jump?.n ?? 0}
                    finish={finishOf.get(m.id)}
                  />
                )
              ) : null}
            </View>
          );
        }}
      />
      {shelf.undo ? (
        <Toast
          text={shelf.undo.text}
          action="Undo"
          onAction={shelf.undo.run}
          onGone={shelf.undo.drop}
        />
      ) : null}
    </View>
  );
}

function SeriesRow({
  manga: m,
  latest,
  worth,
  open,
  onToggle,
  onPick,
}: {
  manga: Manga;
  latest: number | null;
  // what the series would fetch used, once enough of it is priced
  worth: string | null;
  open: boolean;
  onToggle: () => void;
  onPick: (volume: number) => void;
}) {
  const c = useColors();
  const owned = ownedOf(m);
  const total = Math.max(Math.floor(Math.max(0, ...owned)), latest ?? 0);
  return (
    <Tap
      onPress={onToggle}
      accessibilityState={{ expanded: open }}
      accessibilityHint={`vols. ${rangesText(owned)}`}
      className={`flex-row items-center gap-3 py-2.5 pr-1 active:bg-accent-wash ${open ? "bg-accent-wash" : ""}`}
    >
      <SeriesCover
        name={m.name}
        lightNovel={m.lightNovel}
        url={m.image}
        width={36}
      />
      <View className="min-w-0 flex-1 gap-1.5">
        {/* the name, then what those volumes would fetch and how many */}
        <View className="flex-row items-baseline gap-3">
          <View className="min-w-0 flex-1 flex-row items-baseline gap-2">
            <Text
              numberOfLines={1}
              className="min-w-0 shrink font-body-medium text-[16px] text-ink"
            >
              {m.name}
            </Text>
            {m.lightNovel ? (
              <Text className="font-body-medium text-[11px] tracking-[1px] text-muted uppercase">
                Novel
              </Text>
            ) : null}
          </View>
          {worth ? (
            <Text className="font-mono text-[11.5px] text-muted">
              worth {worth}
            </Text>
          ) : null}
          <Text className="font-brand pr-[5px] text-[21px] leading-[24px] text-ink">
            {owned.length}
            {"\u00A0"}
          </Text>
        </View>
        <OwnedBar
          owned={owned}
          total={total}
          books={m.editionPlace?.books ?? null}
          onPick={open ? onPick : undefined}
        />
      </View>
      <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
        <ChevronDownIcon color={c.muted} width={16} height={16} />
      </View>
    </Tap>
  );
}

// an opened series: its shelf, and what's left to buy
function SeriesPanel({
  manga,
  shelf,
  jumpKey,
  finish,
}: {
  manga: Manga;
  shelf: SeriesShelf;
  // a tap on the bar starts the strip again at that spot
  jumpKey: number;
  finish?: FinishRow;
}) {
  return (
    <View className="gap-3 pt-1 pb-5">
      <View className="flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        {shelf.gaps.length > 0 && !shelf.isEdition ? (
          <Text className="font-body-semibold text-[14.5px] text-ink">
            Not on your shelf: {shortRanges(shelf.gaps)}
          </Text>
        ) : null}
        <Link href={`/details/${manga.id}`} className="ml-auto">
          <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
            Open series
          </Text>
        </Link>
      </View>
      <ShelfStrip key={jumpKey} shelf={shelf} />
      {finish ? (
        <FinishList
          row={finish}
          series={priceName(manga)}
          owned={shelf.owned}
        />
      ) : null}
    </View>
  );
}
