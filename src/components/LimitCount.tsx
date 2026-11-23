// How much of a free limit is used, said quietly where the limit lives, so
// the end of it is never a surprise: "12 of 80 free scans". Only where the
// limits are on (the iPhone app, a free account); tapping it opens Premium
import { Text, type TextStyle } from "react-native";
import Tap from "@/components/Tap";
import { usePlan, type Counted } from "@/store/plan";

const SAID: Record<Counted, (used: number, limit: number) => string> = {
  series: (used, limit) => `${used} of ${limit} free series`,
  scans: (used, limit) => `${used} of ${limit} free scans`,
  priceAlerts: (used, limit) => `${used} of ${limit} price targets`,
};

export function useLimit(what: Counted) {
  const plan = usePlan((s) => s.plan);
  if (!plan.limited || !plan.limits) return null;
  return { used: plan.used[what], limit: plan.limits[what] };
}

export default function LimitCount({
  what,
  className = "font-mono text-[12.5px] text-muted",
  style,
}: {
  what: Counted;
  className?: string;
  style?: TextStyle;
}) {
  const limit = useLimit(what);
  const showCollector = usePlan((s) => s.showCollector);
  if (!limit) return null;
  return (
    <Tap
      onPress={() => showCollector()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={`${SAID[what](limit.used, limit.limit)}. About Premium`}
      className="self-center"
    >
      <Text className={className} style={style}>
        {SAID[what](limit.used, limit.limit)}
      </Text>
    </Tap>
  );
}
