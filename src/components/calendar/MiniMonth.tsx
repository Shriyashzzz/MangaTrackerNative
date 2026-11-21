// A month at a glance (the web's components/calendar/MiniMonth.tsx): the
// days in a grid, today marked, each release day circled in red ink
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import {
  monthDays,
  monthName,
  todayIso,
  type CalendarVolume,
} from "@/core/lib/collector";
import { useColors } from "@/lib/colors";

const DOW = ["S", "M", "T", "W", "T", "F", "S"];

export default function MiniMonth({
  month,
  volumes,
}: {
  month: string;
  volumes: CalendarVolume[];
}) {
  const c = useColors();
  const today = todayIso();
  const byDay = new Map<string, CalendarVolume[]>();
  for (const v of volumes)
    byDay.set(v.published, [...(byDay.get(v.published) ?? []), v]);
  return (
    <View className="gap-1.5 rounded-[4px] border-[1.5px] border-line bg-card p-2.5">
      <View className="flex-row items-baseline justify-between">
        <Text className="font-brand pr-1 text-[16px] tracking-[1px] text-ink uppercase">
          {monthName(month)}
        </Text>
        <Text className="font-mono text-[11.5px] text-muted">
          {volumes.length} {volumes.length === 1 ? "release" : "releases"}
        </Text>
      </View>
      <View className="flex-row">
        {DOW.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center font-mono text-[10px] text-muted"
          >
            {d}
          </Text>
        ))}
      </View>
      <View className="flex-row flex-wrap">
        {monthDays(month).map((d) => {
          const out = d.inMonth ? (byDay.get(d.iso) ?? []) : [];
          const isToday = d.iso === today;
          return (
            <View
              key={d.iso}
              style={{ width: `${100 / 7}%` }}
              className="h-7 items-center justify-center"
            >
              <Text
                className={`font-mono text-[12px] ${!d.inMonth ? "text-line" : out.length ? "font-mono-medium text-ink" : isToday ? "text-accent" : "text-ink-soft"}`}
              >
                {d.day}
              </Text>
              {out.length ? (
                <Svg
                  viewBox="0 0 40 40"
                  width={26}
                  height={26}
                  style={{ position: "absolute" }}
                >
                  <Path
                    d="M20 4c9 0 16 6 16 15s-7 17-17 17S3 29 4 19 11 5 22 5"
                    fill="none"
                    stroke={c.accent}
                    strokeWidth={2.4}
                    strokeLinecap="round"
                  />
                </Svg>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
