// Beside a series' title: a whole run in one buy, its box sets, and its
// editions' bigger books, in one box with a pick between them (the web's
// SetsBox with EditionsBox). The pick is remembered per series on this device
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import {
  editionBookLabel,
  editionTitle,
  insideText,
  leadBooksOf,
  type EditionLine,
} from "@/core/lib/editions";
import { formatCents } from "@/core/lib/prices";
import { volumePath } from "@/core/lib/pricePaths";
import type { BoxSet, StoreLink } from "@/core/lib/types";
import { setsTitle, shownSets } from "@/core/pages/Prices/boxSetRules";
import {
  BOX_SETS,
  pickedOf,
  readPicks,
  setsOptions,
  withPick,
} from "@/core/pages/Prices/setsBoxRules";
import { useColors } from "@/lib/colors";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import { openWebPath } from "@/lib/webRoutes";
import PickSheet from "../PickSheet";
import BoxSets from "./BoxSets";

const PICKS_KEY = "setsPicks";
const rememberedFor = (series: string) =>
  readPicks(readLocal(PICKS_KEY)).find(([name]) => name === series)?.[1] ??
  null;

function EditionsBox({
  line,
  owned,
  onSeeAll,
}: {
  line: EditionLine;
  owned: number[];
  onSeeAll: () => void;
}) {
  const leading = leadBooksOf(line, owned);
  if (!leading) return null;
  const { theirs, shown } = leading;
  return (
    <View className="gap-2">
      {shown.map((book, at) => {
        const label = editionBookLabel(line, book);
        const first = at === 0;
        return (
          <Pressable
            key={book.number}
            onPress={() =>
              openWebPath(volumePath(book.isbn13!, book.title ?? label))
            }
            className={`flex-row items-baseline justify-between gap-3 rounded-[12px] border-[1.5px] px-3 py-2.5 active:opacity-90 ${first ? "border-accent bg-accent-wash" : "border-dashed border-line-soft"}`}
          >
            <View className="min-w-0 flex-1">
              <Text
                className={`font-mono text-[11.5px] tracking-[1px] uppercase ${first ? "font-mono-medium text-accent-ink" : "text-muted"}`}
              >
                {first ? (theirs ? "Next for you" : "Starts with") : "Then"}
              </Text>
              <Text className="font-body-semibold text-[15.5px] text-ink">
                {label}
              </Text>
              <Text className="font-body text-[13px] text-ink-soft italic">
                {insideText(book)}
              </Text>
            </View>
            <Text
              className={`font-mono-medium text-[14px] ${first ? "text-accent-ink" : "text-ink"}`}
            >
              {book.knownPriceCents != null
                ? formatCents(book.knownPriceCents)
                : "check price"}
            </Text>
          </Pressable>
        );
      })}
      <Pressable onPress={onSeeAll} hitSlop={6}>
        <Text className="font-body-medium text-[14px] text-ink border-b pb-[2px] border-ink self-start">
          See all {line.books.length} books ↓
        </Text>
      </Pressable>
    </View>
  );
}

export default function SetsBox({
  series,
  sets: found,
  links,
  lines,
  headline,
  owned,
  onSeeAllBooks,
}: {
  series: string;
  sets: BoxSet[];
  links: StoreLink[];
  lines: EditionLine[];
  headline: EditionLine | null;
  owned: number[];
  onSeeAllBooks: (key: string) => void;
}) {
  const c = useColors();
  const sets = shownSets(found, lines.length > 0);
  const showable = lines.filter((line) => leadBooksOf(line, owned) !== null);
  const options = setsOptions(sets.length ? setsTitle(sets) : null, showable);
  const [chosen, setChosen] = useState(() => rememberedFor(series));
  const [picking, setPicking] = useState(false);
  const picked = pickedOf(options, chosen, headline?.key ?? null);
  if (picked === null) return null;
  const line = showable.find((l) => l.key === picked) ?? null;
  const pick = (value: string) => {
    setChosen(value);
    writeLocal(
      PICKS_KEY,
      JSON.stringify(withPick(readPicks(readLocal(PICKS_KEY)), series, value)),
    );
  };
  const alone = options.length === 1;
  let title = "Other editions";
  if (alone) title = line ? editionTitle(line) : setsTitle(sets);
  else if (sets.length) title = "Box sets & editions";
  return (
    <View className="gap-2 rounded-[14px] border border-line-soft bg-card p-3">
      <View className="flex-row items-center justify-between gap-3">
        <Text className="shrink font-brand pr-[4px] text-[18px] tracking-[1px] text-ink uppercase">
          {title}
        </Text>
        {!alone ? (
          <Pressable
            onPress={() => setPicking(true)}
            className="flex-row items-center gap-1"
            accessibilityLabel="Show"
          >
            <Text className="font-body text-[13px] text-ink-soft">showing</Text>
            <Text className="font-body-semibold text-[13px] text-ink">
              {options.find((o) => o.value === picked)?.label}
            </Text>
            <ChevronDownIcon color={c.ink} width={14} height={14} />
          </Pressable>
        ) : null}
      </View>
      {line ? (
        <EditionsBox
          line={line}
          owned={owned}
          onSeeAll={() => onSeeAllBooks(line.key)}
        />
      ) : (
        <BoxSets
          bare
          sets={found}
          links={links}
          editionsListed={lines.length > 0}
        />
      )}
      <PickSheet
        open={picking}
        title="Show"
        options={options}
        picked={picked}
        onPick={pick}
        onClose={() => setPicking(false)}
      />
      {picked === BOX_SETS ? null : null}
    </View>
  );
}
