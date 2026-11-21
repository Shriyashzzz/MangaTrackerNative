// Buy next on a series' page, as the Android app's (web pages/Details/
// BuyStrip.tsx): the one to get next on a red ticket, with its price or
// "check price", and the gaps under it. For an edition's collector, its books
// ("Deluxe 3 · vols. 7–9, you have 1 of 3") from the edition's own plan;
// otherwise single volumes, by the one rule (core buyNextOf via useBuyOptions)
import { Text, View } from "react-native";
import {
  editionBookLabel,
  insideText,
  type EditionLine,
  type EditionPlan,
} from "@/core/lib/editions";
import { rangesText } from "@/core/lib/ownedVolumes";
import { formatCents } from "@/core/lib/prices";
import type { BuyOptions } from "@/core/pages/Details/useBuyOptions";

type Props = {
  options: BuyOptions;
  // the edition they collect, with its plan; null for single volumes
  edition: { line: EditionLine; plan: EditionPlan } | null;
  // the furthest volume they own (a next below it fills a gap)
  highest: number;
  // single volumes missing before the furthest they own
  gaps: number[];
};

const price = (cents: number | null | undefined) =>
  cents != null ? formatCents(cents) : "check price";

function Ticket({
  kind,
  name,
  inside,
  cost,
}: {
  kind: string;
  name: string;
  inside?: string;
  cost: string;
}) {
  return (
    <View className="flex-row items-baseline justify-between rounded-[4px] border-2 border-accent bg-accent-wash px-3 py-2.5">
      <View className="min-w-0 flex-1">
        <Text className="font-mono-medium text-[11.5px] tracking-[1px] text-accent-ink uppercase">
          {kind}
        </Text>
        <Text className="font-body-semibold text-[16px] text-ink">{name}</Text>
        {inside ? (
          <Text className="font-body text-[13.5px] text-ink-soft italic">
            {inside}
          </Text>
        ) : null}
      </View>
      <Text className="font-mono-medium text-[15px] text-accent-ink">
        {cost}
      </Text>
    </View>
  );
}

export default function BuyNext({ options, edition, highest, gaps }: Props) {
  if (options.loading) return null;

  if (edition) {
    const { line, plan } = edition;
    if (!plan.next && !plan.caughtUp && !plan.gaps.length) return null;
    return (
      <View className="gap-2">
        <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
          Buy next
        </Text>
        {plan.next ? (
          <Ticket
            kind="Next for you"
            name={editionBookLabel(line, plan.next)}
            inside={`${insideText(plan.next)}${plan.next.have ? `, you have ${plan.next.have} of ${plan.next.volumes.length}` : ""}`}
            cost={price(plan.next.knownPriceCents)}
          />
        ) : plan.caughtUp ? (
          <Text className="font-body text-[15px] text-ink-soft">
            All {plan.outBooks} {line.label} books are yours
          </Text>
        ) : null}
        {plan.gaps.length > 0 ? (
          <Text className="font-body text-[14px] text-ink-soft">
            Not on your shelf:{" "}
            {plan.gaps.map((b) => editionBookLabel(line, b)).join(", ")}
          </Text>
        ) : null}
      </View>
    );
  }

  const next = options.next;
  if (!next && !options.caughtUp && !gaps.length) return null;
  return (
    <View className="gap-2">
      <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-ink uppercase">
        Buy next
      </Text>
      {next ? (
        <Ticket
          kind={next.volume < highest ? "Fills a gap" : "Next for you"}
          name={`Vol. ${next.volume}`}
          cost={price(next.knownPriceCents)}
        />
      ) : options.caughtUp && options.latest ? (
        <Text className="font-body text-[15px] text-ink-soft">
          Caught up · Vol. {options.latest.volume} is the newest in English
        </Text>
      ) : null}
      {gaps.length > 0 ? (
        <Text className="font-body text-[14px] text-ink-soft">
          Not on your shelf: {rangesText(gaps)}
        </Text>
      ) : null}
    </View>
  );
}
