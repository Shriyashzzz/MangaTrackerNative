// To buy, as the web's pages/ToBuy/ToBuy.tsx: the volumes they've kept to
// buy, what they'd cost new and used all together, each with its prices,
// On my shelf, Ordered and Remove, sorted their way, and Clear list.
// Marking one theirs whose series isn't on the shelf offers to add it
import { Image } from "expo-image";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AddSeriesModal from "@/components/AddSeriesModal";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import Mascot from "@/components/Mascot";
import PickSheet from "@/components/PickSheet";
import Toast from "@/components/Toast";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@/core/components/icons/Icons";
import { coverSrc, formatCents, novelParts } from "@/core/lib/prices";
import {
  settleToBuy,
  sortToBuy,
  TO_BUY_SORTS,
  type AddedFromToBuy,
  type Settled,
  type ToBuyItem,
  type ToBuyList,
  type ToBuyPrice,
  type ToBuySort,
} from "@/core/lib/toBuy";
import { runsText } from "@/core/lib/volumeRuns";
import { releaseDay } from "@/core/pages/Prices/volumePageRules";
import { useColors } from "@/lib/colors";
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

const Price = ({ label, price }: { label: string; price: ToBuyPrice }) =>
  price ? (
    <Text className="font-mono text-[13px] text-ink-soft">
      {label}{" "}
      <Text className="font-mono-medium text-ink">
        {formatCents(price.cents)}
      </Text>{" "}
      at {price.store}
    </Text>
  ) : null;

const Total = ({
  label,
  sum,
  of,
}: {
  label: string;
  sum: ToBuyList["totals"]["new"];
  of: number;
}) =>
  sum.volumes ? (
    <Text className="font-body text-[15px] text-ink">
      {label}:{" "}
      <Text className="font-brand pr-1 text-[20px]">
        {formatCents(sum.cents)}
      </Text>{" "}
      for {sum.volumes === of ? `all ${of}` : `${sum.volumes} of ${of}`}
    </Text>
  ) : null;

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
  const [sort, setSort] = useState<ToBuySort>("added");
  const [pickingSort, setPickingSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
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
  const sorted = useMemo(() => sortToBuy(items ?? [], sort), [items, sort]);
  const sortLabel = TO_BUY_SORTS.find((s) => s.value === sort)?.label ?? "";
  const link = (label: string, go: () => void) => (
    <Text className="font-body-semibold text-ink underline" onPress={go}>
      {label}
    </Text>
  );

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Pressable>
        <Text className="flex-1 font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase">
          To buy
        </Text>
      </View>
      <DoubleRule />
      <ScrollView
        contentContainerClassName="gap-4 px-4 pt-4 pb-24"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load().finally(() => setRefreshing(false));
            }}
            colors={[c.accent]}
          />
        }
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
            <View className="gap-1 rounded-[14px] border border-line-soft bg-card p-3">
              <Text className="font-brand pr-1 text-[20px] tracking-[1px] text-ink uppercase">
                {items.length === 1 ? "1 volume" : `${items.length} volumes`} to
                buy
              </Text>
              <Total label="New" sum={list.totals.new} of={items.length} />
              <Total label="Used" sum={list.totals.used} of={items.length} />
              {!list.totals.new.volumes && !list.totals.used.volumes ? (
                <Text className="font-body text-[14px] text-ink-soft">
                  No prices found for these yet.
                </Text>
              ) : null}
            </View>
            <View className="flex-row items-center justify-between gap-3">
              <Pressable
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
              </Pressable>
              <Pressable onPress={askToClear} hitSlop={6}>
                <Text className="font-body text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
                  Clear list
                </Text>
              </Pressable>
            </View>
            <View className="rounded-[14px] border border-line-soft bg-card">
              {sorted.map((item, i) => (
                <View
                  key={item.isbn13}
                  className={`gap-3 px-3 py-3 ${i ? "border-t-[1.5px] border-dashed border-line-soft" : ""}`}
                >
                  <View className="flex-row gap-3">
                    <Pressable
                      onPress={() => router.push(`/prices/${item.isbn13}`)}
                    >
                      <Image
                        source={{
                          uri: coverSrc(
                            item.coverUrl ?? item.seriesCoverUrl ?? "",
                          ),
                        }}
                        style={{
                          width: 60,
                          aspectRatio: 2 / 3,
                          borderWidth: 1.5,
                          borderColor: c.line,
                          backgroundColor: c.paper2,
                        }}
                        contentFit="cover"
                      />
                      {item.volume != null && !item.edition ? (
                        <View className="absolute top-0 left-0 bg-ink px-1.5">
                          <Text className="font-brand pr-1 text-[13px] text-paper">
                            {item.volume}
                          </Text>
                        </View>
                      ) : null}
                    </Pressable>
                    <View className="min-w-0 flex-1 gap-1">
                      <Pressable
                        onPress={() => router.push(`/prices/${item.isbn13}`)}
                      >
                        <Text className="font-body-semibold text-[15.5px] text-ink">
                          {nameOf(item)}
                        </Text>
                      </Pressable>
                      {item.shelf?.state ? (
                        <Text className="font-mono text-[11px] tracking-[0.5px] text-ok uppercase">
                          {item.shelf.state === "owned"
                            ? "Already yours"
                            : "Ordered"}
                        </Text>
                      ) : null}
                      <Price label="New" price={item.new} />
                      <Price label="Used" price={item.used} />
                      {!item.new && !item.used ? (
                        <Text className="font-mono text-[13px] text-ink-soft">
                          {item.outOn ? (
                            <>
                              Preorder. Out{" "}
                              <Text className="font-mono-medium text-ink">
                                {releaseDay(item.outOn)}
                              </Text>
                            </>
                          ) : (
                            "No price yet"
                          )}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <View className="flex-row flex-wrap items-center gap-3">
                    {!item.outOn ? (
                      <Button
                        label={busy === item.isbn13 ? "Saving…" : "On my shelf"}
                        kind="primary"
                        small
                        disabled={busy !== null}
                        onPress={() => void settle(item, "owned")}
                      />
                    ) : null}
                    {item.outOn || item.volumes || item.edition ? (
                      <Button
                        label="Ordered"
                        small
                        disabled={busy !== null}
                        onPress={() => void settle(item, "ordered")}
                      />
                    ) : null}
                    <Pressable
                      onPress={() => void takeOff(item)}
                      disabled={busy !== null}
                      hitSlop={6}
                    >
                      <Text className="font-body text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
                        Remove
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : null}
      </ScrollView>
      <PickSheet
        open={pickingSort}
        title="Sort by"
        options={TO_BUY_SORTS}
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
