// Which volumes they own, on the add and edit forms: a little bookcase, as
// the web's (components/volumePicker/VolumePicker.tsx). Each volume is a
// spine on a shelf; theirs stand up inked, the rest lean pale. Tap a spine
// to stand it up or lay it down; slide across spines to do a run at once,
// starting on one that's down stands them up, on one that's up lays them
// down, and sliding back gives the spines it leaves back what they were.
// "Up to vol." types a run. Whole shelves of ten they own fold into one box
// set. For a series collected as an edition the bookcase holds that
// edition's books instead: tap a book to own every volume in it
import * as Haptics from "expo-haptics";
import { useRef, useState } from "react";
import { Pressable, Text, View, type LayoutChangeEvent } from "react-native";
import {
  GestureDetector,
  useExclusiveGestures,
  usePanGesture,
  useTapGesture,
} from "react-native-gesture-handler";
import {
  ownedCaption,
  shareOwned,
  slotName,
  spineOf,
  stateOf,
  toggleSlot,
  type EditionShelf,
} from "@/core/lib/editionShelf";
import { ownedOf, ownedVolumes, rangesText } from "@/core/lib/ownedVolumes";
import { useColors } from "@/lib/colors";
import { Field, Input } from "./Field";

// spines to start with, and how many more each tap adds: whole shelves
const FIRST_SHOWN = 20;
const MORE = 10;
// how far past the newest the list knows "Up to vol." goes
const PAST_THE_NEWEST = 3;
const roundUp = (n: number) => Math.ceil(n / MORE) * MORE;
const sorted = (set: Set<number>) => [...set].sort((a, b) => a - b);

// a shelf's slot and spine, in points (the web's phone sizes)
const SLOT_W = 30;
const SLOT_H = 64;
const SPINE_W = 20;
const UP_H = 58;
const DOWN_H = 44;
const BOOK_SLOT_W = 38;
const BOOK_W = 26;

type Start = { volumesOwned: number | null; ownedList?: number[] };
// whole shelves of ten they own, two or more in a row, as [first, last] shelf
type Run = [number, number];
function fullRuns(list: number[]): Run[] {
  const set = new Set(list);
  const full = (shelf: number) =>
    Array.from({ length: MORE }, (_, i) => shelf * MORE + i + 1).every((v) =>
      set.has(v),
    );
  const last = list.length ? Math.floor(list[list.length - 1]! / MORE) : -1;
  const runs: Run[] = [];
  for (let shelf = 0; shelf <= last; shelf++) {
    if (!full(shelf)) continue;
    let end = shelf;
    while (end + 1 <= last && full(end + 1)) end++;
    if (end > shelf) runs.push([shelf, end]);
    shelf = end;
  }
  return runs;
}

const tick = () => {
  Haptics.selectionAsync().catch(() => {});
};

export type VolumePickerHandle = {
  owned: number[];
  reset: (to: Start) => void;
};

export function useVolumePicker(start: Start) {
  const [owned, setOwned] = useState<number[]>(() => ownedOf(start));
  const [folds, setFolds] = useState<Run[]>(() => fullRuns(ownedOf(start)));
  const top = owned[owned.length - 1] ?? 0;
  const [shown, setShown] = useState(() =>
    Math.max(FIRST_SHOWN, roundUp(top + 1)),
  );
  const reset = (to: Start) => {
    const list = ownedOf(to);
    setOwned(list);
    setFolds(fullRuns(list));
    setShown(Math.max(FIRST_SHOWN, roundUp((list[list.length - 1] ?? 0) + 1)));
  };
  return {
    owned,
    setOwned,
    folds,
    setFolds,
    shown,
    setShown,
    reset,
    saved: ownedVolumes(null, owned),
  };
}
export type VolumePickerState = ReturnType<typeof useVolumePicker>;

function Spine({
  n,
  up,
  book,
  part = 0,
  single = false,
}: {
  n: number | string;
  up: boolean;
  book?: boolean;
  part?: number;
  single?: boolean;
}) {
  const c = useColors();
  const w = book && !single ? BOOK_W : SPINE_W;
  const h = up ? UP_H : part ? 51 : DOWN_H;
  return (
    <View
      style={{
        width: w,
        height: h,
        borderWidth: 1.5,
        borderColor: up || part ? c.line : `${c.inkSoft}73`,
        borderStyle: up || part ? "solid" : "dashed",
        backgroundColor: up ? c.ink : c.paper,
        transform: up || part ? [] : [{ rotate: "4deg" }],
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 4,
        overflow: "hidden",
      }}
    >
      {part ? (
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 0,
            height: `${20 + part * 35}%`,
            backgroundColor: c.ink,
          }}
        />
      ) : null}
      <Text
        className="font-brand"
        style={{
          fontSize: String(n).length >= 3 ? 11.5 : 14.5,
          lineHeight: 15,
          color: up ? c.paper : part ? c.ink : c.muted,
        }}
      >
        {n}
      </Text>
    </View>
  );
}

const Slot = ({
  children,
  book = false,
  width,
}: {
  children: React.ReactNode;
  book?: boolean;
  width?: number;
}) => {
  const c = useColors();
  return (
    <View
      style={{
        width: width ?? (book ? BOOK_SLOT_W : SLOT_W),
        height: SLOT_H,
        alignItems: "center",
        justifyContent: "flex-end",
        paddingBottom: 2,
        borderBottomWidth: 3,
        borderBottomColor: c.line,
        borderStyle: "solid",
      }}
    >
      {children}
    </View>
  );
};

export default function VolumePicker({
  picker,
  out,
  edition = null,
}: {
  picker: VolumePickerState;
  // how many volumes are out, as far as the price list knows
  out?: number | null;
  // the edition they collect, and its books; null for single volumes
  edition?: EditionShelf | null;
}) {
  const c = useColors();
  const { owned, setOwned, folds, setFolds, shown, setShown, saved } = picker;
  const top = owned[owned.length - 1] ?? 0;
  const [upToText, setUpToText] = useState<string | null>(null);
  const typingFrom = useRef<number[] | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const perRow = Math.max(1, Math.floor(width / SLOT_W));

  const known = out && out > 0 ? Math.max(out, Math.ceil(top)) : null;
  const [grown, setGrown] = useState(false);
  const spines = Array.from(
    {
      length: Math.max(
        known && !grown ? Math.min(shown, known) : shown,
        Math.ceil(top),
      ),
    },
    (_, i) => i + 1,
  );
  const inBox = (v: number) =>
    folds.some(([first, last]) => v > first * MORE && v <= (last + 1) * MORE);

  // the shelves as rows: a box set takes a row of its own
  type RowOf =
    { kind: "box"; run: Run } | { kind: "spines"; from: number; to: number };
  const rows: RowOf[] = [];
  for (let shelf = 0; shelf * MORE < spines.length; shelf++) {
    const run = folds.find(([first]) => first === shelf);
    if (run) {
      rows.push({ kind: "box", run });
      shelf = run[1];
      continue;
    }
    if (folds.some(([first, last]) => shelf > first && shelf <= last)) continue;
    rows.push({
      kind: "spines",
      from: shelf * MORE + 1,
      to: Math.min((shelf + 1) * MORE, spines.length),
    });
  }
  // the shelf rows as they wrap, perRow spines a row (the web's ten)
  const ROW_GAP = 8;
  const change = (vols: number[], up: boolean) =>
    setOwned((list) => {
      const next = new Set(list);
      for (const v of vols)
        if (up) next.add(v);
        else next.delete(v);
      return sorted(next);
    });

  // the spine under a point, or a box set's nearest edge
  const spineAt = (
    x: number,
    y: number,
    from: number | null,
  ): number | null => {
    let yTop = 0;
    for (const row of rows) {
      const rowH = SLOT_H + ROW_GAP;
      if (row.kind === "box") {
        if (y >= yTop && y < yTop + rowH) {
          const first = row.run[0] * MORE + 1;
          const last = (row.run[1] + 1) * MORE;
          return from == null ? null : from > last ? last : first;
        }
        yTop += rowH;
        continue;
      }
      const count = row.to - row.from + 1;
      const lines = Math.ceil(count / perRow);
      if (y >= yTop && y < yTop + lines * rowH) {
        const line = Math.floor((y - yTop) / rowH);
        const col = Math.min(perRow - 1, Math.max(0, Math.floor(x / SLOT_W)));
        const n = row.from + line * perRow + col;
        return n <= row.to ? n : null;
      }
      yTop += lines * rowH;
    }
    return null;
  };

  const painting = useRef<null | {
    from: number;
    up: boolean;
    before: number[];
    at: number | null;
    left: boolean;
  }>(null);
  const paintTo = (to: number) => {
    const drag = painting.current;
    if (!drag) return;
    if (drag.at !== to) tick();
    drag.at = to;
    if (to === drag.from && drag.left) return setOwned(drag.before);
    if (to !== drag.from) drag.left = true;
    const next = new Set(drag.before);
    const lo = Math.min(drag.from, to);
    const hi = Math.max(drag.from, to);
    for (let v = lo; v <= hi; v++) {
      if (inBox(v)) continue;
      if (drag.up) next.add(v);
      else next.delete(v);
    }
    setOwned(sorted(next));
  };
  const endTyping = () => {
    setUpToText(null);
    typingFrom.current = null;
  };
  const pan = usePanGesture({
    activeOffsetX: [-8, 8],
    failOffsetY: [-8, 8],
    runOnJS: true,
    onActivate: (e) => {
      const v = spineAt(e.x, e.y, null);
      if (v == null) return;
      painting.current = {
        from: v,
        up: !owned.includes(v),
        before: owned,
        at: null,
        left: false,
      };
      paintTo(v);
      endTyping();
    },
    onUpdate: (e) => {
      const v = spineAt(e.x, e.y, painting.current?.from ?? null);
      if (v != null) paintTo(v);
    },
    onFinalize: () => {
      painting.current = null;
    },
  });
  const tap = useTapGesture({
    runOnJS: true,
    onActivate: (e) => {
      const v = spineAt(e.x, e.y, null);
      if (v == null) return;
      tick();
      change([v], !owned.includes(v));
      endTyping();
    },
  });
  const gesture = useExclusiveGestures(pan, tap);

  // typed: 1 to N stand up, and every volume above N stays
  const run = !saved.ownedList.length ? saved.volumesOwned : null;
  const typeUpTo = (text: string) => {
    typingFrom.current ??= owned;
    const before = typingFrom.current;
    setUpToText(text);
    if (!text.trim()) {
      setOwned(before);
      setFolds(fullRuns(before));
      return;
    }
    const most =
      out && out > 0 ? Math.max(out + PAST_THE_NEWEST, ...before) : 999;
    const typed = Math.floor(Number(text));
    const n = Math.min(999, most, typed);
    if (!(n >= 1)) return;
    if (n < typed) setUpToText(String(n));
    const list = [
      ...new Set([
        ...ownedOf({ volumesOwned: n }),
        ...before.filter((v) => v > n),
      ]),
    ].sort((a, b) => a - b);
    setOwned(list);
    setFolds(fullRuns(list));
    setShown(Math.max(FIRST_SHOWN, roundUp(Math.max(n, ...list) + 1)));
  };

  const ownedWhole = owned.filter((v) => Number.isInteger(v) && v >= 1).length;
  let said = "None yet";
  if (owned.length)
    said = `${ownedWhole}${known ? ` of ${known}` : ""} on your shelf · vol. ${rangesText(owned)}`;
  else if (known) said = `None yet · ${known} volumes out`;
  const offShelf = owned.filter(
    (v) => !Number.isInteger(v) || v > spines.length,
  );
  const link = "font-body-medium text-[14px] text-ink-soft underline";

  // ---------- the same bookcase, holding an edition's books ----------
  if (edition) {
    const slots = edition.slots;
    const tapSlot = (number: number) => {
      const slot = slots[number - 1];
      if (!slot) return;
      if (stateOf(slot, owned) === "part") return setAsking(number);
      setAsking(null);
      tick();
      setOwned(toggleSlot(slot, owned));
    };
    const askedSlot = asking ? slots[asking - 1] : null;
    const inASlot = new Set(slots.flatMap((slot) => slot.volumes));
    const offEditionShelf = owned.filter((v) => !inASlot.has(v));
    return (
      <Field label="Your shelf" optional>
        <Text className="font-body text-[13.5px] text-ink-soft">
          Each spine is a {edition.line.label} book. Tap the ones you own.
        </Text>
        <View className="flex-row flex-wrap" style={{ rowGap: ROW_GAP }}>
          {slots.map((slot, i) => {
            const state = stateOf(slot, owned);
            return (
              <Pressable
                key={i}
                onPress={() => tapSlot(i + 1)}
                accessibilityLabel={slotName(edition.line, slot, owned)}
                accessibilityState={{ selected: state === "all" }}
              >
                <Slot
                  book={Boolean(slot.book)}
                  width={slot.book ? BOOK_SLOT_W : SLOT_W}
                >
                  <Spine
                    n={spineOf(slot)}
                    up={state === "all"}
                    book
                    part={
                      state === "part" ? shareOwned(slots, owned, i + 1) : 0
                    }
                    single={!slot.book}
                  />
                </Slot>
              </Pressable>
            );
          })}
        </View>
        {askedSlot ? (
          <View className="flex-row flex-wrap items-baseline gap-x-3 gap-y-1">
            <Text className="font-body text-[13.5px] text-ink-soft">
              {slotName(edition.line, askedSlot, owned)}. Own the whole book?
            </Text>
            <Pressable
              onPress={() => {
                setAsking(null);
                setOwned(toggleSlot(askedSlot, owned));
              }}
              hitSlop={6}
            >
              <Text className={link}>Yes, all of it</Text>
            </Pressable>
            <Pressable onPress={() => setAsking(null)} hitSlop={6}>
              <Text className={link}>No</Text>
            </Pressable>
          </View>
        ) : null}
        <View className="flex-row flex-wrap items-baseline justify-between gap-x-4">
          <Text className="font-mono text-[13px] text-ink-soft">
            {owned.length ? ownedCaption(slots, owned) : "None yet"}
          </Text>
          {owned.length ? (
            <Pressable
              onPress={() => {
                setOwned([]);
                setAsking(null);
              }}
              hitSlop={6}
            >
              <Text className={link}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
        {offEditionShelf.length ? (
          <Text className="font-body text-[13.5px] text-ink-soft">
            Also: vol. {rangesText(offEditionShelf)}
          </Text>
        ) : null}
      </Field>
    );
  }

  return (
    <Field
      label="Your shelf"
      optional
      aside={
        <View className="flex-row items-center gap-2">
          <Text className="font-body text-[14px] text-ink-soft">
            Up to vol.
          </Text>
          <Input
            keyboardType="number-pad"
            placeholder="e.g. 12"
            value={upToText ?? (run ? String(run) : "")}
            onChangeText={typeUpTo}
            onBlur={endTyping}
            className="w-[88px] text-center font-mono"
          />
        </View>
      }
    >
      {/* what the spines are, said once */}
      <Text className="font-body text-[13.5px] text-ink-soft">
        Each spine is a volume. Tap the ones you own, or hold and slide to mark
        several.
      </Text>
      <GestureDetector gesture={gesture}>
        <View
          onLayout={(e: LayoutChangeEvent) =>
            setWidth(e.nativeEvent.layout.width)
          }
          style={{ rowGap: ROW_GAP }}
        >
          {rows.map((row) =>
            row.kind === "box" ? (
              <Pressable
                key={`box-${row.run[0]}`}
                onPress={() =>
                  setFolds((all) => all.filter((r) => r !== row.run))
                }
                accessibilityLabel={`Vols. ${row.run[0] * MORE + 1} to ${(row.run[1] + 1) * MORE}, all yours. Open to change`}
                style={{
                  height: SLOT_H,
                  borderBottomWidth: 3,
                  borderBottomColor: c.line,
                  justifyContent: "flex-end",
                  paddingBottom: 2,
                }}
              >
                <View
                  style={{
                    height: UP_H,
                    borderWidth: 1.5,
                    borderColor: c.line,
                    backgroundColor: c.ink,
                  }}
                  className="flex-row items-center justify-between px-4"
                >
                  <Text className="font-brand pr-1 text-[20px] tracking-[1px] text-paper uppercase">
                    Vols. {row.run[0] * MORE + 1}–{(row.run[1] + 1) * MORE}
                  </Text>
                  <Text className="font-body text-[13px] text-paper/75">
                    all yours · open
                  </Text>
                </View>
              </Pressable>
            ) : (
              <View
                key={`row-${row.from}`}
                className="flex-row flex-wrap"
                style={{ rowGap: ROW_GAP }}
              >
                {Array.from(
                  { length: row.to - row.from + 1 },
                  (_, i) => row.from + i,
                ).map((v) => (
                  <Slot key={v}>
                    <Spine n={v} up={owned.includes(v)} />
                  </Slot>
                ))}
              </View>
            ),
          )}
        </View>
      </GestureDetector>
      <View className="flex-row flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <Text className="shrink font-mono text-[13px] text-ink-soft">
          {said}
        </Text>
        <View className="flex-row gap-4">
          <Pressable
            onPress={() => {
              setGrown(true);
              setShown((n) => Math.max(n, spines.length) + MORE);
            }}
            hitSlop={6}
          >
            <Text className={link}>
              {known && spines.length >= known
                ? `Show vols. ${spines.length + 1}–${spines.length + MORE}`
                : `Show ${MORE} more`}
            </Text>
          </Pressable>
          {owned.length ? (
            <Pressable
              onPress={() => {
                setOwned([]);
                setFolds([]);
                endTyping();
                setShown(FIRST_SHOWN);
              }}
              hitSlop={6}
            >
              <Text className={link}>Clear</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      {offShelf.length ? (
        <Text className="font-body text-[13.5px] text-ink-soft">
          Also: vol. {rangesText(offShelf)}
        </Text>
      ) : null}
      {out != null && out > 0 && top > out ? (
        <Text className="font-body text-[13.5px] text-ink-soft">
          Only {out} {out === 1 ? "volume is" : "volumes are"} out as far as we
          know. Check vol. {Math.ceil(top)} is right.
        </Text>
      ) : null}
    </Field>
  );
}
