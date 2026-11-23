// A month at a glance (the web's components/calendar/MiniMonth.tsx): the
// days in a grid, today marked, each release day circled in red ink
import { useCorners } from "@/lib/mangaThemes";
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
  onCard = false,
}: {
  month: string;
  volumes: CalendarVolume[];
  // it sits on a card already (the New tab's panel): the page colour then
  onCard?: boolean;
}) {
  const corners = useCorners();
  const c = useColors();
  const today = todayIso();
  const byDay = new Map<string, CalendarVolume[]>();
  for (const v of volumes)
    byDay.set(v.published, [...(byDay.get(v.published) ?? []), v]);
  return (
    <View
      className={`gap-2.5 rounded-[14px] border border-line-soft p-4 ${onCard ? "bg-paper" : "bg-card"}`}
      style={corners.panel}
    >
      <View className="flex-row items-baseline justify-between">
        <Text className="font-brand pr-[5px] text-[19px] tracking-[1px] text-ink uppercase">
          {monthName(month)}
          {"\u00A0"}
        </Text>
        <Text className="font-body text-[13px] text-ink-soft">
          {volumes.length} {volumes.length === 1 ? "release" : "releases"}
        </Text>
      </View>
      <View className="flex-row">
        {DOW.map((d, i) => (
          <Text
            key={i}
            className="flex-1 text-center font-body-medium text-[11.5px] text-muted"
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
              // a hair under a seventh: seven of exactly 100/7% add up to a
              // touch over the row on some screens, and the seventh day wraps
              style={{ width: "14.28%" }}
              className="h-10 items-center justify-center"
            >
              {/* today: a soft disc under the number */}
              {isToday && d.inMonth && !out.length ? (
                <View className="absolute h-8 w-8 rounded-full bg-accent-wash" />
              ) : null}
              <Text
                className={`font-mono text-[13.5px] ${!d.inMonth ? "opacity-0" : out.length ? "font-mono-medium text-ink" : isToday ? "font-mono-medium text-accent" : "text-ink-soft"}`}
              >
                {d.day}
              </Text>
              {out.length ? (
                <Svg
                  viewBox="0 0 40 40"
                  width={34}
                  height={34}
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
