// "How much is my shelf worth?": what they've spent, what the shelf would
// fetch used, and what finishing every series comes to, folded under one
// line that says the worth itself once it's known. As the web's
// (pages/Home/ShelfTotals.tsx); the numbers come from the server
import Tap from "@/components/Tap";
import { useState } from "react";
import { Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import { totalText, type ShelfTools } from "@/core/lib/collector";
import { formatPaid } from "@/core/lib/prices";
import { useColors } from "@/lib/colors";

const plural = (n: number, one: string, many = `${one}s`) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`;

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

  // a total says nothing under it; only a missing one says when to look again
  const notYet = [
    "Prices for your shelf are still coming in. Check back tomorrow for the total.",
  ];
  const worthNotes = worth ? [] : notYet;

  return (
    <View className="mb-3 border-y border-dashed border-line-soft">
      <Tap
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
      </Tap>
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
              label="To finish all your series"
              value={finish ?? "no total yet"}
              notes={finish ? [] : notYet}
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
