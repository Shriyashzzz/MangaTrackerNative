// To buy, as the web's pages/ToBuy/ToBuy.tsx: the volumes they've kept to
// buy, what they'd cost new and used all together, each with its prices,
// On my shelf, Ordered and Remove, sorted their way, and Clear list.
// Marking one theirs whose series isn't on the shelf offers to add it
import Tap from "@/components/Tap";
import { Input } from "@/components/Field";
import { H2 } from "@/components/Page";
import Sheet from "@/components/Sheet";
import PullPage, { usePullTop } from "@/components/PullRefresh";
import Backdrop from "@/components/Backdrop";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AddSeriesModal from "@/components/AddSeriesModal";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import DrawnCover from "@/components/DrawnCover";
import Mascot from "@/components/Mascot";
import MenuSheet, { type MenuItem } from "@/components/MenuSheet";
import PickSheet from "@/components/PickSheet";
import Toast from "@/components/Toast";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@/core/components/icons/Icons";
import { coverSrc, formatCents, novelParts } from "@/core/lib/prices";
import {
  settleToBuy,
  inOwnOrder,
  sortToBuy,
  TO_BUY_SORTS,
  type AddedFromToBuy,
  type Settled,
  type ToBuyItem,
  type ToBuyList,
  type ToBuySort,
} from "@/core/lib/toBuy";
import { runsText } from "@/core/lib/volumeRuns";
import { releaseDay } from "@/core/pages/Prices/volumePageRules";
import { useColors } from "@/lib/colors";
import { openOutside } from "@/lib/openOutside";
import { phoneAlertsOn } from "@/lib/phoneAlerts";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import { useToBuy } from "@/store/toBuy";

const Safe = withUniwind(SafeAreaView);

const nameOf = (item: ToBuyItem) =>
  item.volume != null && !item.edition
    ? `${novelParts(item.series).title}, Vol. ${item.volume}`
    : novelParts(item.title).title;

function addedText(a: AddedFromToBuy, ticked: number[] = []) {
  const all =
    a.done === "owned"
      ? [...new Set([...(a.volumes ?? []), ...ticked])].sort((x, y) => x - y)
      : (a.volumes ?? []);
  const which = !all.length
    ? null
    : all.length === 1
      ? `vol. ${all[0]}`
      : `vols. ${runsText(all)}`;
  if (a.added) {
    if (!which || !a.done)
      return `Added ${a.name} to your shelf. Tick the volumes it holds there.`;
    return a.done === "owned"
      ? `Added ${which} of ${a.name} to your shelf.`
      : `Added ${a.name} to your shelf, ${which} ordered.`;
  }
  if (!which || !a.done) return `${a.name} was on your shelf already.`;
  return a.done === "owned"
    ? `${a.name} was on your shelf already: ${which} is yours there now.`
    : `${a.name} was on your shelf already: ${which} is ordered there now.`;
}

// what "On my shelf" or "Ordered" did, with the way on
function settledNote(
  item: ToBuyItem,
  settled: Settled,
): { text: string; link?: { label: string; go: () => void } } {
  const name = nameOf(item);
  if (settled.done && settled.shelf)
    return {
      text: `${name} is off the list, and ${settled.done === "owned" ? "yours" : "ordered"} on`,
      link: {
        label: settled.shelf.name,
        go: () =>
          router.push({
            pathname: "/details/[id]",
            params: { id: String(settled.shelf!.id) },
          }),
      },
    };
  if (settled.shelf)
    return {
      text: `${name} is off the list. Tick the volumes it holds on`,
      link: {
        label: settled.shelf.name,
        go: () =>
          router.push({
            pathname: "/details/[id]",
            params: { id: String(settled.shelf!.id) },
          }),
      },
    };
  const single = settled.volumes?.length === 1 ? settled.volumes[0] : null;
  const params: Record<string, string> = { title: settled.series };
  if (single && settled.done === null) params.ownedVolume = String(single);
  return {
    text: `${name} is off the list. ${settled.series} isn't on your shelf yet:`,
    link: {
      label: "add it",
      go: () => router.push({ pathname: "/add", params }),
    },
  };
}

// The ticket over the list: how many books, and what they'd cost new and
// used. A sum is said for how many of the books have a price of that kind
// when it isn't all of them ("Used · 1 of 2"); a dash when none has
type Sum = ToBuyList["totals"]["new"];
const sumLabel = (label: string, sum: Sum, of: number) =>
  sum.volumes && sum.volumes !== of
    ? `${label} · ${sum.volumes} of ${of}`
    : label;
const sumValue = (sum: Sum) => (sum.volumes ? formatCents(sum.cents) : "—");

const SUM_HEIGHT = 58;

function SumCell({
  label,
  value,
  first = false,
}: {
  label: string;
  value: string;
  first?: boolean;
}) {
  return (
    <>
      {first ? null : <Tear height={SUM_HEIGHT} />}
      <View
        className="flex-1 justify-center px-2.5"
        style={{ height: SUM_HEIGHT }}
      >
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.75}
          className="font-mono-medium text-[10.5px] tracking-[1px] text-ink-soft uppercase"
        >
          {label}
        </Text>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          className="font-brand pr-[6px] text-[22px] leading-[27px] text-ink uppercase"
        >
          {value}
          {"\u00A0"}
        </Text>
      </View>
    </>
  );
}

// "25", "25.5" or "$25.00" as cents; null for what isn't a price we can
// watch for (the server takes a cent up to a thousand dollars)
function centsOf(typed: string) {
  // "9,99" is nine ninety-nine on keyboards that offer a comma for the
  // point; "1,250" with a point elsewhere is a thousands comma
  const point = typed.includes(".") ? typed : typed.replace(",", ".");
  const amount = Number(point.replace(/[^0-9.]/g, ""));
  const cents = Math.round(amount * 100);
  return Number.isFinite(cents) && cents >= 1 && cents <= 100_000
    ? cents
    : null;
}

// the cheaper of a book's two prices, and the other one
function pricesOf(item: ToBuyItem) {
  const both = [
    item.new ? { kind: "new", ...item.new } : null,
    item.used ? { kind: "used", ...item.used } : null,
  ].filter((price) => price !== null);
  both.sort((a, b) => a.cents - b.cents);
  return { best: both[0] ?? null, other: both[1] ?? null };
}

const STUB_HEIGHT = 44;

// the dashed tear between two parts of the summary
function Tear({ height = STUB_HEIGHT }: { height?: number }) {
  const c = useColors();
  return (
    <Svg width={1.5} height={height}>
      <Line
        x1={0.75}
        y1={0}
        x2={0.75}
        y2={height}
        stroke={c.line}
        strokeWidth={1.5}
        strokeDasharray="4 3"
      />
    </Svg>
  );
}

const COVER_WIDTH = 66;

// One book on the list, as a card with one clear way to buy it: the
// cheapest copy and its store on a single button, the other copy as a line
// of text, their note and price alert as two chips, and everything else
// (On my shelf, Ordered, moving it, Remove) behind the ⋯ menu.
// A preorder with a price is bought the same way; one with none yet opens
// its own price page, where the preorder links are
function Card({
  item,
  busy,
  onOwned,
  onOrdered,
  onRemove,
  onNote,
  onAlert,
  move,
}: {
  item: ToBuyItem;
  // the book being saved just now, if any: nothing else can be tapped
  busy: string | null;
  onOwned: () => void;
  onOrdered: () => void;
  onRemove: () => void;
  onNote: () => void;
  // the price to be told at: set, changed or taken off
  onAlert: () => void;
  // "My order" is showing: the ways up and down (null at an end)
  move: { up: (() => void) | null; down: (() => void) | null } | null;
}) {
  const c = useColors();
  const [menuOpen, setMenuOpen] = useState(false);
  const coverUrl = item.coverUrl ?? item.seriesCoverUrl;
  const lightNovel =
    novelParts(item.title).lightNovel || novelParts(item.series).lightNovel;
  const [coverFailed, setCoverFailed] = useState(false);
  const coverBox = {
    width: COVER_WIDTH,
    aspectRatio: 2 / 3,
    borderWidth: 1.5,
    borderColor: c.line,
    backgroundColor: c.paper2,
    overflow: "hidden" as const,
  };
  const name = nameOf(item);
  const { best, other } = pricesOf(item);
  const open = () => router.push(`/prices/${item.isbn13}`);
  const waiting = busy !== null;
  const saving = busy === item.isbn13;
  // the store's own page for a copy, or this book's price page when the
  // copy has no link
  const toStore = (url: string | null | undefined) =>
    url ? openOutside(url) : open();
  const alertMet =
    item.alertCents != null && best != null && best.cents <= item.alertCents;
  const chip = "min-h-[32px] flex-1 justify-center rounded-full border px-3";
  const menu: MenuItem[] = [
    ...(!item.outOn ? [{ label: "On my shelf", onPress: onOwned }] : []),
    ...(item.outOn || item.volumes || item.edition
      ? [{ label: "Ordered", onPress: onOrdered }]
      : []),
    ...(move
      ? [
          {
            label: "Move up",
            onPress: move.up ?? (() => {}),
            disabled: !move.up,
          },
          {
            label: "Move down",
            onPress: move.down ?? (() => {}),
            disabled: !move.down,
          },
        ]
      : []),
    { label: "Remove from the list", onPress: onRemove, danger: true },
  ];
  return (
    <View className="gap-2.5 rounded-[16px] border border-line-soft bg-card p-3">
      <View className="flex-row gap-3">
        <Tap onPress={open}>
          {/* no picture for it (or it won't load, as with no connection):
              the series' name on a printed cover, as on the shelf */}
          {coverUrl && !coverFailed ? (
            <Image
              source={{ uri: coverSrc(coverUrl) }}
              style={coverBox}
              contentFit="cover"
              onError={() => setCoverFailed(true)}
            />
          ) : (
            <View style={coverBox}>
              <DrawnCover title={item.series || name} width={COVER_WIDTH - 3} />
            </View>
          )}
          {/* which book it is: a volume's number, or its edition in a few
              letters with the book's number ("DLX 10", "DEF 9"). Never
              wider than the cover: a long one ("3-IN-1 12") is set smaller */}
          {item.volume != null || item.editionShort ? (
            <View
              className="absolute top-0 left-0 bg-ink px-1.5"
              style={{ maxWidth: COVER_WIDTH }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                className="font-brand pr-[4px] text-[13px] text-paper"
              >
                {[item.editionShort, item.volume]
                  .filter((part) => part != null && part !== "")
                  .join(" ")}
                {"\u00A0"}
              </Text>
            </View>
          ) : null}
          {/* a light novel says so across the foot of its cover, over
              the picture: its name is shown without the words */}
          {lightNovel ? (
            <View
              className="absolute inset-x-0 bottom-0 items-center bg-ink px-1 py-[2px]"
              style={{ zIndex: 1 }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                className="font-mono-medium text-[8.5px] tracking-[0.5px] text-paper uppercase"
              >
                Light novel
              </Text>
            </View>
          ) : null}
        </Tap>
        <View className="min-w-0 flex-1 gap-1.5">
          <View className="flex-row items-start gap-2">
            <Tap onPress={open} className="min-w-0 flex-1">
              <Text
                numberOfLines={3}
                className="font-body-semibold text-[15.5px] leading-[20px] text-ink"
              >
                {name}
              </Text>
            </Tap>
            <Tap
              feel="round"
              onPress={() => setMenuOpen(true)}
              disabled={waiting}
              hitSlop={10}
              accessibilityLabel={`More for ${name}`}
              className="-mt-1 px-1"
            >
              <Text className="font-body-semibold text-[22px] leading-[24px] text-ink-soft">
                {saving ? "…" : "⋯"}
              </Text>
            </Tap>
          </View>
          {item.shelf?.state ? (
            <Text className="font-mono text-[11px] tracking-[0.5px] text-ok uppercase">
              {item.shelf.state === "owned" ? "Already yours" : "Ordered"}
            </Text>
          ) : null}
          {/* theirs: the note on it and the price to be told at, or the
              ways to add them. Two equal chips, so the row never ends short */}
          <View className="flex-row gap-2 pt-0.5">
            <Tap
              onPress={onNote}
              accessibilityLabel={
                item.note ? `Note: ${item.note}. Change` : "Add a note"
              }
              className={`${chip} border-line-soft`}
            >
              {item.note ? (
                <Text
                  numberOfLines={1}
                  className="font-display-italic text-[13.5px] text-ink"
                >
                  “{item.note}”
                </Text>
              ) : (
                <Text
                  numberOfLines={1}
                  className="font-body text-[12.5px] text-ink-soft"
                >
                  + Note
                </Text>
              )}
            </Tap>
            <Tap
              onPress={onAlert}
              accessibilityLabel={
                item.alertCents
                  ? `Alert under ${formatCents(item.alertCents)}. Change`
                  : "Set a price alert"
              }
              className={`${chip} ${item.alertCents ? "border-accent bg-accent-wash" : "border-line-soft"}`}
            >
              <Text
                numberOfLines={1}
                className={`font-body text-[12.5px] ${item.alertCents ? "text-accent-ink" : "text-ink-soft"}`}
              >
                {item.alertCents
                  ? // met already: said so, or "under $30" beside an $8
                    // book reads as a mistake
                    alertMet
                    ? `Under ${formatCents(item.alertCents)} now`
                    : `Alert under ${formatCents(item.alertCents)}`
                  : "+ Price alert"}
              </Text>
            </Tap>
          </View>
          {/* a preorder with a price: when it's out, under their chips (one
              with no price says so on its button) */}
          {best && item.outOn ? (
            <Text className="font-mono text-[12.5px] text-ink-soft">
              Out {releaseDay(item.outOn)}
            </Text>
          ) : null}
          {/* the other copy, beside the cover: the same button, quieter, so
              the cheaper one under it stays the obvious pick */}
          {other ? (
            <Tap
              onPress={() => toStore(other.url)}
              accessibilityRole="link"
              accessibilityLabel={`${formatCents(other.cents)} ${other.kind} at ${other.store}. Open the store`}
              className="min-h-[44px] flex-row items-center justify-between gap-2 rounded-[12px] bg-ink/10 px-3 py-1.5"
            >
              <Text className="font-brand pr-[6px] text-[21px] leading-[26px] text-ink">
                {formatCents(other.cents)}
                {"\u00A0"}
              </Text>
              <Text
                numberOfLines={2}
                className="min-w-0 shrink text-right font-body-semibold text-[12.5px] leading-[16px] text-ink"
              >
                {other.kind === "new" ? "New" : "Used"} at {other.store} →
              </Text>
            </Tap>
          ) : null}
        </View>
      </View>
      {/* the one clear way to buy it: the cheaper copy, full width */}
      {best ? (
        <Tap
          onPress={() => toStore(best.url)}
          accessibilityRole="link"
          accessibilityLabel={`${formatCents(best.cents)} ${best.kind} at ${best.store}. Open the store`}
          className="min-h-[46px] flex-row items-center justify-between gap-3 rounded-[12px] bg-accent px-3.5 py-2"
        >
          <Text className="font-brand pr-[6px] text-[23px] leading-[28px] text-on-accent">
            {formatCents(best.cents)}
            {"\u00A0"}
          </Text>
          <Text
            numberOfLines={1}
            className="min-w-0 shrink text-right font-body-semibold text-[13.5px] text-on-accent"
          >
            {item.outOn ? "Preorder" : best.kind === "new" ? "New" : "Used"} at{" "}
            {best.store} →
          </Text>
        </Tap>
      ) : (
        <Tap
          onPress={open}
          accessibilityRole="link"
          className="min-h-[46px] flex-row items-center justify-between gap-3 rounded-[12px] bg-ink/10 px-3.5 py-2"
        >
          {item.outOn ? (
            <Text className="font-brand pr-[6px] text-[21px] leading-[28px] text-ink uppercase">
              Out {releaseDay(item.outOn)}
              {"\u00A0"}
            </Text>
          ) : null}
          <Text
            numberOfLines={2}
            className="ml-auto min-w-0 shrink text-right font-body-semibold text-[13.5px] leading-[17px] text-ink"
          >
            {item.outOn ? "See the preorder page →" : "Check prices →"}
          </Text>
        </Tap>
      )}
      <MenuSheet
        open={menuOpen}
        title={name}
        items={menu}
        onClose={() => setMenuOpen(false)}
      />
    </View>
  );
}

// the orders the list can be shown in: the shared ones, and their own
// (set with the arrows on each row while it's the one shown)
const SORTS = [...TO_BUY_SORTS, { value: "mine", label: "My order" }] as const;
type ListSort = ToBuySort | "mine";

export default function ToBuyScreen() {
  const c = useColors();
  const { list, loadFailed, load, remove, clear } = useToBuy();
  const offerAdd = usePrefs((s) => s.prefs.offerAdd !== "off");
  const [busy, setBusy] = useState<string | null>(null);
  const [note, setNote] = useState<
    ReturnType<typeof settledNote> | { text: string } | null
  >(null);
  const [addAsking, setAddAsking] = useState<{
    item: ToBuyItem;
    settled: Settled;
    how: "owned" | "ordered";
  } | null>(null);
  const [added, setAdded] = useState<
    (AddedFromToBuy & { ticked: number[] }) | null
  >(null);
  const [sort, setSort] = useState<ListSort>("added");
  const setNoteOf = useToBuy((st) => st.setNote);
  const setAlertOf = useToBuy((st) => st.setAlert);
  // the price alert being set, if any: the book and what's typed
  const [alerting, setAlerting] = useState<{
    isbn13: string;
    text: string;
  } | null>(null);
  const setOrder = useToBuy((st) => st.setOrder);
  // the item whose note is being written, and the words so far
  const [noting, setNoting] = useState<{ isbn13: string; text: string } | null>(
    null,
  );
  const [pickingSort, setPickingSort] = useState(false);
  const pull = usePullTop();
  useEffect(() => {
    void load();
  }, [load]);

  const settle = async (item: ToBuyItem, how: "owned" | "ordered") => {
    setBusy(item.isbn13);
    setNote(null);
    try {
      const settled = await settleToBuy(item.isbn13, how);
      await load();
      if (!settled.shelf && offerAdd) setAddAsking({ item, settled, how });
      else setNote(settledNote(item, settled));
    } catch (e) {
      setNote({ text: (e as Error).message });
    } finally {
      setBusy(null);
    }
  };
  const takeOff = async (item: ToBuyItem) => {
    setBusy(item.isbn13);
    setNote(null);
    try {
      await remove(item.isbn13);
      setNote({ text: `${nameOf(item)} is off the list.` });
    } catch {
      setNote({ text: "That didn't save. Try again." });
    } finally {
      setBusy(null);
    }
  };
  const askToClear = () => {
    const count = items?.length ?? 0;
    Alert.alert(
      "Clear your To buy list?",
      `This takes ${count === 1 ? "1 volume" : `all ${count} volumes`} off the list. Your shelf doesn't change. It can't be undone.`,
      [
        { text: "Keep the list", style: "cancel" },
        {
          text: "Clear it",
          style: "destructive",
          onPress: () =>
            void clear().catch(() =>
              Alert.alert("That didn't clear it. Try again."),
            ),
        },
      ],
    );
  };
  const items = list?.items;
  const sorted = useMemo(
    () =>
      sort === "mine" ? inOwnOrder(items ?? []) : sortToBuy(items ?? [], sort),
    [items, sort],
  );
  const sortLabel = SORTS.find((s) => s.value === sort)?.label ?? "";
  // one item a place up or down in their own order: the whole list is saved
  // in its new order, so every item has a place from then on
  const move = (at: number, by: -1 | 1) => {
    const to = at + by;
    if (to < 0 || to >= sorted.length) return;
    const isbns = sorted.map((item) => item.isbn13);
    [isbns[at], isbns[to]] = [isbns[to]!, isbns[at]!];
    void setOrder(isbns).catch(() =>
      Alert.alert("That didn't save. Try again."),
    );
  };
  // the price to be told at: what's typed, in the money's own units
  const alertCents = alerting ? centsOf(alerting.text) : null;
  // the book the alert is for, and its cheapest copy now: a price at or
  // over that is said to be met already
  const alertingItem = sorted.find((item) => item.isbn13 === alerting?.isbn13);
  const alertingBest = alertingItem ? pricesOf(alertingItem).best : null;
  const saveAlert = (cents: number | null) => {
    if (!alerting) return;
    const { isbn13 } = alerting;
    setAlerting(null);
    void setAlertOf(isbn13, cents).catch(() =>
      Alert.alert("That didn't save. Try again."),
    );
  };
  const saveNote = () => {
    if (!noting) return;
    const { isbn13, text } = noting;
    setNoting(null);
    void setNoteOf(isbn13, text).catch(() =>
      Alert.alert("That didn't save. Try again."),
    );
  };
  const removeNote = () => {
    if (!noting) return;
    const { isbn13 } = noting;
    setNoting(null);
    void setNoteOf(isbn13, "").catch(() =>
      Alert.alert("That didn't save. Try again."),
    );
  };
  const link = (label: string, go: () => void) => (
    <Text className="font-body-semibold text-ink underline" onPress={go}>
      {label}
    </Text>
  );

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <Backdrop />
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Tap
          feel="round"
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Tap>
        <Text className="flex-1 font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase">
          To buy
          {"\u00A0"}
        </Text>
      </View>
      <DoubleRule />
      <PullPage refresh={load} scrollTop={pull.top}>
        <ScrollView
          // nothing to list (empty, or it didn't load): Kenji and his line sit
          // in the middle of the screen, not up under the header
          contentContainerClassName={`gap-4 px-4 pt-4 pb-24 ${items?.length === 0 || (!items && loadFailed) ? "grow justify-center" : ""}`}
          overScrollMode="never"
          scrollEventThrottle={16}
          onScroll={pull.track}
        >
          {!items && loadFailed ? (
            <View className="items-center gap-3 py-8">
              <Mascot mood="panic" width={100} />
              <Text className="font-body text-[15px] text-ink-soft">
                Your list didn't load.
              </Text>
              <Button
                center
                label="Try again"
                small
                onPress={() => void load()}
              />
            </View>
          ) : null}
          {items?.length === 0 ? (
            <View className="items-center gap-3 py-8">
              <Mascot mood="confused" width={100} />
              <Text className="text-center font-body text-[15px] text-ink-soft">
                Open a volume's prices and tap “+ To buy” to keep it here.
              </Text>
              <Button
                center
                label="Browse every series"
                small
                onPress={() => router.push("/prices")}
              />
            </View>
          ) : null}
          {note ? (
            <Text className="font-body text-[14.5px] text-ink-soft">
              {note.text}
              {"link" in note && note.link ? (
                <> {link(note.link.label, note.link.go)}.</>
              ) : null}
            </Text>
          ) : null}
          {items && items.length > 0 && list ? (
            <>
              <View className="flex-row border-[1.5px] border-line bg-card">
                <SumCell
                  label="On the list"
                  value={
                    items.length === 1 ? "1 volume" : `${items.length} volumes`
                  }
                  first
                />
                <SumCell
                  label={sumLabel("New", list.totals.new, items.length)}
                  value={sumValue(list.totals.new)}
                />
                <SumCell
                  label={sumLabel("Used", list.totals.used, items.length)}
                  value={sumValue(list.totals.used)}
                />
              </View>
              <View className="flex-row items-center justify-between gap-3">
                <Tap
                  onPress={() => setPickingSort(true)}
                  className="flex-row items-center gap-1"
                  accessibilityLabel={`Sorted by ${sortLabel}. Change`}
                >
                  <Text className="font-body text-[14px] text-ink-soft">
                    Sorted by
                  </Text>
                  <Text className="font-body-semibold text-[14px] text-ink">
                    {sortLabel}
                  </Text>
                  <ChevronDownIcon color={c.ink} width={14} height={14} />
                </Tap>
                <Tap onPress={askToClear} hitSlop={6}>
                  <Text className="font-body text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
                    Clear list
                  </Text>
                </Tap>
              </View>
              {sorted.map((item, i) => (
                <Card
                  key={item.isbn13}
                  item={item}
                  busy={busy}
                  onOwned={() => void settle(item, "owned")}
                  onOrdered={() => void settle(item, "ordered")}
                  onRemove={() => void takeOff(item)}
                  onNote={() =>
                    setNoting({ isbn13: item.isbn13, text: item.note ?? "" })
                  }
                  onAlert={() =>
                    setAlerting({
                      isbn13: item.isbn13,
                      text: item.alertCents
                        ? (item.alertCents / 100).toFixed(2)
                        : "",
                    })
                  }
                  // their own order: up and down, only while it's the order
                  // shown
                  move={
                    sort === "mine"
                      ? {
                          up: i > 0 ? () => move(i, -1) : null,
                          down: i < sorted.length - 1 ? () => move(i, 1) : null,
                        }
                      : null
                  }
                />
              ))}
            </>
          ) : null}
        </ScrollView>
      </PullPage>
      <Sheet open={noting !== null} onClose={() => setNoting(null)}>
        <View className="gap-3 pb-4">
          <H2>Your note</H2>
          <Input
            value={noting?.text ?? ""}
            onChangeText={(text) =>
              setNoting((now) => (now ? { ...now, text } : now))
            }
            placeholder="Wait for a sale, a gift for…"
            maxLength={140}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={saveNote}
          />
          <View className="flex-row items-center justify-end gap-3">
            {/* only when there's one saved to remove */}
            {sorted.find((item) => item.isbn13 === noting?.isbn13)?.note ? (
              <Tap onPress={removeNote} hitSlop={6} className="mr-auto">
                <Text className="font-body text-[14px] text-ink-soft underline">
                  Remove note
                </Text>
              </Tap>
            ) : null}
            <Button small label="Cancel" onPress={() => setNoting(null)} />
            <Button small kind="primary" label="Save" onPress={saveNote} />
          </View>
        </View>
      </Sheet>
      <Sheet open={alerting !== null} onClose={() => setAlerting(null)}>
        <View className="gap-3 pb-4">
          <H2>Price alert</H2>
          <Text className="font-body text-[14.5px] leading-[20px] text-ink-soft">
            An alert on this phone when a copy, new or used, is at or under your
            price.
          </Text>
          <Input
            value={alerting?.text ?? ""}
            onChangeText={(text) =>
              setAlerting((now) => (now ? { ...now, text } : now))
            }
            placeholder="25.00"
            keyboardType="decimal-pad"
            maxLength={8}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={() => {
              if (alertCents) saveAlert(alertCents);
            }}
          />
          {alertCents && alertingBest && alertingBest.cents <= alertCents ? (
            <Text className="font-body text-[13.5px] leading-[19px] text-ink-soft">
              It's {formatCents(alertingBest.cents)} right now, already under
              that.
            </Text>
          ) : null}
          {phoneAlertsOn() ? null : (
            <Text className="font-body text-[13.5px] leading-[19px] text-ink-soft">
              Alerts are off on this phone.{" "}
              <Text
                className="font-body-semibold text-ink underline"
                onPress={() => {
                  setAlerting(null);
                  router.push({
                    pathname: "/settings",
                    params: { tab: "new-releases" },
                  });
                }}
              >
                Turn them on
              </Text>{" "}
              to be told.
            </Text>
          )}
          <View className="flex-row items-center justify-end gap-3">
            {alertingItem?.alertCents ? (
              <Tap
                onPress={() => saveAlert(null)}
                hitSlop={6}
                className="mr-auto"
              >
                <Text className="font-body text-[14px] text-ink-soft underline">
                  Remove alert
                </Text>
              </Tap>
            ) : null}
            <Button small label="Cancel" onPress={() => setAlerting(null)} />
            <Button
              small
              kind="primary"
              label="Save"
              disabled={!alertCents}
              onPress={() => {
                if (alertCents) saveAlert(alertCents);
              }}
            />
          </View>
        </View>
      </Sheet>
      <PickSheet
        open={pickingSort}
        title="Sort by"
        options={SORTS}
        picked={sort}
        onPick={setSort}
        onClose={() => setPickingSort(false)}
      />
      {addAsking ? (
        <AddSeriesModal
          item={addAsking.item}
          settled={addAsking.settled}
          how={addAsking.how}
          bookName={nameOf(addAsking.item)}
          onDone={(result, ticked) => {
            const { item, settled } = addAsking;
            setAddAsking(null);
            if (!result) return setNote(settledNote(item, settled));
            setNote(null);
            setAdded({ ...result, ticked });
            void useShelf.getState().load();
          }}
        />
      ) : null}
      {added ? (
        <Toast
          key={`${added.id}:${added.ticked.join()}`}
          text={addedText(added, added.ticked)}
          action="See it"
          onAction={() =>
            router.push({
              pathname: "/details/[id]",
              params: { id: String(added.id) },
            })
          }
          onGone={() => setAdded(null)}
        />
      ) : null}
    </Safe>
  );
}
