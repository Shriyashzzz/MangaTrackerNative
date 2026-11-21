// A series' other editions (the web's OtherEditions.tsx, the app's layout):
// each line's books as cards, which book holds a volume, the lines to switch
// between, and what a whole run costs against the singles
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { getJson } from "@/core/lib/api";
import { nextVolumeFor } from "@/core/lib/editionLookup";
import {
  editionBookLabel,
  lineFor,
  type EditionLine,
} from "@/core/lib/editions";
import { runTotal, seriesCost, type SeriesCost } from "@/core/lib/finishCost";
import { formatCents, wholeMoney } from "@/core/lib/prices";
import EditionFinder from "./EditionFinder";
import VolumeCard from "./VolumeCard";

export default function OtherEditions({
  name,
  asked,
  owned,
  onLines,
  singles,
  seriesCoverUrl = null,
}: {
  name: string;
  asked: string | null;
  owned: number[];
  onLines: (lines: EditionLine[]) => void;
  singles: SeriesCost | null;
  seriesCoverUrl?: string | null;
}) {
  const [state, setState] = useState<{ name: string; lines: EditionLine[] }>({
    name: "",
    lines: [],
  });
  const [picked, setPicked] = useState<string | null>(null);
  useEffect(() => {
    const controller = new AbortController();
    getJson<{ lines: EditionLine[] }>(
      `/api/prices/editions?${new URLSearchParams({ name })}`,
      controller.signal,
    )
      .then(({ lines }) => {
        setState({ name, lines: lines ?? [] });
        onLines(lines ?? []);
      })
      .catch(() => onLines([]));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);
  const lines = state.name === name ? state.lines : [];
  if (!lines.length) return null;
  const line = lineFor(lines, picked ?? asked) ?? lines[0]!;
  const mine = new Set(owned);
  const inside = line.books.flatMap((b) => b.volumes);
  const books = runTotal(
    seriesCost(
      line.books.map((book) => ({
        knownPriceCents: book.knownPriceCents ?? null,
        isbn13: book.isbn13 ?? undefined,
      })),
    ),
  );
  const loose = runTotal(singles);
  const said = (run: { cents: number; exact: boolean }) =>
    run.exact ? formatCents(run.cents) : `about ${wholeMoney(run.cents)}`;
  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
          Other editions
        </Text>
        <Text className="shrink font-mono text-[12px] text-muted">
          {line.books.length} {line.label} books hold vols.{" "}
          {Math.min(...inside)}–{Math.max(...inside)}
        </Text>
      </View>
      <EditionFinder
        key={`${name}:${nextVolumeFor(lines, owned) ?? ""}`}
        lines={lines}
        startAt={nextVolumeFor(lines, owned)}
      />
      {lines.length > 1 ? (
        <View className="flex-row flex-wrap gap-2">
          {lines.map((l) => (
            <Pressable
              key={l.key}
              onPress={() => setPicked(l.key)}
              accessibilityState={{ selected: l.key === line.key }}
              className={`rounded-[3px] border-[1.5px] px-2.5 py-1.5 ${l.key === line.key ? "border-accent bg-accent-wash" : "border-line"}`}
            >
              <Text
                className={`font-body-medium text-[14px] ${l.key === line.key ? "text-accent-ink" : "text-ink"}`}
              >
                {l.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12, paddingBottom: 4 }}
      >
        {line.books.map((book) => {
          const have = book.volumes.filter((v) => mine.has(v)).length;
          const label = editionBookLabel(line, book);
          const first = Math.min(...book.volumes);
          const last = Math.max(...book.volumes);
          return (
            <VolumeCard
              key={book.number}
              isbn13={book.isbn13}
              title={label}
              volume={first === last ? first : null}
              bookNumber={book.number}
              holds={first === last ? undefined : { from: first, to: last }}
              coverUrl={book.isbn13 ? `/api/prices/cover/${book.isbn13}` : null}
              seriesCoverUrl={seriesCoverUrl}
              priceCents={book.knownPriceCents ?? null}
              mark={have === book.volumes.length ? "yours" : undefined}
              subtitle={
                !book.isbn13 && book.knownPriceCents == null
                  ? "not listed yet"
                  : have > 0 && have < book.volumes.length
                    ? `you have ${have} of ${book.volumes.length}`
                    : undefined
              }
              plainStandIn
              width={110}
            />
          );
        })}
      </ScrollView>
      {books ? (
        <View className="gap-0.5">
          <Text className="font-body text-[14px] text-ink-soft">
            All {line.books.length} {line.label} books:{" "}
            <Text className="font-body-semibold text-ink">{said(books)}</Text>{" "}
            new
          </Text>
          {loose && singles ? (
            <Text className="font-body text-[14px] text-ink-soft">
              All {singles.volumes} singles:{" "}
              <Text className="font-body-semibold text-ink">{said(loose)}</Text>{" "}
              new
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
