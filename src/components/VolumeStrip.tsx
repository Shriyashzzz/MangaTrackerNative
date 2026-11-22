// A series' books on one shelf, as the Android app's (web components/
// volumeShelf/VolumeShelf.tsx, its page of full-size books for a finger):
// theirs stand tall in ink, the rest dashed and shorter, the one they're in
// red. ‹ › turn the page. A tap owns a book or takes it off; a sideways slide
// does every book it passes (starting on one that's theirs takes them off),
// and sliding back gives the books it leaves what they were. Back on the book
// it started on, the whole slide is taken back. A tick for each book the
// slide reaches. Up and down is the page scrolling, never a slide.
// An edition's shelf passes `slots`: then each "volume" is a slot, a book of
// the edition or a single it has no book for, as on the web
import {
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@/core/components/icons/Icons";
import { BOOK } from "@/core/lib/volumeShelf";
import { useColors } from "@/lib/colors";
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";

// room for each ‹ ›, as the web's NAV
const NAV = 36;
// a book's padding either side (web .vshelf-page .vshelf-book)
const GAP = 3;

export type StripSlots = {
  // a book at full size: thicker than a single volume
  bookWidth: number;
  // what's lettered on its spine
  spine: (slot: number) => string;
  // how much of it is theirs when not all, 0 to 1
  share: (slot: number) => number;
  // the name over a run's first spine: the edition's ("Deluxe"), or "Singles"
  runName: (slot: number) => string;
  // where an edition's books give way to singles (or back)
  startsRun: (slot: number) => boolean;
};

type Props = {
  total: number;
  owned: number[];
  onToggle: (volume: number) => void;
  // a slide: everything they own now
  onPaint: (owned: number[]) => void;
  // a slide began (the page keeps what they owned then, and works every
  // step of the slide from that, never from a state still being saved)
  onSlideStart?: () => void;
  // a slide ended (the page offers its Undo)
  onSlideDone?: () => void;
  // the volume they're in, drawn red
  here?: number | null;
  // a page opens near this one; else where they are, or the next after theirs
  opensAt?: number | null;
  slots?: StripSlots;
  // ordered and on their way: drawn in outline red, said in the name
  ordered?: number[];
};

// Android's own light click; a phone without one just stays still
const tick = () => {
  Haptics.selectionAsync().catch(() => {});
};

export default function VolumeStrip({
  total,
  owned,
  ordered = [],
  onToggle,
  onPaint,
  onSlideStart,
  onSlideDone,
  here = null,
  opensAt = null,
  slots,
}: Props) {
  const c = useColors();
  const yours = new Set(owned);
  const onTheWay = new Set(ordered);
  const [width, setWidth] = useState(0);
  const [pageStart, setPageStart] = useState<number | null>(null);
  const full = (slots?.bookWidth ?? BOOK) + 2 * GAP;

  // the page
  const perPage = Math.max(5, Math.floor((width - 2 * NAV) / full));
  const lastStart = Math.max(1, total - perPage + 1);
  const nextUp = Math.floor(Math.max(0, ...owned)) + 1;
  const near = opensAt ?? here ?? nextUp;
  const from = Math.min(
    lastStart,
    Math.max(1, pageStart ?? Math.min(near, total) - 2),
  );
  const to = Math.min(total, from + perPage - 1);
  const page = Array.from(
    { length: Math.max(0, to - from + 1) },
    (_, i) => from + i,
  );
  const pageWidth = page.length * full;
  // where the books start in the gesture's area (between the arrows), centred
  const pageLeft = Math.max(0, (width - 2 * NAV - pageWidth) / 2);
  const bookAt = (x: number) => {
    const i = Math.floor((x - pageLeft) / full);
    return i >= 0 && i < page.length ? page[i]! : null;
  };

  // a slide under way: where it started, which way, what they had
  const slide = useRef<{
    from: number;
    up: boolean;
    before: number[];
    at: number;
    left: boolean;
  } | null>(null);
  const startSlide = (x: number) => {
    const v = bookAt(x);
    if (v == null) return;
    setPageStart(from);
    onSlideStart?.();
    slide.current = {
      from: v,
      up: !yours.has(v),
      before: owned,
      at: v,
      left: false,
    };
    tick();
    onPaint(
      yours.has(v)
        ? owned.filter((x) => x !== v)
        : [...owned, v].sort((a, b) => a - b),
    );
  };
  const moveSlide = (x: number) => {
    const s = slide.current;
    const v = bookAt(x);
    if (!s || v == null || v === s.at) return;
    s.at = v;
    tick();
    // back on the book it started on after leaving it: all of it taken back
    if (v === s.from && s.left) {
      onPaint(s.before);
      return;
    }
    if (v !== s.from) s.left = true;
    const next = new Set(s.before);
    for (let n = Math.min(s.from, v); n <= Math.max(s.from, v); n++) {
      if (s.up) next.add(n);
      else next.delete(n);
    }
    onPaint([...next].sort((a, b) => a - b));
  };
  const endSlide = () => {
    const s = slide.current;
    slide.current = null;
    if (s) onSlideDone?.();
  };
  const tapAt = (x: number) => {
    const v = bookAt(x);
    if (v == null) return;
    setPageStart(from);
    tick();
    onToggle(v);
  };

  // sideways is a slide; up and down fails it, so the page scrolls instead
  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-12, 12],
    runOnJS: true,
    onActivate: (e) => startSlide(e.x),
    onUpdate: (e) => moveSlide(e.x),
    onFinalize: () => endSlide(),
  });
  const tap = useTapGesture({ runOnJS: true, onActivate: (e) => tapAt(e.x) });
  const gesture = useExclusiveGestures(pan, tap);

  const turn = (later: boolean) =>
    setPageStart(
      later ? Math.min(lastStart, from + perPage) : Math.max(1, from - perPage),
    );

  const runs = Boolean(slots);
  const height = runs ? 84 : 68;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
    >
      <View style={{ height }} className="flex-row items-end">
        <Pressable
          accessibilityLabel="Earlier volumes"
          disabled={from <= 1}
          onPress={() => turn(false)}
          style={{ width: NAV, height: 66 }}
          className={`items-center justify-center ${from <= 1 ? "opacity-0" : ""}`}
        >
          <ChevronLeftIcon color={c.ink} width={22} height={22} />
        </Pressable>
        {/* the books are the gesture's; the arrows keep their own taps */}
        <GestureDetector gesture={gesture}>
          <View className="h-full flex-1 flex-row items-end justify-center pb-[2px]">
            {page.map((v) => (
              <Book
                key={v}
                v={v}
                width={full}
                theirs={yours.has(v)}
                ordered={!yours.has(v) && onTheWay.has(v)}
                here={here === v}
                spine={slots?.spine(v) ?? String(v)}
                share={!yours.has(v) && slots ? slots.share(v) : 0}
                runName={
                  slots && (v === page[0] || slots.startsRun(v))
                    ? slots.runName(v)
                    : null
                }
                apart={Boolean(slots?.startsRun(v))}
              />
            ))}
          </View>
        </GestureDetector>
        <Pressable
          accessibilityLabel="Later volumes"
          disabled={to >= total}
          onPress={() => turn(true)}
          style={{ width: NAV, height: 66 }}
          className={`items-center justify-center ${to >= total ? "opacity-0" : ""}`}
        >
          <ChevronRightIcon color={c.ink} width={22} height={22} />
        </Pressable>
      </View>
      {/* the shelf they stand on: the web's 3px double rule */}
      <View className="h-[3px] justify-between">
        <View className="h-px bg-line" />
        <View className="h-px bg-line" />
      </View>
    </View>
  );
}

// one spine (web .vshelf-book and its i): its height and ink say whose it is
function Book({
  v,
  width,
  theirs,
  here,
  spine,
  share,
  runName,
  apart,
  ordered = false,
}: {
  v: number;
  width: number;
  theirs: boolean;
  ordered?: boolean;
  here: boolean;
  spine: string;
  share: number;
  runName: string | null;
  apart: boolean;
}) {
  let height = 42;
  let look = "border-[1.5px] border-dashed border-muted bg-paper";
  let ink = "text-muted";
  if (theirs) {
    height = 54;
    look = "bg-ink";
    ink = "text-paper";
  }
  if (here) {
    height = theirs ? 54 : 50;
    look = "border-[1.5px] border-accent bg-accent";
    ink = "text-on-accent";
  }
  if (share > 0 && !theirs && !here) {
    look = "border-[1.5px] border-ink bg-paper";
    ink = "text-ink";
  }
  if (ordered && !theirs && !here) {
    look = "border-[1.5px] border-dashed border-accent bg-accent-wash";
    ink = "text-accent-ink";
  }
  return (
    <View
      style={{ width, paddingHorizontal: GAP / 2, marginLeft: apart ? 7 : 0 }}
      accessibilityLabel={`Vol. ${v}, ${theirs ? "yours" : ordered ? "ordered" : "not yours yet"}`}
    >
      {/* the run's name hangs over its first spines at full width, as the
          web's: never cut down to one book's width */}
      {runName ? (
        <Text
          numberOfLines={1}
          style={{ width: 120 }}
          className="absolute -top-4 left-0 font-brand pr-[4px] text-[11px] tracking-[1px] text-ink-soft uppercase"
        >
          {runName}
        </Text>
      ) : null}
      <View
        style={{ height }}
        className={`items-center justify-end overflow-hidden pb-[3px] ${look} ${here ? "outline-2 outline-ink" : ""}`}
      >
        {/* part of an edition's book theirs: inked part of the way down */}
        {share > 0 && !theirs && !here ? (
          <View
            className="absolute inset-x-0 top-0 bg-ink"
            style={{ height: `${20 + share * 35}%` }}
          />
        ) : null}
        <Text className={`font-brand pr-[4px] text-[13px] ${ink}`}>
          {spine}
        </Text>
      </View>
    </View>
  );
}
