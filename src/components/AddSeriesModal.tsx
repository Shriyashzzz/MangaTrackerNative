// "Add it to your shelf?", from To buy (the web's pages/ToBuy/
// AddSeriesModal.tsx): a book marked On my shelf or Ordered whose series
// isn't on the shelf yet. Its name, To read or Reading (and the chapter),
// the series' spines to tick the other volumes they own, and Don't ask again
import { useEffect, useRef, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { getSeries, novelParts } from "@/core/lib/prices";
import { onSale } from "@/core/lib/releaseDate";
import {
  addSeriesFromToBuy,
  type AddedFromToBuy,
  type Settled,
  type ToBuyItem,
} from "@/core/lib/toBuy";
import type { Series } from "@/core/lib/types";
import { usePrefs } from "@/store/prefs";
import Button from "./Button";
import { Field, Input } from "./Field";
import Segmented from "./Segmented";
import SeriesCover from "./SeriesCover";
import Switch from "./Switch";
import VolumeStrip from "./VolumeStrip";

const PLACES = [
  { value: "planned", label: "To read" },
  { value: "reading", label: "Reading" },
] as const;

export default function AddSeriesModal({
  item,
  settled,
  how,
  bookName,
  onDone,
}: {
  item: ToBuyItem;
  settled: Settled;
  how: "owned" | "ordered";
  bookName: string;
  onDone: (added: AddedFromToBuy | null, ticked: number[]) => void;
}) {
  const savePrefs = usePrefs((s) => s.save);
  const [name, setName] = useState(() => novelParts(settled.series).title);
  const [planned, setPlanned] = useState(true);
  const [lookedUp, setLookedUp] = useState(name);
  const [found, setFound] = useState<{
    name: string;
    series: Series | null;
  } | null>(null);
  const plain = lookedUp.trim();
  const series = !plain
    ? null
    : found?.name === plain
      ? found.series
      : undefined;
  useEffect(() => {
    if (!plain) return;
    const asked = new AbortController();
    getSeries(
      settled.lightNovel ? `${plain} Light Novel` : plain,
      asked.signal,
      true,
    )
      .then((s) => setFound({ name: plain, series: s }))
      .catch((e: Error) => {
        if (e.name !== "AbortError") setFound({ name: plain, series: null });
      });
    return () => asked.abort();
  }, [plain, settled.lightNovel]);
  const book = settled.volumes ?? [];
  const [owned, setOwned] = useState<number[]>(how === "owned" ? book : []);
  const [chapter, setChapter] = useState("");
  const out = series
    ? onSale(series.volumes)
        .map((v) => v.volume)
        .filter((v): v is number => v != null && Number.isInteger(v))
    : [];
  const outCount = out.length ? Math.max(...out) : 0;
  const spines = Math.max(outCount, ...book, ...owned, 1);
  const [dontAsk, setDontAsk] = useState(false);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState("");
  const result = useRef<AddedFromToBuy | null>(null);

  const close = () => {
    if (dontAsk) void savePrefs({ offerAdd: "off" }).catch(() => {});
    onDone(result.current, owned);
  };
  const add = async () => {
    if (saving) return;
    setSaving(true);
    setFailed("");
    try {
      const read = Number(chapter);
      result.current = await addSeriesFromToBuy(item.isbn13, {
        name: name.trim(),
        planned,
        how,
        owned,
        bookmark: !planned && Number.isInteger(read) && read > 0 ? read : null,
      });
      close();
    } catch (error) {
      setFailed((error as Error).message);
      setSaving(false);
    }
  };
  const sure = Boolean(settled.volumes?.length);

  return (
    <Modal
      visible
      transparent
      animationType="slide"
      onRequestClose={saving ? () => {} : close}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={saving ? undefined : close}
        accessibilityLabel="Close"
      />
      <View className="max-h-[88%] rounded-t-2xl bg-card">
        <ScrollView
          contentContainerClassName="gap-4 px-5 pt-3 pb-4"
          keyboardShouldPersistTaps="handled"
        >
          <View className="h-1 w-9 self-center rounded-full bg-muted/50" />
          <Text className="font-display text-[22px] text-ink">
            Add it to your shelf?
          </Text>
          <View className="flex-row items-center gap-3">
            <SeriesCover
              name={name || settled.series}
              url={series?.info?.coverUrl ?? null}
              width={56}
            />
            <View className="min-w-0 flex-1">
              <Text className="font-body-semibold text-[16px] text-ink">
                {series?.info?.name ?? (name || settled.series)}
              </Text>
              <Text className="font-body text-[13.5px] text-ink-soft">
                {series === undefined
                  ? "Looking it up…"
                  : outCount
                    ? `${outCount} volume${outCount === 1 ? "" : "s"} out in English`
                    : "Not in the catalog yet"}
              </Text>
            </View>
          </View>
          <Text className="font-body text-[14.5px] text-ink-soft">
            {bookName} is {how === "owned" ? "yours" : "ordered"}, but its
            series isn't on your shelf yet.
          </Text>
          <Field label="Series name">
            <Input
              value={name}
              maxLength={150}
              onChangeText={setName}
              onBlur={() => setLookedUp(name)}
              editable={!saving}
            />
          </Field>
          <Field label="Put it in">
            <Segmented
              label="Put it in"
              options={PLACES}
              value={planned ? "planned" : "reading"}
              onChange={(v) => setPlanned(v === "planned")}
            />
          </Field>
          {!planned ? (
            <Field label="Read up to chapter" optional>
              <Input
                keyboardType="number-pad"
                value={chapter}
                onChangeText={(t) => setChapter(t.replace(/\D/g, ""))}
                editable={!saving}
              />
            </Field>
          ) : null}
          {item.edition ? (
            <Text className="font-body text-[14px] text-ink-soft">
              It's added as that edition: tick its books on its page after.
            </Text>
          ) : (
            <View className="gap-2">
              <Text className="font-body text-[14px] text-ink-soft">
                {how === "owned"
                  ? "Tap any others you own"
                  : "Tap the ones you own already"}
              </Text>
              <VolumeStrip
                total={spines}
                owned={owned}
                here={null}
                opensAt={null}
                ordered={how === "ordered" ? book : []}
                onToggle={(v) =>
                  setOwned((now) =>
                    now.includes(v)
                      ? now.filter((x) => x !== v)
                      : [...now, v].sort((a, b) => a - b),
                  )
                }
                onPaint={setOwned}
              />
              {!sure ? (
                <Text className="font-body text-[13px] text-muted">
                  We can't tell which volumes this book holds: tick them here.
                </Text>
              ) : null}
            </View>
          )}
          <Switch
            label="Don't ask again"
            value={dontAsk}
            onChange={setDontAsk}
          />
          {failed ? (
            <Text className="font-body-medium text-[14px] text-accent">
              {failed}
            </Text>
          ) : null}
        </ScrollView>
        <View className="flex-row justify-end gap-3 border-t border-line-soft px-5 py-3 pb-6">
          <Button label="Not now" small disabled={saving} onPress={close} />
          <Button
            label={saving ? "Adding…" : "Add to my shelf"}
            kind="primary"
            small
            disabled={saving || !name.trim()}
            onPress={() => void add()}
          />
        </View>
      </View>
    </Modal>
  );
}
