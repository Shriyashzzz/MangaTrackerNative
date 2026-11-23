// The red Upcoming Releases bar at the top of New (the web's pages/Home/
// UpcomingReleases.tsx): the next release day and this month's count, with
// three covers; opened, the month at a glance, the dates to save, the first
// few releases, and the way to the full calendar
import Tap from "@/components/Tap";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import {
  dayName,
  getCalendar,
  monthName,
  monthOnly,
  type CalendarMonth,
} from "@/core/lib/collector";
import AddToCalendar from "./calendar/AddToCalendar";
import MiniMonth from "./calendar/MiniMonth";
import ReleaseList, { VolumeCover } from "./calendar/ReleaseList";

const SHOWN = 6;

export default function UpcomingReleases() {
  const [months, setMonths] = useState<CalendarMonth[] | null>(null);
  const [open, setOpen] = useState(false);
  // Asked again each time New comes into view, not only the first time:
  // the tab stays alive while the app is open, so an answer from days ago
  // (or one missed while there was no connection) kept a new release out
  // of the list until the app was closed
  useFocusEffect(
    useCallback(() => {
      const controller = new AbortController();
      getCalendar(controller.signal)
        .then(setMonths)
        .catch(() => {});
      return () => controller.abort();
    }, []),
  );
  const first = months?.[0];
  if (!first?.volumes.length) return null;
  const next = first.volumes[0]!;
  const count = first.volumes.length;
  return (
    <View className="overflow-hidden rounded-[14px] bg-accent">
      <Tap
        onPress={() => setOpen(!open)}
        accessibilityState={{ expanded: open }}
        className="flex-row items-center gap-3 px-3 py-2.5"
      >
        <View className="flex-row">
          {first.volumes.slice(0, 3).map((v, i) => (
            <View
              key={v.isbn13}
              style={{
                transform: [{ rotate: `${[-4, 3, -2][i]}deg` }],
                marginLeft: i ? -10 : 0,
              }}
            >
              <VolumeCover volume={v} />
            </View>
          ))}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-brand pr-[4px] text-[18px] tracking-[1px] text-on-accent uppercase">
            Upcoming Releases
            {"\u00A0"}
          </Text>
          <Text className="font-body text-[13.5px] text-on-accent">
            Next: {dayName(next.published)} · {count} in{" "}
            {monthOnly(first.month)}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color="#fffaf2" width={20} height={20} />
        </View>
      </Tap>
      {open ? (
        <View className="mx-[1.5px] mb-[1.5px] gap-4 rounded-b-[13px] bg-card px-4 pt-4 pb-3">
          <MiniMonth onCard month={first.month} volumes={first.volumes} />
          <View className="flex-row flex-wrap items-center gap-3">
            <AddToCalendar
              big
              volumes={first.volumes}
              label={`Save ${monthName(first.month)}'s release dates to your calendar`}
              text={`Save ${first.volumes.length > 1 ? `${first.volumes.length} dates` : "the date"}`}
            />
            <Tap onPress={() => router.push("/calendar")} hitSlop={6}>
              <Text className="font-body-semibold text-[14px] text-ink border-b pb-[2px] border-ink self-start">
                Full calendar
              </Text>
            </Tap>
          </View>
          <ReleaseList volumes={first.volumes.slice(0, SHOWN)} />
        </View>
      ) : null}
    </View>
  );
}
