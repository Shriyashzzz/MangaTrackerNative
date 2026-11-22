// The − 12 + counter of where they've read up to, as the web's
// pages/Details/ChapterStepper.tsx: a chapter, a volume, or a book of the
// edition they collect. Typed or stepped, it saves a moment after the last
// change, saves in order, and puts the saved number back when one fails.
// Leaving the page with a change not yet sent still sends it
import * as Haptics from "expo-haptics";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { apiFetch } from "@/core/lib/api";
import { saveOrKeep } from "@/core/lib/offlineChanges";
import { useColors } from "@/lib/colors";
import { useShelf } from "@/store/shelf";

// a moment after the last tap or key, so a run of taps is one save
const SAVE_AFTER_MS = 600;
const SAVED_SHOWN_MS = 2000;
const UNITS = {
  chapter: { max: 100000, path: "bookmark", field: "bookmark" },
  volume: { max: 999, path: "reading", field: "readVolume" },
} as const;
type Unit = keyof typeof UNITS;
// a chapter this far past the newest out is a slip of the finger
const PAST_THE_NEWEST = 100;

export type BookCounting = {
  count: number;
  // the volume saved for that many books read
  volumeAfter: (books: number) => number;
  // "vols. 1–3": what that book holds
  inside: (books: number) => string;
  savedVolume: number | null;
};

const savePlace = (mangaId: number, unit: Unit, place: number, from: number) =>
  saveOrKeep(mangaId, UNITS[unit].field, from, place, () =>
    apiFetch(`/api/manga/${mangaId}/${UNITS[unit].path}`, {
      method: "PATCH",
      body: { [UNITS[unit].field]: place },
    }),
  );

export default function ReadingStepper({
  mangaId,
  value,
  unit = "chapter",
  newest = null,
  onSaved,
  books,
}: {
  mangaId: number;
  value: number | null;
  unit?: Unit;
  // the newest chapter out that we know of
  newest?: number | null;
  onSaved: (shown: number) => void;
  // counting the edition's books, not volumes
  books?: BookCounting;
}) {
  const c = useColors();
  const max = books ? books.count : UNITS[unit].max;
  const counted = books ? "book" : unit;
  const toSave = (shown: number) => (books ? books.volumeAfter(shown) : shown);
  const toSaveNow = useRef(toSave);
  useEffect(() => {
    toSaveNow.current = toSave;
  });
  const [draft, setDraft] = useState(String(value ?? 0));
  const [note, setNote] = useState<"saved" | "failed" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    if (note !== "saved") return;
    const hide = setTimeout(() => setNote(null), SAVED_SHOWN_MS);
    return () => clearTimeout(hide);
  }, [note]);
  const saved = useRef(value ?? 0);
  const savedPlace = useRef(books ? (books.savedVolume ?? 0) : (value ?? 0));
  const pending = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const queue = useRef<Promise<unknown>>(Promise.resolve());

  const flush = async () => {
    const shown = pending.current;
    pending.current = null;
    if (shown == null || shown === saved.current) return;
    const save = queue.current.then(() =>
      savePlace(mangaId, unit, toSave(shown), savedPlace.current),
    );
    queue.current = save.catch(() => {});
    try {
      await save;
      saved.current = shown;
      savedPlace.current = toSave(shown);
      setNote("saved");
      onSaved(shown);
    } catch {
      // a newer change is on its way: that one decides
      if (pending.current != null) return;
      setDraft(String(saved.current));
      setNote("failed");
    }
  };

  const change = (next: string) => {
    setDraft(next);
    setNote(null);
    setProblem(null);
    clearTimeout(timer.current);
    pending.current = null;
    if (next === "") return;
    const n = Number(next);
    if (!Number.isInteger(n) || n < 0) {
      setProblem(
        Number.isFinite(n) && n > 0
          ? `Whole ${counted}s only. Try ${Math.floor(n)}.`
          : `That isn't a ${counted} number.`,
      );
      return;
    }
    if (n > max) {
      const many = { chapter: "Chapters", volume: "Volumes", book: "Books" };
      setProblem(`${many[counted]} go up to ${max.toLocaleString("en-US")}.`);
      return;
    }
    if (unit === "chapter" && newest && n > newest + PAST_THE_NEWEST) {
      setProblem(
        `Chapter ${newest.toLocaleString("en-US")} is the newest out.`,
      );
      return;
    }
    pending.current = n;
    timer.current = setTimeout(flush, SAVE_AFTER_MS);
  };

  // leaving with a change not sent yet: it's sent, and the shelf told
  useEffect(
    () => () => {
      clearTimeout(timer.current);
      const shown = pending.current;
      if (shown != null && shown !== saved.current)
        queue.current
          .then(() =>
            savePlace(
              mangaId,
              unit,
              toSaveNow.current(shown),
              savedPlace.current,
            ),
          )
          .then(() => useShelf.getState().load())
          .catch(() => {});
    },
    [mangaId, unit],
  );

  const current = Number(draft) || 0;
  const step = (by: number) => {
    Haptics.selectionAsync().catch(() => {});
    change(String(current + by));
  };
  const button = (
    by: number,
    label: string,
    glyph: string,
    disabled: boolean,
  ) => (
    <Pressable
      onPress={() => step(by)}
      disabled={disabled}
      accessibilityLabel={label}
      className={`h-11 w-11 items-center justify-center active:bg-accent-wash ${disabled ? "opacity-40" : ""}`}
    >
      <Text className="font-body-semibold text-[22px] text-ink">{glyph}</Text>
    </Pressable>
  );
  const said =
    problem ??
    (note === "saved"
      ? "Saved"
      : note === "failed"
        ? "That didn't save. Try again."
        : books
          ? books.inside(current)
          : null);

  return (
    <View className="flex-row items-center gap-2.5">
      <View className="flex-row items-center overflow-hidden rounded-[12px] bg-ink/10">
        {button(-1, `One ${counted} back`, "−", current <= 0)}
        <TextInput
          value={draft}
          onChangeText={change}
          onBlur={() => {
            if (draft === "" || problem) {
              setDraft(String(saved.current));
              setProblem(null);
            }
          }}
          keyboardType="number-pad"
          selectTextOnFocus
          accessibilityLabel={`${{ chapter: "Chapter", volume: "Volume", book: "Book" }[counted]} read up to`}
          // Android sets a box's text high: centred by hand, with the
          // font's own padding off, so the digits sit in the middle
          style={{
            minWidth: 44,
            color: c.ink,
            paddingVertical: 0,
            textAlignVertical: "center",
            includeFontPadding: false,
            lineHeight: 28,
          }}
          className="h-11 border-x border-line-soft px-1.5 text-center font-brand text-[24px]"
        />
        {"\u00A0"}
        {button(1, `One ${counted} on`, "+", current >= max)}
      </View>
      {said ? (
        <Text
          className={`shrink font-display-italic text-[13px] ${problem || note === "failed" ? "text-accent" : "text-ink-soft"}`}
        >
          {said}
        </Text>
      ) : null}
    </View>
  );
}
