// "How much is my shelf worth?": what they've spent, what the shelf would
// fetch used, and what finishing every series comes to, folded under one
// line that says the worth itself once it's known. As the web's
// (pages/Home/ShelfTotals.tsx); the numbers come from the server
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { totalText, type ShelfTools } from "@/core/lib/collector";
import { formatPaid } from "@/core/lib/prices";
import { useColors } from "@/lib/colors";

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

const FILL_IN = "The rest fill in over a few days.";
const SOLD_USED = "If sold used, at today's prices.";

const pricedSoFar = (priced: number, of: number) => [
  `${priced.toLocaleString()} of ${of.toLocaleString()} priced so far.`,
  FILL_IN,
];

// under "To finish your series", one sentence a line
function finishNote(tools: ShelfTools, hasTotal: boolean) {
  const unit = tools.finish.some((f) => f.edition) ? "book" : "volume";
  const lines = [
    `For the ${plural(tools.finishMissing, unit)} you don't have yet.`,
  ];
  if (tools.finishUncosted && hasTotal)
    lines.push(
      `${plural(tools.finishUncosted, "series", "series")} not counted yet.`,
    );
  if (tools.finishPriced < tools.finishMissing)
    lines.push(...pricedSoFar(tools.finishPriced, tools.finishMissing));
  return lines;
}

function Total({
  label,
  value,
  notes,
}: {
  label: string;
  value: string;
  notes: string[];
}) {
  return (
    <View className="gap-0.5">
      <Text className="font-body-semibold text-[12.5px] tracking-[1px] text-ink-soft uppercase">
        {label}
      </Text>
      <Text className="font-brand pr-[6px] text-[26px] leading-[30px] text-ink">
        {value}
        {"\u00A0"}
      </Text>
      {notes.map((line) => (
        <Text key={line} className="font-mono text-[12px] text-muted">
          {line}
        </Text>
      ))}
    </View>
  );
}

export default function ShelfTotals({
  tools,
  owned,
}: {
  tools: ShelfTools;
  owned: number;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const { value } = tools;
  // every owned volume, as the line above counts them: a total is exact
  // only when all of them are priced
  const ownedVolumes = Math.max(owned, value.volumes + value.unlisted);
  const worth = totalText(
    value.cents,
    value.priced,
    ownedVolumes,
    value.estimateCents,
  );
  const finish = totalText(
    tools.finishCents,
    tools.finishPriced,
    tools.finishMissing,
    tools.finishEstimateCents,
  );
  const spent = tools.spent?.books ? tools.spent : null;
  if (!ownedVolumes && !tools.finishMissing && !spent) return null;

  const worthNotes = !worth
    ? pricedSoFar(value.priced, ownedVolumes)
    : value.priced >= ownedVolumes
      ? [SOLD_USED]
      : [
          `An estimate for all ${plural(ownedVolumes, "volume")}, if sold used at today's prices.`,
          `${value.priced.toLocaleString()} priced so far, the rest at their series' usual price.`,
        ];

  return (
    <View className="mb-3 border-y border-dashed border-line-soft">
      <Pressable
        onPress={() => setOpen(!open)}
        className="flex-row items-center justify-between gap-3 px-1 py-2.5 active:bg-accent-wash"
        accessibilityState={{ expanded: open }}
      >
        <Text className="font-body-semibold text-[15px] text-ink">
          {worth && ownedVolumes > 0
            ? `Your shelf is worth ${worth}`
            : "How much is my shelf worth?"}
        </Text>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color={c.muted} width={16} height={16} />
        </View>
      </Pressable>
      {open ? (
        <View className="gap-4 border-t border-dashed border-line-soft px-1 py-3">
          {spent ? (
            <Total
              label="You've spent"
              value={formatPaid(spent.cents)}
              notes={[
                `on the ${plural(spent.books, "book")} you added a price to`,
              ]}
            />
          ) : null}
          {ownedVolumes > 0 ? (
            <Total
              label="Your shelf is worth"
              value={worth ?? "no total yet"}
              notes={worthNotes}
            />
          ) : null}
          {tools.finishMissing > 0 ? (
            <Total
              label="To finish your series"
              value={finish ?? "no total yet"}
              notes={finishNote(tools, Boolean(finish))}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
