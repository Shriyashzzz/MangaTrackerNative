// Upcoming Releases, as the web's pages/Calendar/Calendar.tsx: every English
// volume coming out for the shelf, month by month, each month at a glance
// with its dates to save, the first two open and the rest folded
import { useCorners } from "@/lib/mangaThemes";
import { usePlan } from "@/store/plan";
import Tap from "@/components/Tap";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import AddToCalendar from "@/components/calendar/AddToCalendar";
import MiniMonth from "@/components/calendar/MiniMonth";
import ReleaseList, { VolumeCover } from "@/components/calendar/ReleaseList";
import Mascot from "@/components/Mascot";
import Page, { P } from "@/components/Page";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import {
  dayName,
  getCalendar,
  monthName,
  monthOnly,
  type CalendarMonth,
} from "@/core/lib/collector";
import DoubleRule from "@/components/DoubleRule";
import { useColors } from "@/lib/colors";

const OPEN_MONTHS = 2;
const PEEK = 5;
const MONTH_LIMIT = 8;

function Month({ month }: { month: CalendarMonth }) {
  const corners = useCorners();
  return (
    <View className="gap-3">
      <MiniMonth month={month.month} volumes={month.volumes} />
      {month.volumes.length > 1 ? (
        <AddToCalendar
          big
          volumes={month.volumes}
          label={`Save ${monthName(month.month)}'s release dates to your calendar`}
          text={`Save these ${month.volumes.length} dates`}
        />
      ) : null}
      {/* the month's books, on their own card under the grid */}
      <View
        className="rounded-[14px] border border-line-soft bg-card px-4 pt-1 pb-1"
        style={corners.panel}
      >
        <ReleaseList volumes={month.volumes} limit={MONTH_LIMIT} />
      </View>
    </View>
  );
}

export default function CalendarScreen() {
  const open = usePlan((s) => s.plan.calendar);
  return open ? <Calendar /> : <CalendarLocked />;
}

// Where the limits are on and they haven't Premium: their next release is
// shown (the New tab shows it too), and the months after it as closed
// panels that say how many of their volumes each holds. Drawn as the
// website's pages are: the headline with words knocked out in ink, the
// double rule, a speed-line panel, a stamped label
function CalendarLocked() {
  const showCollector = usePlan((s) => s.showCollector);
  const [months, setMonths] = useState<CalendarMonth[] | null>(null);
  useEffect(() => {
    getCalendar()
      .then(setMonths)
      .catch(() => setMonths([]));
  }, []);
  const all = months?.flatMap((m) => m.volumes) ?? [];
  const next = all[0];
  // after the next one: each month's count, the third on as one line
  const later = (months ?? [])
    .map((m) => ({
      month: m.month,
      count: m.volumes.filter((v) => v !== next).length,
    }))
    .filter((m) => m.count > 0);
  const rows = [
    ...later.slice(0, 2).map((m) => ({
      name: monthOnly(m.month),
      count: m.count,
    })),
    ...(later.length > 2
      ? [
          {
            name: `${monthOnly(later[2]!.month)} on`,
            count: later.slice(2).reduce((n, m) => n + m.count, 0),
          },
        ]
      : []),
  ];
  const more = all.length - 1;
  return (
    <Page title="Upcoming Releases">
      <View className="gap-3.5">
        <View className="flex-row flex-wrap items-center gap-x-1.5 gap-y-1">
          {["Every release,", "month", "by", "month"].map((word, i) => {
            const boxed = word === "month";
            return (
              <View
                key={i}
                className={boxed ? "bg-ink px-1.5" : ""}
                style={boxed ? { transform: [{ rotate: "-1.5deg" }] } : null}
              >
                <Text
                  className={`font-brand pr-[4px] text-[38px] leading-[42px] tracking-[1px] uppercase ${boxed ? "text-paper" : "text-ink"}`}
                >
                  {word}
                  {"\u00A0"}
                </Text>
              </View>
            );
          })}
        </View>
        <DoubleRule />
        <P muted>
          Your next release is free. Premium shows the rest of the year for your
          shelf, and saves it to your phone&apos;s calendar.
        </P>
        {next ? (
          <View className="flex-row items-center gap-3 overflow-hidden rounded-[6px] border-2 border-line bg-card p-3">
            <View className="absolute inset-0 items-center justify-center opacity-50">
              {Array.from({ length: 15 }, (_, i) => (
                <View
                  key={i}
                  className="absolute h-[1.5px] w-[560px] bg-line-soft"
                  style={{ transform: [{ rotate: `${i * 12}deg` }] }}
                />
              ))}
            </View>
            <VolumeCover volume={next} />
            <View className="min-w-0 flex-1 gap-1">
              <Text className="font-mono text-[11px] tracking-[1px] text-muted uppercase">
                Next · {dayName(next.published)}
              </Text>
              <Text className="font-body-semibold text-[16px] text-ink">
                {next.name}
                {next.volume !== null ? `, Vol. ${next.volume}` : ""}
              </Text>
              <View
                className="self-start border-[1.5px] border-ink bg-award-market px-1.5 pt-[2px]"
                style={{ transform: [{ rotate: "-2deg" }] }}
              >
                <Text className="font-brand pr-[3px] text-[13px] tracking-[0.5px] text-ink uppercase">
                  Next up!{"\u00A0"}
                </Text>
              </View>
            </View>
          </View>
        ) : null}
        {rows.length > 0 ? (
          <View className="overflow-hidden rounded-[6px] border-2 border-line bg-paper-2">
            <View className="flex-row items-center justify-between border-b-2 border-line px-3 py-2">
              <View className="bg-accent px-2 pt-[2px]">
                <Text className="font-brand pr-[3px] text-[15px] tracking-[1px] text-on-accent uppercase">
                  With Premium{"\u00A0"}
                </Text>
              </View>
              <Text className="font-mono text-[11px] text-muted uppercase">
                {more} more on the way
              </Text>
            </View>
            {rows.map((row, i) => (
              <View
                key={row.name}
                className={`flex-row items-center gap-3 px-3 py-3 ${i ? "border-t border-dashed border-line-soft" : ""}`}
              >
                <Text className="w-[104px] font-brand pr-[3px] text-[20px] tracking-[1px] text-ink uppercase">
                  {row.name}
                  {"\u00A0"}
                </Text>
                <Text className="flex-1 font-body text-[13.5px] text-ink-soft">
                  {row.count} {row.count === 1 ? "volume" : "volumes"} for your
                  shelf
                </Text>
              </View>
            ))}
          </View>
        ) : null}
        <Button
          kind="primary"
          wide
          label="Get Premium"
          onPress={() => showCollector("calendar")}
        />
      </View>
    </Page>
  );
}

function Calendar() {
  const c = useColors();
  const [months, setMonths] = useState<CalendarMonth[] | null | undefined>();
  const [open, setOpen] = useState<Set<string>>(() => new Set());
  const fetchMonths = () =>
    getCalendar()
      .then(setMonths)
      .catch(() => setMonths(null));
  useEffect(() => void fetchMonths(), []);
  // Try again: the loading state back while it's fetched
  const load = () => {
    setMonths(undefined);
    void fetchMonths();
  };
  return (
    <Page title="Upcoming Releases" center={months?.length === 0}>
      <P muted>Upcoming English volumes for the series on your shelf.</P>
      {months && months.length > 1 ? (
        <AddToCalendar
          big
          volumes={months.flatMap((m) => m.volumes)}
          label="Save every upcoming release date to your calendar"
          text={`Save all ${months.reduce((n, m) => n + m.volumes.length, 0)} dates`}
        />
      ) : null}
      {months === null ? (
        <View className="gap-2">
          <P>
            Couldn't get the release dates right now. Try again in a moment.
          </P>
          <Button label="Try again" small onPress={load} />
        </View>
      ) : null}
      {months?.length === 0 ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <Text className="text-center font-body text-[15px] leading-[22px] text-ink-soft">
            Dates show up here once a publisher lists a coming volume for a
            series on your shelf.
          </Text>
        </View>
      ) : null}
      {months?.map((m, i) => {
        const shown = i < OPEN_MONTHS || open.has(m.month);
        return (
          <View key={m.month} className="gap-3">
            {i >= OPEN_MONTHS ? (
              <Tap
                onPress={() =>
                  setOpen((now) => {
                    const next = new Set(now);
                    if (!next.delete(m.month)) next.add(m.month);
                    return next;
                  })
                }
                accessibilityState={{ expanded: shown }}
                className="flex-row items-center gap-3 border-t border-dashed border-line-soft pt-3"
              >
                <View className="min-w-0 flex-1">
                  <Text className="font-brand pr-[5px] text-[20px] tracking-[1px] text-ink uppercase">
                    {monthName(m.month)}
                    {"\u00A0"}
                  </Text>
                  <Text className="font-mono text-[12px] text-muted">
                    {m.volumes.length} coming
                  </Text>
                </View>
                {!shown ? (
                  <View className="flex-row">
                    {m.volumes.slice(0, PEEK).map((v, j) => (
                      <View key={v.isbn13} style={{ marginLeft: j ? -8 : 0 }}>
                        <VolumeCover volume={v} />
                      </View>
                    ))}
                  </View>
                ) : null}
                <View
                  style={{ transform: [{ rotate: shown ? "180deg" : "0deg" }] }}
                >
                  <ChevronDownIcon color={c.muted} width={18} height={18} />
                </View>
              </Tap>
            ) : null}
            {shown ? <Month month={m} /> : null}
          </View>
        );
      })}
    </Page>
  );
}
