// What the New tab lists (the web's pages/NewReleases/ReleaseControls.tsx):
// for volumes and for chapters, every series or only the ones they're
// nearly caught up on, and how nearly. Each choice shows an example of what
// New would say. Saved a moment after the last change
import Tap from "@/components/Tap";
import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { apiFetch } from "@/core/lib/api";
import type {
  Prefs,
  RangeMode,
  ReleaseRange,
  ReleaseSettings,
} from "@/core/lib/types";
import { useShelf } from "@/store/shelf";
import { Note, Radios } from "./parts";

const DEFAULTS: ReleaseSettings = {
  volumes: { mode: "next", within: 1 },
  chapters: { mode: "within", within: 3 },
};
const asOffered = (saved: ReleaseSettings | undefined): ReleaseSettings => {
  const range = (kind: keyof ReleaseSettings): ReleaseRange => {
    const one = saved?.[kind];
    if (!one) return DEFAULTS[kind];
    return { ...one, mode: one.mode === "within" ? "within" : "next" };
  };
  return { volumes: range("volumes"), chapters: range("chapters") };
};
const SAVE_AFTER_MS = 400;

type Example = { newest: string; rows: [string, string][]; after?: string };
const newestLine = (word: "vol." | "ch.", latest: number) =>
  word === "vol."
    ? `If vol. ${latest} is the newest out:`
    : `If ch. ${latest} is the latest released chapter:`;
function atTheEdge({
  latest,
  within,
  word,
  you,
  less,
}: {
  latest: number;
  within: number;
  word: "vol." | "ch.";
  you: "Own up to" | "On";
  less: string;
}): Example {
  const at = latest - within;
  return {
    newest: newestLine(word, latest),
    rows: [
      [`${you} ${word} ${at}`, `New shows ${word} ${at + 1}`],
      [less, "New waits"],
    ],
  };
}
const KINDS = {
  volumes: {
    title: "Volumes",
    note: "English volumes.",
    many: "volumes",
    newest: "newest",
    closest: "New releases only",
    max: 10,
    example: ({ mode, within }: ReleaseRange): Example =>
      mode === "next"
        ? {
            newest: newestLine("vol.", 30),
            rows: [
              ["Own up to vol. 29", "New shows vol. 30"],
              ["Own up to vol. 5", "New shows vol. 6"],
            ],
            after:
              "And so on: wherever you are, if your next volume is out, New shows it.",
          }
        : atTheEdge({
            latest: 30,
            within,
            word: "vol.",
            you: "Own up to",
            less: "Own less",
          }),
  },
  chapters: {
    title: "Chapters",
    note: "Chapters are English only.",
    many: "chapters",
    newest: "latest",
    closest: "New chapters only",
    max: 50,
    example: ({ mode, within }: ReleaseRange): Example =>
      mode === "next"
        ? {
            newest: newestLine("ch.", 250),
            rows: [
              ["On ch. 249", "New shows ch. 250"],
              ["On ch. 12", "New shows ch. 13"],
            ],
            after:
              "And so on: wherever you are, if your next chapter is out, New shows it.",
          }
        : atTheEdge({
            latest: 250,
            within,
            word: "ch.",
            you: "On",
            less: "Further back",
          }),
  },
} as const;
const MODES = [
  { value: "next", label: "Every series" },
  { value: "within", label: "Only series I'm nearly caught up on" },
] as const;

export default function ReleaseControls() {
  const [settings, setSettings] = useState<ReleaseSettings | null>(null);
  const [status, setStatus] = useState<
    "" | "saving" | "saved" | "failed" | "unloaded"
  >("");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    const controller = new AbortController();
    apiFetch("/api/prefs", { signal: controller.signal })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.statusText);
        const { releases } = (await res.json()) as Prefs;
        setSettings(asOffered(releases));
      })
      .catch((e: Error) => {
        if (e.name !== "AbortError") setStatus("unloaded");
      });
    return () => {
      controller.abort();
      clearTimeout(timer.current);
    };
  }, []);
  if (status === "unloaded")
    return (
      <Note
        text="Couldn't load your settings. Come back to try again."
        failed
      />
    );
  if (!settings) return null;

  const save = (next: ReleaseSettings) => {
    setSettings(next);
    setStatus("saving");
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const res = await apiFetch("/api/prefs", {
          method: "PUT",
          body: { releases: next },
        });
        if (!res.ok) throw new Error(res.statusText);
        setStatus("saved");
        // the shelf's answers are stale now: asked again next time
        useShelf.setState({ releases: {} });
      } catch {
        setStatus("failed");
      }
    }, SAVE_AFTER_MS);
  };

  return (
    <View className="gap-6">
      {(Object.keys(KINDS) as (keyof typeof KINDS)[]).map((kind) => {
        const copy = KINDS[kind];
        const range = settings[kind];
        const change = (patch: Partial<ReleaseRange>) =>
          save({ ...settings, [kind]: { ...range, ...patch } });
        const howClose =
          range.within === 1
            ? copy.closest
            : `Up to ${range.within} ${copy.many} behind`;
        const example = copy.example(range);
        return (
          <View key={kind} className="gap-3">
            <View>
              <Text className="font-body-semibold text-[16px] text-ink">
                {copy.title}
              </Text>
              <Text className="font-body text-[13px] text-muted">
                {copy.note}
              </Text>
            </View>
            <Radios
              label={copy.title}
              options={MODES}
              value={range.mode}
              onChange={(mode: RangeMode) =>
                change(mode === "within" ? { mode, within: 1 } : { mode })
              }
            />
            {/* how nearly: a − N + counter, where the website has a slider */}
            {range.mode === "within" ? (
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center overflow-hidden rounded-[12px] bg-ink/10">
                  <Tap
                    onPress={() =>
                      change({ within: Math.max(1, range.within - 1) })
                    }
                    disabled={range.within <= 1}
                    className="h-10 w-10 items-center justify-center"
                    accessibilityLabel={`One ${copy.many.slice(0, -1)} closer`}
                  >
                    <Text className="font-body-semibold text-[20px] text-ink">
                      −
                    </Text>
                  </Tap>
                  <Text className="w-12 border-x border-line-soft text-center font-brand text-[20px] text-ink">
                    {"\u00A0"}
                    {range.within}
                    {"\u00A0"}
                  </Text>
                  <Tap
                    onPress={() =>
                      change({ within: Math.min(copy.max, range.within + 1) })
                    }
                    disabled={range.within >= copy.max}
                    className="h-10 w-10 items-center justify-center"
                    accessibilityLabel={`One ${copy.many.slice(0, -1)} further`}
                  >
                    <Text className="font-body-semibold text-[20px] text-ink">
                      +
                    </Text>
                  </Tap>
                </View>
                <Text className="shrink font-body text-[14px] text-ink-soft">
                  {howClose}
                </Text>
              </View>
            ) : null}
            <View className="gap-1 rounded-[14px] border border-dashed border-line-soft px-3 py-2">
              <Text className="font-body-medium text-[13.5px] text-ink">
                {example.newest}
              </Text>
              {example.rows.map(([when, then]) => (
                <View key={when} className="flex-row justify-between gap-3">
                  <Text className="font-body text-[13.5px] text-ink-soft">
                    {when}
                  </Text>
                  <Text className="font-body-medium text-[13.5px] text-ink">
                    {then}
                  </Text>
                </View>
              ))}
              {example.after ? (
                <Text className="font-body text-[12.5px] text-muted">
                  {example.after}
                </Text>
              ) : null}
            </View>
          </View>
        );
      })}
      <Note
        text={
          status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved. Your New tab will use this next time it opens."
              : status === "failed"
                ? "That didn't save. Try again."
                : null
        }
        failed={status === "failed"}
      />
    </View>
  );
}
