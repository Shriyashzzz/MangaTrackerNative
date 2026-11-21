// Omnibus and deluxe editions, as the web's pages/Prices/EditionsIndex.tsx:
// which volumes are in each book. Search a series, or every series with
// editions A to Z, each opening to its lines' tiles; a picked series gets
// the lookup ("Which book has volume 23?") and Missing a book?
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Mascot from "@/components/Mascot";
import Page, { H2, H3, P } from "@/components/Page";
import SeriesCover from "@/components/SeriesCover";
import { Input } from "@/components/Field";
import BookTiles from "@/components/prices/BookTiles";
import EditionFinder from "@/components/prices/EditionFinder";
import ReportBook from "@/components/prices/ReportBook";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import {
  booksFromSpans,
  lineFacts,
  nextVolumeFor,
  type LookupLine,
} from "@/core/lib/editionLookup";
import { getEditionsIndex, type EditionsEntry } from "@/core/lib/editionsIndex";
import { ownedOf } from "@/core/lib/ownedVolumes";
import { slugify } from "@/core/lib/pricePaths";
import { useColors } from "@/lib/colors";
import { openWebPath } from "@/lib/webRoutes";
import { seriesPath } from "@/core/lib/pricePaths";
import { useShelf } from "@/store/shelf";

const linesOf = (entry: EditionsEntry): LookupLine[] =>
  entry.lines.map((line) => ({
    key: line.key,
    label: line.label,
    books: booksFromSpans(line.spans),
  }));
const factsText = (line: LookupLine) => {
  const f = lineFacts(line);
  return `${f.books} books${f.coming ? ` · ${f.coming} coming` : ""} · vols. ${f.from}–${f.to}`;
};
const letterOf = (name: string) => {
  const first =
    name
      .replace(/^the\s+/i, "")
      .trim()[0]
      ?.toUpperCase() ?? "#";
  return /[A-Z]/.test(first) ? first : "#";
};

function useOwned(name: string) {
  const shelf = useShelf((s) => s.manga);
  const mine = shelf?.find((m) => slugify(m.name) === slugify(name));
  return mine ? ownedOf(mine) : [];
}

function Picked({
  asked,
  entry,
}: {
  asked: string;
  entry: EditionsEntry | null;
}) {
  const owned = useOwned(entry?.name ?? asked);
  const lines = entry ? linesOf(entry) : [];
  const startAt = nextVolumeFor(lines, owned);
  const [volume, setVolume] = useState<number | null>(startAt);
  if (!entry)
    return (
      <View className="gap-2">
        <P>No omnibus or deluxe editions known for {asked} yet.</P>
        <P muted>
          Its series page looks for them; once found they show here too.
        </P>
        <Pressable onPress={() => openWebPath(seriesPath(asked))} hitSlop={6}>
          <Text className="font-body-semibold text-[14.5px] text-ink underline">
            Open {asked}
          </Text>
        </Pressable>
      </View>
    );
  return (
    <View className="gap-5">
      <View className="flex-row items-start gap-3">
        <SeriesCover name={entry.name} url={entry.coverUrl} width={72} />
        <View className="min-w-0 flex-1 gap-2">
          <H2>{entry.name}</H2>
          <EditionFinder
            key={`${entry.slug}:${startAt ?? ""}`}
            lines={lines}
            startAt={startAt}
            onVolume={setVolume}
          />
        </View>
      </View>
      {lines.map((line) => (
        <View key={line.key} className="gap-2">
          <View className="flex-row items-baseline justify-between gap-3">
            <H3>{line.label}</H3>
            <Text className="font-mono text-[12px] text-muted">
              {factsText(line)}
            </Text>
          </View>
          <BookTiles line={line} volume={volume} owned={owned} />
          <Pressable
            onPress={() =>
              openWebPath(
                `${seriesPath(entry.name)}&edition=${encodeURIComponent(line.key)}`,
              )
            }
            hitSlop={6}
            className="self-start"
          >
            <Text className="font-body-medium text-[14px] text-ink underline">
              {line.label} prices →
            </Text>
          </Pressable>
        </View>
      ))}
      <ReportBook seriesName={entry.name} lines={lines} />
    </View>
  );
}

function SeriesFold({
  entry,
  onPick,
}: {
  entry: EditionsEntry;
  onPick: () => void;
}) {
  const c = useColors();
  const owned = useOwned(entry.name);
  const lines = linesOf(entry);
  const [open, setOpen] = useState(false);
  return (
    <View className="border-b border-dashed border-line-soft pb-3">
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3 py-2"
      >
        <SeriesCover name={entry.name} url={entry.coverUrl} width={40} />
        <View className="min-w-0 flex-1">
          <Text
            numberOfLines={1}
            className="font-body-semibold text-[15.5px] text-ink"
          >
            {entry.name}
          </Text>
          <Text numberOfLines={1} className="font-mono text-[12px] text-muted">
            {lines
              .map((line) => `${line.label} · ${lineFacts(line).books}`)
              .join("   ")}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color={c.muted} width={18} height={18} />
        </View>
      </Pressable>
      {open ? (
        <View className="gap-3 pt-1">
          {lines.map((line) => (
            <View key={line.key} className="gap-1.5">
              <Text className="font-body-semibold text-[14px] text-ink">
                {line.label}{" "}
                <Text className="font-mono text-[12px] text-muted">
                  {factsText(line)}
                </Text>
              </Text>
              <BookTiles line={line} owned={owned} />
            </View>
          ))}
          <View className="flex-row flex-wrap gap-4">
            <Pressable onPress={onPick} hitSlop={6}>
              <Text className="font-body-medium text-[14px] text-ink underline">
                Which book has my volume?
              </Text>
            </Pressable>
            <Pressable
              onPress={() => openWebPath(seriesPath(entry.name))}
              hitSlop={6}
            >
              <Text className="font-body-medium text-[14px] text-ink underline">
                Prices
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function EditionsScreen() {
  const params = useLocalSearchParams<{ series?: string }>();
  const [asked, setAsked] = useState((params.series ?? "").trim());
  const [typed, setTyped] = useState("");
  const [state, setState] = useState<{
    entries: EditionsEntry[] | null;
    failed: boolean;
  }>({ entries: null, failed: false });
  useEffect(() => {
    const controller = new AbortController();
    getEditionsIndex(controller.signal)
      .then((entries) => setState({ entries, failed: false }))
      .catch((err: Error) => {
        if (err.name !== "AbortError") setState({ entries: [], failed: true });
      });
    return () => controller.abort();
  }, []);
  const entries = state.entries;
  const picked = asked
    ? (entries?.find((e) => e.slug === slugify(asked)) ?? null)
    : null;
  const matches =
    typed.trim().length >= 2
      ? (entries ?? [])
          .filter((e) =>
            e.name.toLowerCase().includes(typed.trim().toLowerCase()),
          )
          .slice(0, 8)
      : [];
  const sorted = [...(entries ?? [])].sort((a, b) =>
    a.name
      .replace(/^the\s+/i, "")
      .localeCompare(b.name.replace(/^the\s+/i, "")),
  );
  const groups: [string, EditionsEntry[]][] = [];
  for (const entry of sorted) {
    const letter = letterOf(entry.name);
    const last = groups.at(-1);
    if (last?.[0] === letter) last[1].push(entry);
    else groups.push([letter, [entry]]);
  }
  return (
    <Page title="Editions">
      <P muted>
        Which volumes are in each book. Search a series, or open one below.
      </P>
      <View className="gap-1">
        <Input
          value={typed}
          onChangeText={setTyped}
          placeholder="Search a series"
          autoCorrect={false}
          returnKeyType="search"
          onSubmitEditing={() => matches[0] && setAsked(matches[0].name)}
        />
        {matches.length ? (
          <View className="rounded-[4px] border-[1.5px] border-line bg-card">
            {matches.map((e) => (
              <Pressable
                key={e.slug}
                onPress={() => {
                  setAsked(e.name);
                  setTyped("");
                }}
                className="border-b border-line-soft px-3 py-2.5 active:bg-accent-wash"
              >
                <Text className="font-body-medium text-[15px] text-ink">
                  {e.name}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
      {entries === null ? null : asked ? (
        <>
          <Picked asked={asked} entry={picked} />
          <Pressable
            onPress={() => setAsked("")}
            hitSlop={6}
            className="self-start"
          >
            <Text className="font-body-medium text-[14px] text-ink-soft underline">
              Every series with editions
            </Text>
          </Pressable>
        </>
      ) : entries.length === 0 ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <P>{state.failed ? "The list didn't load." : "No editions yet."}</P>
          <P muted>
            {state.failed
              ? "Try again in a moment."
              : "A series' editions show here once its page has been opened."}
          </P>
        </View>
      ) : (
        groups.map(([letter, list]) => (
          <View key={letter} className="gap-1">
            <H2>{letter}</H2>
            {list.map((entry) => (
              <SeriesFold
                key={entry.slug}
                entry={entry}
                onPick={() => setAsked(entry.name)}
              />
            ))}
          </View>
        ))
      )}
    </Page>
  );
}
