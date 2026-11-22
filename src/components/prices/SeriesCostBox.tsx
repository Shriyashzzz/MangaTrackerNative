// "Collect every volume" (the web's SeriesCostBox): what the whole series
// costs new at the lowest prices found, and used copies on sale now
import { Text, View } from "react-native";
import { runTotal, type SeriesCost } from "@/core/lib/finishCost";
import { formatCents, wholeMoney } from "@/core/lib/prices";

// "$261 used for 37 of 113"
const UsedLine = ({
  used,
  volumes,
}: {
  used: { volumes: number; cents: number };
  volumes: number;
}) => (
  <Text className="font-body text-[14.5px] text-ink">
    <Text className="font-brand pr-[4px] text-[18px]">
      {wholeMoney(used.cents)}
      {"\u00A0"}
    </Text>{" "}
    <Text className="font-body-semibold text-award-market">used</Text>
    {used.volumes >= volumes
      ? ` for all ${volumes}`
      : ` for ${used.volumes} of ${volumes}`}
  </Text>
);

// "About $1,190 new for all 113 (estimate)"
const NewLine = ({
  cents,
  volumes,
  exact,
  comingSoon,
}: {
  cents: number;
  volumes: number;
  exact: boolean;
  comingSoon: boolean;
}) => (
  <Text className="font-body text-[14.5px] text-ink">
    {exact ? "" : "About "}
    <Text className="font-brand pr-[5px] text-[22px]">
      {exact ? formatCents(cents) : wholeMoney(cents)}
      {"\u00A0"}
    </Text>{" "}
    <Text className="font-body-semibold text-award-new">new</Text> for all{" "}
    {volumes}
    {comingSoon ? " out now" : ""}
    {exact ? null : (
      <Text className="font-body text-[13px] text-muted italic">
        {" "}
        (estimate)
      </Text>
    )}
  </Text>
);

export default function SeriesCostBox({
  cost,
  used,
  comingSoon,
}: {
  cost: SeriesCost;
  used: { volumes: number; cents: number } | null;
  comingSoon: boolean;
}) {
  const run = runTotal(cost);
  // too few priced for the real estimate: the priced ones' average, times
  // the run, said as the rough guess it is
  const rough =
    !run && cost.priced > 0
      ? Math.round((cost.cents / cost.priced) * cost.volumes)
      : 0;
  if (!run && !used && !rough) return null;
  return (
    <View className="gap-1.5 rounded-[14px] border border-line-soft bg-card p-3">
      <Text className="font-brand pr-[4px] text-[18px] tracking-[1px] text-ink uppercase">
        Collect every volume
        {"\u00A0"}
      </Text>
      {run ? (
        <NewLine
          cents={run.cents}
          volumes={cost.volumes}
          exact={run.exact}
          comingSoon={comingSoon}
        />
      ) : rough ? (
        <NewLine
          cents={rough}
          volumes={cost.volumes}
          exact={false}
          comingSoon={false}
        />
      ) : null}
      {used ? <UsedLine used={used} volumes={cost.volumes} /> : null}
    </View>
  );
}
