// Where to buy more of this series, as the Android app's (web pages/Details/
// BuyStrip.tsx): folded under one line ("Buy next · Vol. 15 · $8.99") that
// opens it. Open: which edition they buy as, the next book they need on a
// red ticket (with On my shelf and Ordered pills), the gaps behind it, the
// newest out, what's ordered and on its way, and the series' price page.
// Every rule is the web's: the one to buy next (core useBuyOptions), an
// edition's plan (core useEditions), what's on sale (core onSale)
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDownIcon, InkCrossIcon } from "@/core/components/icons/Icons";
import { chaptersText, type ChapterRange } from "@/core/lib/chapterWords";
import {
  editionBookLabel,
  insideText,
  type EditionBook,
  type EditionLine,
} from "@/core/lib/editions";
import { formatCents } from "@/core/lib/prices";
import { seriesPath, volumePath } from "@/core/lib/pricePaths";
import { onSale } from "@/core/lib/releaseDate";
import type { SeriesVolume } from "@/core/lib/types";
import { runsOf } from "@/core/lib/volumeRuns";
import type { BuyOptions } from "@/core/pages/Details/useBuyOptions";
import type { Editions } from "@/core/pages/Details/useEditions";
import { useColors } from "@/lib/colors";
import { openWebPath } from "@/lib/webRoutes";
import GotIt from "./GotIt";
import PickSheet from "./PickSheet";

type Props = {
  options: BuyOptions;
  // the red bar is already selling the next volume
  hideNext: boolean;
  // the book the red bar sells: an edition's next book sold there isn't
  // priced again here
  barSells?: string | null;
  editions: Editions;
  // "singles" or a line's key
  onCollect: (key: string) => void;
  // for a chapter reader with no books: the chapters in the book offered
  nextChapters?: ChapterRange | null;
  // how many volumes the page says the series has ("You own 22 of 22")
  shelfTotal?: number;
  // they own none of this series: a reader, not a collector yet
  ownsNone?: boolean;
  // they've bought an edition's next book: record it and its volumes
  onOwnBook?: (line: EditionLine, book: EditionBook) => Promise<void>;
  // "On my shelf" on a single volume's ticket
  onOwnVolume?: (volume: number) => Promise<void>;
  // volumes ordered and on their way, and saying some are (or aren't)
  ordered?: number[];
  onOrdered?: (volumes: number[], ordered: boolean) => Promise<void>;
};

// an edition's book: its own price page when the catalog has its ISBN, else
// the series' page to look for it
const bookPath = (book: EditionBook, label: string, seriesName: string) =>
  book.isbn13
    ? volumePath(book.isbn13, book.title ?? label)
    : seriesPath(seriesName);
function bookPrice(book: EditionBook) {
  if (book.knownPriceCents != null) return formatCents(book.knownPriceCents);
  return book.isbn13 ? "check price" : "find it";
}
const price = (v: SeriesVolume) =>
  v.knownPriceCents != null ? formatCents(v.knownPriceCents) : "check price";
// gaps listed by name; past this, "+N more" opens the series page's list
const GAPS_SHOWN = 2;

const Kind = ({
  children,
  red = false,
}: {
  children: string;
  red?: boolean;
}) => (
  <Text
    className={`font-mono text-[11.5px] tracking-[1px] uppercase ${red ? "font-mono-medium text-accent-ink" : "text-muted"}`}
  >
    {children}
  </Text>
);

// the red ticket: what's next, its price, what's inside, the pills
function NextTicket({
  kind,
  name,
  under,
  cost,
  inside,
  to,
  pills,
}: {
  kind: string;
  name: string;
  under?: string | null;
  cost: string | null;
  inside?: string | null;
  to?: string;
  pills?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={to ? () => openWebPath(to) : undefined}
      disabled={!to}
      className="gap-1 rounded-[12px] border-[1.5px] border-accent bg-accent-wash px-3 pt-2 pb-2.5 active:opacity-90"
    >
      <Kind red>{kind}</Kind>
      <View className="flex-row items-baseline justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="font-body-semibold text-[16px] text-ink">
            {name}
          </Text>
          {under ? (
            <Text className="font-mono text-[12.5px] text-ink-soft">
              {under}
            </Text>
          ) : null}
        </View>
        {cost ? (
          <Text className="font-mono-medium text-[15px] text-accent-ink">
            {cost}
          </Text>
        ) : null}
      </View>
      {inside ? (
        <Text className="font-body text-[13.5px] text-ink-soft italic">
          {inside}
        </Text>
      ) : null}
      {pills ? (
        <View className="mt-1 flex-row justify-end">{pills}</View>
      ) : null}
    </Pressable>
  );
}

const Gap = ({
  label,
  to,
  italic = false,
  said,
}: {
  label: string;
  to: string;
  italic?: boolean;
  said?: string;
}) => (
  <Pressable
    onPress={() => openWebPath(to)}
    hitSlop={6}
    accessibilityLabel={said}
    className="min-h-[44px] justify-center"
  >
    <Text
      className={`font-body-semibold text-[15px] text-ink underline ${italic ? "italic" : ""}`}
    >
      {label}
    </Text>
  </Pressable>
);

const Dashed = ({ children }: { children: React.ReactNode }) => (
  <View className="gap-1 rounded-[14px] border border-dashed border-line-soft px-3 py-2">
    {children}
  </View>
);

export default function BuyStrip({
  options,
  hideNext,
  barSells = null,
  editions,
  onCollect,
  nextChapters = null,
  shelfTotal = 0,
  ownsNone = false,
  onOwnBook,
  onOwnVolume,
  ordered = [],
  onOrdered,
}: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [pickingEdition, setPickingEdition] = useState(false);
  const title = ownsNone ? "The books" : "Buy next";
  const nextLabel = !ownsNone
    ? "Next for you"
    : nextChapters
      ? "Your next chapters are in"
      : "Next volume";
  const [owning, setOwning] = useState(false);
  const [ownFailed, setOwnFailed] = useState(false);
  const [ordering, setOrdering] = useState(false);
  const [orderFailed, setOrderFailed] = useState(false);
  const order = (volumes: number[], on: boolean) => {
    if (!onOrdered) return;
    setOrdering(true);
    setOrderFailed(false);
    onOrdered(volumes, on)
      .catch(() => setOrderFailed(true))
      .finally(() => setOrdering(false));
  };
  const own = (run: () => Promise<void>) => {
    setOwning(true);
    setOwnFailed(false);
    run()
      .catch(() => setOwnFailed(true))
      .finally(() => setOwning(false));
  };
  const { line, plan } = editions;
  const { loading, volumes, latest, next, unlisted, caughtUp, seriesName } =
    options;
  // the gaps under "Not on your shelf": not the one "Next for you" names
  const gaps = options.gaps.filter((g) => g.volume !== next?.volume);
  const out = onSale(volumes);
  const numbered = out.filter(
    (v) => Number.isInteger(v.volume) && v.volume >= 1,
  );
  const outCount = Math.max(
    numbered.length,
    shelfTotal,
    ...numbered.map((v) => v.volume),
  );
  const coming = volumes.length - out.length;

  // its room is kept while it loads, so nothing under it jumps
  if (loading)
    return (
      <View className="h-[60px] border-y-[1.5px] border-dashed border-line-soft" />
    );
  if (!latest) return null;

  // the folded line's ticket, as the open box lists them: the book they
  // need next (unless the red bar sells it), else the first gap, else the
  // newest. Never one they own. A price only when one is known
  const firstNext = line && plan?.next;
  const nextOnBar = Boolean(
    barSells && plan?.next?.isbn13 && plan.next.isbn13 === barSells,
  );
  const withPrice = (book: string, cents: number | null | undefined) =>
    cents != null ? `${book} · ${formatCents(cents)}` : book;
  const firstGap = gaps[0];
  const gapCents = out.find(
    (v) => v.volume === firstGap?.volume,
  )?.knownPriceCents;
  const summary = firstNext
    ? withPrice(
        editionBookLabel(line, firstNext),
        nextOnBar ? null : firstNext.knownPriceCents,
      )
    : unlisted != null && !hideNext
      ? `Vol. ${unlisted}`
      : next && !hideNext
        ? withPrice(`Vol. ${next.volume}`, next.knownPriceCents)
        : firstGap
          ? withPrice(`Vol. ${firstGap.volume}`, gapCents)
          : next
            ? withPrice(`Vol. ${next.volume}`, next.knownPriceCents)
            : caughtUp
              ? "Caught up"
              : withPrice(`Vol. ${latest.volume}`, latest.knownPriceCents);

  const failedNote =
    ownFailed || orderFailed ? (
      <Text className="font-body text-[13px] text-accent">
        That didn't save. Try again.
      </Text>
    ) : null;
  const orderedLine =
    ordered.length > 0 ? (
      <View className="flex-row flex-wrap items-center gap-x-3 px-1">
        <Kind>Ordered:</Kind>
        {runsOf(ordered).map((run) => {
          const said =
            run.length === 1
              ? `Vol. ${run[0]}`
              : `Vols. ${run[0]}–${run.at(-1)}`;
          return (
            <Pressable
              key={run[0]}
              onPress={() => order(run, false)}
              disabled={ordering}
              accessibilityLabel={`${said}: not ordered after all`}
              className="min-h-[36px] flex-row items-center gap-1"
            >
              <Text className="font-body-semibold text-[14px] text-ink underline">
                {said}
              </Text>
              <InkCrossIcon color={c.inkSoft} width={11} height={11} />
            </Pressable>
          );
        })}
      </View>
    ) : null;
  const singlesText =
    outCount <= 1 && !coming
      ? "The series"
      : `All ${outCount} volumes${coming ? ` + ${coming} coming` : ""}`;
  const seriesTo = line
    ? `${seriesPath(seriesName)}&${new URLSearchParams({ edition: line.key })}`
    : seriesPath(seriesName);
  const seriesLink = (
    <Pressable
      onPress={() => openWebPath(seriesTo)}
      hitSlop={6}
      className="ml-auto py-1"
    >
      <Text className="font-body-medium text-[14px] text-ink-soft underline">
        {line && plan && plan.outBooks > 1
          ? `All ${plan.outBooks} ${line.label} books`
          : singlesText}{" "}
        →
      </Text>
    </Pressable>
  );
  const moreGaps = (count: number) => (
    <Gap
      label={`+${count - GAPS_SHOWN} more`}
      to={`${seriesPath(seriesName)}&toget=1`}
      italic
    />
  );

  const editionOptions = [
    { value: "singles", label: "Single" },
    ...editions.lines.map((l) => ({ value: l.key, label: l.label })),
  ];

  return (
    <View className="border-y-[1.5px] border-dashed border-line-soft py-1">
      <Pressable
        onPress={() => setOpen(!open)}
        accessibilityState={{ expanded: open }}
        className="min-h-[44px] flex-row items-center gap-3"
      >
        <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
          {title}
        </Text>
        {!open ? (
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-mono-medium text-[14px] text-accent"
          >
            {summary}
          </Text>
        ) : (
          <View className="flex-1" />
        )}
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color={c.inkSoft} width={20} height={20} />
        </View>
      </Pressable>
      {open ? (
        <View className="gap-2 pt-1 pb-3">
          {/* which edition they buy as, and the series' page */}
          <View className="flex-row flex-wrap items-center gap-2">
            {editions.lines.length > 0 ? (
              <Pressable
                onPress={() => setPickingEdition(true)}
                accessibilityLabel={`Buy next as ${line?.label ?? "single"}. Change`}
                className="flex-row items-center gap-1"
              >
                <Text className="font-body text-[14px] text-ink-soft">as</Text>
                <Text className="font-body-semibold text-[14px] text-ink">
                  {line?.label ?? "Single"}
                </Text>
                <ChevronDownIcon color={c.ink} width={14} height={14} />
              </Pressable>
            ) : null}
            {seriesLink}
          </View>
          {line && plan ? (
            <>
              {plan.next ? (
                <NextTicket
                  kind={nextLabel}
                  name={editionBookLabel(line, plan.next)}
                  cost={nextOnBar ? null : bookPrice(plan.next)}
                  inside={`${insideText(plan.next)}${plan.next.have > 0 ? `, you have ${plan.next.have} of ${plan.next.volumes.length}` : ""}`}
                  to={bookPath(plan.next, line.label, seriesName)}
                  pills={
                    <GotIt
                      name={editionBookLabel(line, plan.next)}
                      onShelf={
                        onOwnBook &&
                        (() => own(() => onOwnBook(line, plan.next!)))
                      }
                      onOrdered={
                        onOrdered && (() => order(plan.next!.volumes, true))
                      }
                      owning={owning}
                      ordering={ordering}
                    />
                  }
                />
              ) : null}
              {failedNote}
              {plan.gaps.length > 0 ? (
                <Dashed>
                  <Kind>Not on your shelf</Kind>
                  <View className="flex-row flex-wrap gap-x-3">
                    {plan.gaps.slice(0, GAPS_SHOWN).map((g) => (
                      <Gap
                        key={g.number}
                        label={editionBookLabel(line, g)}
                        to={bookPath(g, line.label, seriesName)}
                        said={`${editionBookLabel(line, g)}: ${insideText(g)}${g.have ? `, you have ${g.have} of ${g.volumes.length}` : ""}`}
                      />
                    ))}
                    {plan.gaps.length > GAPS_SHOWN
                      ? moreGaps(plan.gaps.length)
                      : null}
                  </View>
                </Dashed>
              ) : null}
              {plan.caughtUp ? (
                <Dashed>
                  <Kind>Caught up</Kind>
                  <Text className="font-body text-[14.5px] text-ink-soft">
                    You have all {plan.outBooks} {line.label} books listed
                  </Text>
                  {outCount > plan.lastVolume && plan.lastVolume > 0 ? (
                    <Text className="font-body text-[13.5px] text-ink-soft italic">
                      {outCount === plan.lastVolume + 1
                        ? `Vol. ${outCount} isn't in a ${line.label} book yet.`
                        : `Vols. ${plan.lastVolume + 1}–${outCount} aren't in a ${line.label} book yet.`}
                    </Text>
                  ) : null}
                </Dashed>
              ) : null}
              {orderedLine}
            </>
          ) : (
            <>
              {unlisted != null && !hideNext ? (
                <NextTicket
                  kind={nextLabel}
                  name={`Vol. ${unlisted}`}
                  cost="not listed"
                  pills={
                    onOrdered ? (
                      <GotIt
                        name={`Vol. ${unlisted}`}
                        onShelf={
                          onOwnVolume &&
                          (() => own(() => onOwnVolume(unlisted)))
                        }
                        onOrdered={() => order([unlisted], true)}
                        owning={owning}
                        ordering={ordering}
                      />
                    ) : null
                  }
                />
              ) : null}
              {next && !hideNext ? (
                <NextTicket
                  kind={nextLabel}
                  name={`Vol. ${next.volume}`}
                  under={nextChapters ? chaptersText(nextChapters) : null}
                  cost={price(next)}
                  to={volumePath(next.isbn13, next.title)}
                  pills={
                    onOrdered ? (
                      <GotIt
                        name={`Vol. ${next.volume}`}
                        onShelf={
                          onOwnVolume &&
                          (() => own(() => onOwnVolume(next.volume)))
                        }
                        onOrdered={() => order([next.volume], true)}
                        owning={owning}
                        ordering={ordering}
                      />
                    ) : null
                  }
                />
              ) : null}
              {failedNote}
              {gaps.length > 0 ? (
                <Dashed>
                  <Kind>Not on your shelf</Kind>
                  <View className="flex-row flex-wrap gap-x-3">
                    {gaps.slice(0, GAPS_SHOWN).map((g) => (
                      <Gap
                        key={g.volume}
                        label={`Vol. ${g.volume}`}
                        to={
                          g.isbn13
                            ? volumePath(g.isbn13, g.title)
                            : `${seriesPath(seriesName)}&toget=1`
                        }
                      />
                    ))}
                    {gaps.length > GAPS_SHOWN ? moreGaps(gaps.length) : null}
                  </View>
                </Dashed>
              ) : null}
              {caughtUp ? (
                <Dashed>
                  <Kind>Caught up</Kind>
                  <Text className="font-body text-[14.5px] text-ink-soft">
                    {shelfTotal > latest.volume
                      ? `You own up to vol. ${shelfTotal}`
                      : `Vol. ${latest.volume} is the newest in English`}
                  </Text>
                </Dashed>
              ) : next?.isbn13 !== latest.isbn13 ? (
                <Pressable
                  onPress={() =>
                    openWebPath(volumePath(latest.isbn13, latest.title))
                  }
                  className="flex-row items-baseline justify-between gap-3 rounded-[14px] border border-dashed border-line-soft bg-paper px-3 py-2.5 active:bg-accent-wash"
                >
                  <View>
                    <Kind>Newest</Kind>
                    <Text className="font-body-semibold text-[15px] text-ink">
                      Vol. {latest.volume}
                    </Text>
                  </View>
                  <Text className="font-mono-medium text-[14px] text-accent-ink">
                    {price(latest)}
                  </Text>
                </Pressable>
              ) : null}
              {orderedLine}
            </>
          )}
        </View>
      ) : null}
      <PickSheet
        open={pickingEdition}
        title="Buy next as"
        options={editionOptions}
        picked={line?.key ?? "singles"}
        onPick={onCollect}
        onClose={() => setPickingEdition(false)}
      />
    </View>
  );
}
