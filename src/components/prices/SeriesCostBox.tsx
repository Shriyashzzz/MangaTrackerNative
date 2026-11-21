// "Collect every volume" (the web's SeriesCostBox): what the whole series
// costs new at the lowest prices found, and used copies on sale now
import { Text, View } from "react-native";
import { runTotal, type SeriesCost } from "@/core/lib/finishCost";
import { formatCents, wholeMoney } from "@/core/lib/prices";

const UsedLine = ({
  used,
  volumes,
}: {
  used: { volumes: number; cents: number };
  volumes: number;
}) => (
  <Text className="font-body text-[14px] text-ink-soft">
    {used.volumes >= volumes
      ? `All ${volumes} are on sale used`
      : `Used copies found for ${used.volumes} of ${volumes}`}
    :{" "}
    <Text className="font-body-semibold text-ink">
      {formatCents(used.cents)}
    </Text>{" "}
    together.
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
  if (!run && !used) return null;
  return (
    <View className="gap-1.5 rounded-[4px] border-2 border-line bg-card p-3">
      <Text className="font-brand pr-1 text-[18px] tracking-[1px] text-ink uppercase">
        Collect every volume
      </Text>
      {!run ? (
        <Text className="font-body text-[14px] text-ink-soft">
          New prices found for {cost.priced} of {cost.volumes} so far. A total
          shows once most have one.
        </Text>
      ) : (
        <>
          <Text className="font-body text-[15px] text-ink">
            {run.exact ? "" : "About "}
            <Text className="font-brand pr-1 text-[22px]">
              {run.exact ? formatCents(run.cents) : wholeMoney(run.cents)}
            </Text>{" "}
            new for all {cost.volumes}
            {comingSoon ? " out now" : ""}
          </Text>
          <Text className="font-body text-[13.5px] text-ink-soft">
            {run.exact
              ? `At the lowest new price we've found for each, about ${formatCents(Math.round(cost.cents / cost.volumes))} a volume.`
              : "An estimate, from the volumes we have prices for."}
          </Text>
        </>
      )}
      {used ? <UsedLine used={used} volumes={cost.volumes} /> : null}
    </View>
  );
}
