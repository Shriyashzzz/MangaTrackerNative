// A scan put right (the web's components/scanSheet/ScanEdit.tsx): which
// series it is (AniList's matches for a name) and which volumes the book
// holds. Also the question when the app couldn't tell the volumes itself
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { aniListGapMs, searchSeries, type SeriesHit } from "@/core/lib/anilist";
import { volumesFrom } from "@/core/lib/barcode";
import { knownNamesNear } from "@/core/lib/knownNames";
import { DID_YOU_MEAN, withNearMatches } from "@/core/lib/nearMatches";
import { useColors } from "@/lib/colors";
import Button from "./Button";
import { Field, Input } from "./Field";

const TYPING_PAUSE_MS = 450;
type Found =
  | { state: "idle" | "searching" | "failed" }
  | { state: "done"; hits: SeriesHit[]; guessed: boolean };

export default function ScanEdit({
  name,
  volumes,
  asking,
  onSave,
  onClose,
  onOpenSeries,
}: {
  name: string;
  volumes: number[];
  asking?: { edition: string | null; bookNumber: number | null };
  onSave: (change: { name: string; volumes: number[] }) => Promise<void>;
  onClose: () => void;
  // the series' edit page, when it's on the shelf
  onOpenSeries?: () => void;
}) {
  const c = useColors();
  const [search, setSearch] = useState(name);
  const [found, setFound] = useState<Found>({ state: "searching" });
  const [picked, setPicked] = useState(name);
  const [typed, setTyped] = useState(volumes.join(", "));
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState("");
  const chosen = volumesFrom(typed);

  useEffect(() => {
    const words = search.trim();
    if (!words) return;
    const controller = new AbortController();
    const timer = setTimeout(
      () => {
        setFound({ state: "searching" });
        withNearMatches(
          words,
          (text, retry) => searchSeries(text, controller.signal, retry),
          (hit) => hit.name,
          (text) => knownNamesNear(text, controller.signal),
        )
          .then(({ hits, guessed }) =>
            setFound({ state: "done", hits, guessed }),
          )
          .catch(() => {
            if (!controller.signal.aborted) setFound({ state: "failed" });
          });
      },
      words === name ? 0 : Math.max(TYPING_PAUSE_MS, aniListGapMs()),
    );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, name]);

  const save = async () => {
    if (!chosen) return;
    if (picked === name && chosen.join() === volumes.join()) return onClose();
    setSaving(true);
    setProblem("");
    try {
      await onSave({ name: picked, volumes: chosen });
      onClose();
    } catch {
      setProblem("That didn't save. Try again.");
      setSaving(false);
    }
  };
  const results: Found = search.trim() ? found : { state: "idle" };
  const bookOf = (a: NonNullable<typeof asking>) =>
    [a.edition, a.bookNumber].filter(Boolean).join(" ");

  const seriesField = (
    <Field label="Which series is it?">
      <Input
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
        returnKeyType="search"
      />
      <View className="gap-1">
        {results.state === "failed" ? (
          <Text className="font-body text-[13.5px] text-ink-soft">
            Couldn't search AniList just now. The series stays as scanned unless
            you pick another.
          </Text>
        ) : null}
        {results.state === "done" && !results.hits.length ? (
          <Text className="font-body text-[13.5px] text-ink-soft">
            No manga by that name. Check the spelling, or try a shorter one.
          </Text>
        ) : null}
        {results.state === "done" && results.guessed ? (
          <Text className="font-body text-[13.5px] text-ink-soft">
            {DID_YOU_MEAN}
          </Text>
        ) : null}
        {results.state === "done"
          ? results.hits.slice(0, 6).map((hit) => {
              const on = picked === hit.name;
              return (
                <Pressable
                  key={hit.anilistId}
                  onPress={() => setPicked(hit.name)}
                  accessibilityState={{ selected: on }}
                  className={`flex-row items-center gap-3 rounded-[3px] border-[1.5px] px-2 py-1.5 ${on ? "border-accent bg-accent-wash" : "border-line-soft"}`}
                >
                  {hit.cover ? (
                    <Image
                      source={{ uri: hit.cover }}
                      style={{ width: 28, height: 42 }}
                      contentFit="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: 28,
                        height: 42,
                        backgroundColor: c.paper2,
                      }}
                    />
                  )}
                  <View className="min-w-0 flex-1">
                    <Text
                      numberOfLines={1}
                      className="font-body-medium text-[14.5px] text-ink"
                    >
                      {hit.name}
                    </Text>
                    {hit.year ? (
                      <Text className="font-mono text-[12px] text-muted">
                        {hit.year}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              );
            })
          : null}
      </View>
    </Field>
  );
  const volumesField = (
    <Field label="Which volumes">
      <Input
        value={typed}
        onChangeText={setTyped}
        keyboardType="numbers-and-punctuation"
        invalid={!chosen}
      />
      <Text className="font-body text-[13px] text-muted">
        {asking
          ? "Every volume inside it: 4, 5, 6, or 1-23 for a box set. Its back cover says."
          : chosen
            ? "One number, or a few for a book holding several: 3, 4"
            : "Volume numbers, like 3 or 3, 4"}
      </Text>
    </Field>
  );

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <ScrollView
        className="max-h-[85%] rounded-t-2xl bg-card"
        contentContainerClassName="gap-4 px-5 pt-3 pb-8"
        keyboardShouldPersistTaps="handled"
      >
        <View className="h-1 w-9 self-center rounded-full bg-muted/50" />
        <View>
          <Text className="font-display text-[21px] text-ink">
            {asking ? "Which volumes are in this book?" : "Edit this scan"}
          </Text>
          <Text className="font-body text-[14px] text-ink-soft">
            {asking
              ? `${[name, bookOf(asking)].filter(Boolean).join(" · ")}. We couldn't tell, so nothing is on your shelf yet.`
              : `Scanned as ${name}, vol. ${volumes.join(" & ")}`}
          </Text>
        </View>
        {asking ? volumesField : null}
        {seriesField}
        {!asking ? volumesField : null}
        {onOpenSeries ? (
          <Pressable onPress={onOpenSeries} hitSlop={6}>
            <Text className="font-body-medium text-[14px] text-ink-soft underline">
              Chapter, status or notes? Open the series' edit page
            </Text>
          </Pressable>
        ) : null}
        {problem ? (
          <Text className="font-body-medium text-[14px] text-accent">
            {problem}
          </Text>
        ) : null}
        <View className="flex-row justify-end gap-3">
          <Button label="Cancel" small onPress={onClose} />
          <Button
            label={saving ? "Saving…" : asking ? "Add to my shelf" : "Save"}
            kind="primary"
            small
            disabled={!chosen || saving}
            onPress={() => void save()}
          />
        </View>
      </ScrollView>
    </Modal>
  );
}
