// A row's bar on the Volumes tab, as the web's (components/ownedBar): what
// they own of a series inked in, empty where a volume or book isn't theirs,
// so a gap is a break in the bar. An edition's books and the singles after
// them are pills of their own (core lib/ownedBar). Opened, the bar is a map:
// a tap on it moves the shelf under it to that spot (`onPick`)
import Tap from "@/components/Tap";
import { View } from "react-native";
import { barRuns, shareOf, type BarSlot } from "@/core/lib/ownedBar";

export default function OwnedBar({
  owned,
  total,
  books = null,
  onPick,
}: {
  owned: number[];
  total: number;
  books?: number[][] | null;
  onPick?: (volume: number) => void;
}) {
  const runs = barRuns(total, books);
  if (!runs.length) return null;
  const mine = new Set(owned);
  const fill = (slot: BarSlot) => (
    <View
      className="absolute inset-y-0 left-0 bg-ink-soft"
      style={{ width: `${shareOf(slot, mine) * 100}%` }}
    />
  );
  return (
    <View className="flex-row gap-1">
      {runs.map((run, i) => (
        <View
          key={i}
          // a short run of singles stays a pill, never a dot
          className="h-2 min-w-3 flex-row overflow-hidden rounded-full border border-line bg-card"
          style={{
            flexGrow: run.slots.reduce((n, s) => n + s.volumes.length, 0),
            flexBasis: 0,
          }}
        >
          {run.slots.map((slot) => {
            const size = { flexGrow: slot.volumes.length, flexBasis: 0 };
            return onPick ? (
              <Tap
                key={slot.volumes[0]}
                onPress={() => onPick(slot.volumes[0]!)}
                hitSlop={{ top: 12, bottom: 12 }}
                style={size}
                className="h-full"
              >
                {fill(slot)}
              </Tap>
            ) : (
              <View key={slot.volumes[0]} style={size} className="h-full">
                {fill(slot)}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}
