// Under an opened series on the Volumes tab: what finishing it comes to, the
// first couple to get (cheapest new copy, and where), and the series' price
// page for the rest. In Buy next's order (core toGetLines, their Next in line
// setting). As the web's (pages/Home/FinishList.tsx). A price opens the
// store; one not checked yet says "check price" and opens the volume's page
import { router } from "expo-router";
import { Linking, Pressable, Text, View } from "react-native";
import {
  money,
  totalText,
  type FinishRow,
  type MissingVolume,
} from "@/core/lib/collector";
import { useNextFor } from "@/core/lib/prefs";
import { shopName } from "@/core/lib/prices";
import { toGetLines } from "@/core/lib/toGetLines";

// the next ones to buy; the series page has them all
const FIRST_SHOWN = 2;

const openSeries = (name: string) =>
  router.push({ pathname: "/prices/series", params: { name } });

function Row({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <View className="flex-row items-baseline justify-between gap-3 border-b border-dotted border-line-soft py-2">
      <Text className="shrink-0 font-body-medium text-[14px] text-ink">
        {label}
      </Text>
      {children}
    </View>
  );
}

function Link({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={6} className="min-w-0 shrink">
      <Text
        numberOfLines={1}
        className="text-right font-body text-[14px] text-ink-soft underline"
      >
        {children}
      </Text>
    </Pressable>
  );
}

const Price = ({ cents }: { cents: number }) => (
  <Text className="font-mono-medium text-ink">{money(cents)}</Text>
);

function Where({ volume }: { volume: MissingVolume }) {
  const cheapest = volume.cheapest;
  const openVolume = () => router.push(`/prices/${volume.isbn13}`);
  if (!cheapest) return <Link onPress={openVolume}>check price</Link>;
  const url = cheapest.url;
  return (
    <Link onPress={url ? () => Linking.openURL(url) : openVolume}>
      <Price cents={cheapest.cents} /> at {shopName(cheapest.store)}
    </Link>
  );
}

export default function FinishList({
  row,
  series,
  owned,
}: {
  row: FinishRow;
  // the series as the price pages know it
  series: string;
  owned: number[];
}) {
  const unpriced = row.missing.filter((m) => !m.cheapest);
  const lines = toGetLines(row.missing, owned, useNextFor() === "gap");
  const shown = lines.slice(0, FIRST_SHOWN);
  const shownCount = shown.reduce(
    (n, l) => n + (l.kind === "run" ? l.volumes.length : 1),
    0,
  );
  const rest = row.missing.length - shownCount;
  const unit = row.edition ? "book" : "volume";
  const total = totalText(
    row.cents,
    row.priced,
    row.missing.length,
    row.estimateCents,
  );

  return (
    <View className="mt-5 border-t border-dashed border-line-soft pt-4">
      <View className="mb-1 flex-row items-baseline gap-3">
        <Text className="font-body-semibold text-[15px] text-ink">
          To finish it
        </Text>
        {total ? (
          <Text className="font-brand pr-[5px] text-[20px] text-ink">
            {total}
          </Text>
        ) : null}
      </View>
      {unpriced.length > 0 && row.estimateCents === null ? (
        <View className="mb-2">
          <Text className="font-body text-[13px] text-muted">
            {row.priced} of {row.missing.length} priced: not enough yet for a
            total.
          </Text>
          <Text className="font-body text-[13px] text-muted">
            Prices fill in as volumes are checked.
          </Text>
        </View>
      ) : null}
      {unpriced.length > 0 && row.estimateCents !== null ? (
        <Text className="mb-2 font-body text-[13px] text-muted">
          {row.priced
            ? `${row.priced} of ${row.missing.length} priced; the rest at the series' usual price.`
            : "An estimate. No prices checked yet."}
        </Text>
      ) : null}
      {shown.map((line) => {
        if (line.kind !== "run")
          return (
            <Row
              key={`${line.volume.volume}-${line.volume.isbn13}`}
              label={line.volume.label ?? `Vol. ${line.volume.volume}`}
            >
              <Where volume={line.volume} />
            </Row>
          );
        // a long run of gaps, as one line: "Vols. 6–59 · 54 volumes"
        const vols = line.volumes;
        const allPriced = vols.every((v) => v.cheapest);
        const cents = vols.reduce((n, v) => n + (v.cheapest?.cents ?? 0), 0);
        return (
          <Row
            key={`run-${vols[0]!.volume}`}
            label={
              <>
                Vols. {vols[0]!.volume}–{vols[vols.length - 1]!.volume}
                <Text className="font-body text-muted">
                  {" "}
                  {vols.length} volumes
                </Text>
              </>
            }
          >
            <Link onPress={() => openSeries(series)}>
              {allPriced ? <Price cents={cents} /> : "check prices"}
            </Link>
          </Row>
        );
      })}
      {rest > 0 ? (
        <Row
          label={
            <Text className="font-body text-ink-soft">{`${shown.length ? `${rest} more` : rest} ${unit}${rest === 1 ? "" : "s"}`}</Text>
          }
        >
          <Pressable onPress={() => openSeries(series)} hitSlop={6}>
            <Text className="font-body-medium text-[14px] text-ink border-b pb-[2px] border-ink self-start decoration-accent">
              Check the series page
            </Text>
          </Pressable>
        </Row>
      ) : null}
    </View>
  );
}
