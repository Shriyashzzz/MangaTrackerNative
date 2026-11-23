// The red Upcoming Releases bar at the top of New (the web's pages/Home/
// UpcomingReleases.tsx): the next release day and this month's count, with
// three covers; opened, the month at a glance, the dates to save, the first
// few releases, and the way to the full calendar
import { useCorners } from "@/lib/mangaThemes";
import { usePlan } from "@/store/plan";
import Tap from "@/components/Tap";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import {
  dayName,
  getCalendar,
  monthOnly,
  type CalendarMonth,
} from "@/core/lib/collector";
import AddToCalendar from "./calendar/AddToCalendar";
import ReleaseList, { VolumeCover } from "./calendar/ReleaseList";

const SHOWN = 4;

export default function UpcomingReleases() {
  const corners = useCorners();
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
  // without Premium (where the limits are on), only the next release:
  // the rest is the full calendar's
  const everyRelease = usePlan((s) => s.plan.calendar);
  const month = months?.[0];
  if (!month?.volumes.length) return null;
  // every upcoming one, in date order; the panel shows the first few (only
  // the next one without Premium) and the full calendar has the rest
  const all = months!.flatMap((m) => m.volumes);
  const shown = all.slice(0, everyRelease ? SHOWN : 1);
  const first = { ...month, volumes: shown.slice(0, 3) };
  const next = all[0]!;
  const inMonth = month.volumes.length;
  const more = all.length - shown.length;
  return (
    <View
      className="overflow-hidden rounded-[14px] bg-accent"
      style={corners.panel}
    >
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
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.7}
            className="font-brand pr-[4px] text-[18px] tracking-[1px] text-on-accent uppercase"
          >
            Upcoming Releases
            {"\u00A0"}
          </Text>
          <Text className="font-body text-[13.5px] text-on-accent">
            {!everyRelease
              ? `Next: ${dayName(next.published)}`
              : all.length > inMonth
                ? `${inMonth} in ${monthOnly(month.month)}, ${all.length} in all`
                : `${inMonth} in ${monthOnly(month.month)}`}
          </Text>
        </View>
        <View style={{ transform: [{ rotate: open ? "180deg" : "0deg" }] }}>
          <ChevronDownIcon color="#fffaf2" width={20} height={20} />
        </View>
      </Tap>
      {open ? (
        <View className="mx-[1.5px] mb-[1.5px] overflow-hidden rounded-b-[13px] bg-card">
          <View className="px-3">
            <ReleaseList volumes={shown} />
          </View>
          {/* without Premium: how many more there are, the rest is Premium's */}
          {!everyRelease && more > 0 ? (
            <Tap
              onPress={() => router.push("/calendar")}
              accessibilityRole="button"
              accessibilityLabel={`${more} more upcoming releases, with Premium`}
              className="mx-3 mb-3 mt-1 flex-row items-center justify-between rounded-[8px] border-2 border-dashed border-muted px-3 py-3"
              style={corners.box}
            >
              <Text className="font-body-semibold text-[14.5px] text-ink">
                {more} more upcoming {more === 1 ? "release" : "releases"}
              </Text>
              <Text className="font-body-semibold text-[15px] text-accent-ink">
                →
              </Text>
              <View
                className="absolute -top-2.5 right-3 border-[1.5px] border-ink bg-accent px-1.5 pt-[1px]"
                style={{ transform: [{ rotate: "3deg" }] }}
              >
                <Text className="font-brand pr-[3px] text-[12px] tracking-[0.5px] text-on-accent uppercase">
                  Premium{"\u00A0"}
                </Text>
              </View>
            </Tap>
          ) : null}
          {/* the dates to save, and the way to the full calendar */}
          <View className="flex-row flex-wrap items-center justify-center gap-2.5 border-t-2 border-line bg-paper-2 px-3.5 pt-2.5 pb-3.5">
            <AddToCalendar
              big
              volumes={shown}
              label="Save these release dates to your calendar"
              text={
                shown.length > 1
                  ? `Save all ${shown.length} dates`
                  : "Save the date"
              }
            />
            <Tap
              onPress={() => router.push("/calendar")}
              accessibilityRole="button"
              className="min-h-[36px] items-center justify-center rounded-full bg-ink px-3.5 py-2"
            >
              <Text className="font-body-semibold text-[14px] text-paper">
                {everyRelease && more > 0
                  ? `See all ${all.length} →`
                  : "Full calendar →"}
              </Text>
            </Tap>
          </View>
        </View>
      ) : null}
    </View>
  );
}
