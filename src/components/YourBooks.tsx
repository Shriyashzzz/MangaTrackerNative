// What they own of a series, book by book, and what each cost them (the
// web's pages/Details/YourBooks.tsx): "Deluxe 2 (vols. 4–6)" as a scan or an
// import recorded it, and every volume ticked by hand as a row of its own.
// Each row takes what they paid and the day they bought it; a hand-ticked
// volume becomes a book the moment it's given one. Folded away, with what
// they've spent beside its name. The rows are the web's (core yourBooksRows)
import { useEffect, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { centsOf, spentOn, type OwnedBook } from "@/core/lib/books";
import {
  addBooks,
  getBooks,
  ownEditionBook,
  removeBook,
  savePurchase,
} from "@/core/lib/booksApi";
import {
  editionBookLabel,
  insideText,
  isSameBook,
  type EditionLine,
} from "@/core/lib/editions";
import type { EditionShelf } from "@/core/lib/editionShelf";
import { ownedVolumes, rangesText } from "@/core/lib/ownedVolumes";
import { formatPaid } from "@/core/lib/prices";
import { setVolumesOwned } from "@/core/lib/shelf";
import {
  newBookOf,
  rowName,
  rowsOf,
  volumesOf,
  type BookRow as Row,
} from "@/core/pages/Details/yourBooksRows";
import { ChevronDownIcon, CloseIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { LendDialog, RemoveBooksDialog } from "./BookActions";
import BookRow, { type Purchase } from "./BookRow";
import Button from "./Button";
import FoldRow from "./FoldRow";
import PickSheet from "./PickSheet";

// the last book of a line the catalog lists: past it, books are only worked
// out from the series' volumes and may not be out
const lastListedIndex = (line: EditionLine) =>
  line.books.reduce((last, book, i) => (book.listed ? i : last), -1);

type Owned = { volumesOwned: number | null; ownedList: number[] };

// how many rows show at first, and how many each press adds
const STEP = 5;
// the most books the server takes in one request
const MOST_AT_ONCE = 50;
const PRIVATE_NOTE = "What you paid is only yours to see.";
const REMOVE_NOTE = " Removing a book takes its volumes off your shelf too.";

export default function YourBooks({
  mangaId,
  owned,
  onRemoved,
  lines,
  collects,
  onAdded,
  booksChanged,
}: {
  mangaId: number;
  owned: number[];
  // a book removed took its volumes with it
  onRemoved: (owned: Owned) => void;
  lines: EditionLine[];
  // the edition they collect, as the shelf shows it
  collects: EditionShelf | null;
  // a book added put its volumes on the shelf
  onAdded: (owned: Owned) => void;
  // goes up when a book was added somewhere else (Buy next): asked again
  booksChanged: number;
}) {
  const c = useColors();
  const [books, setBooks] = useState<OwnedBook[]>([]);
  const [loadedFor, setLoadedFor] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [samePrice, setSamePrice] = useState("");
  const [settingSame, setSettingSame] = useState(false);
  const [shown, setShown] = useState(STEP);
  const [adding, setAdding] = useState<string | null>(null);
  const [pickingToAdd, setPickingToAdd] = useState(false);
  const [addingNow, setAddingNow] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [lending, setLending] = useState<Row[] | null>(null);
  const [removing, setRemoving] = useState<Row[] | null>(null);
  const stopSelecting = () => {
    setSelecting(false);
    setSelected(new Set());
  };
  const toggle = (key: string) =>
    setSelected((now) => {
      const next = new Set(now);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  // the books are asked for again whenever the owned volumes change
  const ownedKey = owned.join();
  useEffect(() => {
    const controller = new AbortController();
    getBooks(mangaId, controller.signal)
      .then((list) => {
        setBooks(list);
        setLoadedFor(mangaId);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [mangaId, ownedKey, booksChanged]);

  const rows = rowsOf(books, owned, collects);
  const shownFromTicks = new Set(
    rows.flatMap(({ ofEdition: e }) =>
      e ? [`${e.line.key}:${e.book.number}`] : [],
    ),
  );
  // the edition books not recorded yet, to pick one they own
  const toAdd = lines.flatMap((line) =>
    line.books
      .filter((_, i) => i <= lastListedIndex(line))
      .filter((book) => !books.some((b) => isSameBook(b, line, book)))
      .filter((book) => !shownFromTicks.has(`${line.key}:${book.number}`))
      .map((book) => ({
        key: `${line.key}:${book.number}`,
        label: `${editionBookLabel(line, book)} (${insideText(book)})`,
        line,
        book,
      })),
  );
  const picked = toAdd.find((o) => o.key === adding) ?? toAdd[0];
  const failed = () => setNote("That didn't save. Try again.");
  const addPicked = async () => {
    if (!picked) return;
    setNote("");
    setAddingNow(true);
    try {
      const added = await ownEditionBook(
        mangaId,
        owned,
        picked.line,
        picked.book,
      );
      onAdded(added.owned);
      if (!added.books) return failed();
      setBooks(added.books);
      setAdding(null);
    } catch {
      failed();
    } finally {
      setAddingNow(false);
    }
  };

  if (!owned.length && !toAdd.length) return null;

  const canRemove = rows.length > 0;
  const spent = spentOn(books);
  const unpriced = rows.filter((row) => row.book?.paidCents == null);

  const save = async (row: Row, change: Purchase) => {
    setNote("");
    try {
      if (row.book) {
        const bookId = row.book.id;
        await savePurchase(mangaId, bookId, change);
        setBooks((list) =>
          list.map((book) =>
            book.id === bookId
              ? {
                  ...book,
                  ...change,
                  ...("lentTo" in change
                    ? {
                        lentOn: change.lentTo
                          ? new Date().toISOString().slice(0, 10)
                          : null,
                      }
                    : {}),
                }
              : book,
          ),
        );
        return;
      }
      // a hand-ticked volume has no book to keep it on: only a value makes one
      const hasValue =
        change.paidCents != null ||
        Boolean(change.boughtOn) ||
        Boolean(change.lentTo);
      if (!hasValue) return;
      setBooks(await addBooks(mangaId, [{ ...newBookOf(row), ...change }]));
    } catch {
      failed();
    }
  };

  const setSamePriceOnAll = async () => {
    const cents = centsOf(samePrice);
    if (cents === null || !unpriced.length) return;
    setSettingSame(true);
    setNote("");
    try {
      for (const row of unpriced)
        if (row.book)
          await savePurchase(mangaId, row.book.id, { paidCents: cents });
      const newBooks = unpriced
        .filter((row) => !row.book)
        .map((row) => ({ ...newBookOf(row), paidCents: cents }));
      for (let start = 0; start < newBooks.length; start += MOST_AT_ONCE)
        await addBooks(mangaId, newBooks.slice(start, start + MOST_AT_ONCE));
      setBooks(await getBooks(mangaId));
      setSamePrice("");
    } catch {
      failed();
    } finally {
      setSettingSame(false);
    }
  };

  const remove = async (row: Row) => {
    const book = row.book;
    setNote("");
    try {
      if (book) {
        onRemoved(await removeBook(mangaId, book.id));
        setBooks((list) => list.filter((b) => b.id !== book.id));
      } else {
        const gone = new Set(volumesOf(row));
        onRemoved(
          await setVolumesOwned(
            mangaId,
            ownedVolumes(
              null,
              owned.filter((v) => !gone.has(v)),
            ),
          ),
        );
      }
    } catch {
      failed();
    }
  };

  const removeMany = async (gone: Row[]) => {
    setNote("");
    try {
      for (const row of gone)
        if (row.book) onRemoved(await removeBook(mangaId, row.book.id));
      const goneBooks = new Set(gone.flatMap((row) => row.book?.id ?? []));
      setBooks((list) => list.filter((b) => !goneBooks.has(b.id)));
      const loose = new Set(
        gone.filter((row) => !row.book).flatMap((row) => volumesOf(row)),
      );
      if (loose.size)
        onRemoved(
          await setVolumesOwned(
            mangaId,
            ownedVolumes(
              null,
              owned.filter((v) => !loose.has(v)),
            ),
          ),
        );
      stopSelecting();
      return true;
    } catch {
      return false;
    }
  };

  const lendAll = async (rowsLent: Row[], name: string) => {
    try {
      for (const row of rowsLent) await save(row, { lentTo: name });
      stopSelecting();
      return true;
    } catch {
      return false;
    }
  };

  // names they've lent this series' books to, newest first, for a tap
  const pastNames = [
    ...new Set(
      [...books]
        .sort((a, b) => (b.lentOn ?? "").localeCompare(a.lentOn ?? ""))
        .flatMap((b) => (b.lentTo ? [b.lentTo] : [])),
    ),
  ].slice(0, 4);
  const pickedRows = rows.filter((row) => selected.has(row.key));
  const shortName = (row: Row) =>
    rowName(row).replace(/\s*\(vols?\.[^)]*\)$/, "");
  const namesOf = (list: Row[]) => {
    const names = list.map(shortName);
    return names.length <= 1
      ? (names[0] ?? "")
      : `${names.slice(0, -1).join(", ")} and ${names.at(-1)}`;
  };
  const volumesText = (list: Row[]) => {
    const all = list.flatMap((row) => volumesOf(row)).sort((a, b) => a - b);
    return `${all.length === 1 ? "vol." : "vols."} ${rangesText(all)}`;
  };

  const hidden = rows.length - shown;
  return (
    <FoldRow
      title="Your books"
      count={rows.length}
      aside={
        spent.books > 0
          ? `${formatPaid(spent.cents)} paid${spent.books < rows.length ? ` for ${spent.books}` : ""}`
          : undefined
      }
    >
      {selecting ? (
        <View className="mb-2 flex-row items-center gap-3 rounded-[4px] bg-ink px-3 py-2">
          <Pressable
            onPress={stopSelecting}
            hitSlop={8}
            accessibilityLabel="Done selecting"
          >
            <CloseIcon color={c.paper} width={20} height={20} />
          </Pressable>
          <Text className="flex-1 font-body-medium text-[15px] text-paper">
            {selected.size} selected
          </Text>
          <Pressable
            onPress={() => setLending(pickedRows)}
            disabled={!selected.size}
            hitSlop={6}
          >
            <Text
              className={`font-body-semibold text-[14px] text-paper ${selected.size ? "" : "opacity-40"}`}
            >
              Lend
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRemoving(pickedRows)}
            disabled={!selected.size}
            hitSlop={6}
          >
            <Text
              className={`font-body-semibold text-[14px] text-accent ${selected.size ? "" : "opacity-40"}`}
            >
              Remove
            </Text>
          </Pressable>
        </View>
      ) : canRemove && rows.length > 1 ? (
        <Pressable
          onPress={() => setSelecting(true)}
          hitSlop={6}
          className="mb-1 self-end"
        >
          <Text className="font-body-medium text-[14px] text-ink-soft underline">
            Select
          </Text>
        </Pressable>
      ) : null}
      {rows.slice(0, shown).map((row) => (
        <BookRow
          key={row.key}
          row={row}
          onSave={(r, change) => void save(r, change)}
          onRemove={(r) => void remove(r)}
          onLend={(one) => setLending([one])}
          select={
            selecting
              ? {
                  picked: selected.has(row.key),
                  onToggle: () => toggle(row.key),
                }
              : undefined
          }
          onLongPress={() => {
            setSelecting(true);
            setSelected(new Set([row.key]));
          }}
        />
      ))}
      {lending ? (
        <LendDialog
          what={
            lending.length === 1
              ? shortName(lending[0]!)
              : `these ${lending.length} books`
          }
          pastNames={pastNames}
          onLend={(name) => lendAll(lending, name)}
          onClose={() => setLending(null)}
        />
      ) : null}
      {removing ? (
        <RemoveBooksDialog
          count={removing.length}
          names={namesOf(removing)}
          volumes={volumesText(removing)}
          onRemove={() => removeMany(removing)}
          onClose={() => setRemoving(null)}
        />
      ) : null}
      {hidden > 0 ? (
        <View className="flex-row items-baseline gap-4 py-2">
          <Pressable onPress={() => setShown(shown + STEP)} hitSlop={6}>
            <Text className="font-body-semibold text-[14px] text-ink underline">
              Show {Math.min(STEP, hidden)} more
            </Text>
          </Pressable>
          {hidden > STEP ? (
            <Pressable onPress={() => setShown(rows.length)} hitSlop={6}>
              <Text className="font-body-semibold text-[14px] text-ink underline">
                Show all {rows.length}
              </Text>
            </Pressable>
          ) : null}
          <Text className="ml-auto font-mono text-[12.5px] text-muted">
            {shown} of {rows.length}
          </Text>
        </View>
      ) : null}
      {unpriced.length > 1 ? (
        <View className="mt-3 flex-row flex-wrap items-center gap-2">
          <Text className="font-body text-[14px] text-ink-soft">
            {unpriced.length === rows.length
              ? `Same price for all ${rows.length}?`
              : `Same price for the other ${unpriced.length}?`}
          </Text>
          <View className="flex-row items-center rounded-[2px] border-[1.5px] border-line-soft bg-paper px-2">
            <Text className="font-mono text-[13px] text-muted">$</Text>
            <TextInput
              value={samePrice}
              onChangeText={setSamePrice}
              keyboardType="decimal-pad"
              placeholder="price"
              placeholderTextColor={c.muted}
              style={{ minWidth: 72 }}
              className="py-1.5 pl-1 font-mono text-[14px] text-ink"
            />
          </View>
          <Button
            label={`Apply to ${unpriced.length}`}
            small
            disabled={settingSame || centsOf(samePrice) === null}
            onPress={() => void setSamePriceOnAll()}
          />
        </View>
      ) : null}
      {loadedFor === mangaId && toAdd.length > 0 && picked ? (
        <View className="mt-3 gap-2">
          <Text className="font-body text-[14px] text-ink-soft">
            Add a book you own
          </Text>
          <View className="flex-row items-center gap-2">
            <Pressable
              onPress={() => setPickingToAdd(true)}
              className="min-w-0 flex-1 flex-row items-center justify-between gap-2 rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3 py-2.5"
            >
              <Text
                numberOfLines={1}
                className="shrink font-body text-[14.5px] text-ink"
              >
                {picked.label}
              </Text>
              <ChevronDownIcon color={c.inkSoft} width={16} height={16} />
            </Pressable>
            <Button
              label={addingNow ? "Adding…" : "Add"}
              small
              disabled={addingNow}
              onPress={() => void addPicked()}
            />
          </View>
          <PickSheet
            open={pickingToAdd}
            title="Add a book you own"
            options={toAdd.map((o) => ({ value: o.key, label: o.label }))}
            picked={picked.key}
            onPick={setAdding}
            onClose={() => setPickingToAdd(false)}
          />
        </View>
      ) : null}
      <Text className="mt-3 font-body text-[13px] text-muted">
        {note || `${PRIVATE_NOTE}${canRemove ? REMOVE_NOTE : ""}`}
      </Text>
    </FoldRow>
  );
}
