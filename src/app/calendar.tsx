// Upcoming Releases, as the web's pages/Calendar/Calendar.tsx: every English
// volume coming out for the shelf, month by month, each month at a glance
// with its dates to save, the first two open and the rest folded
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "@/components/Button";
import AddToCalendar from "@/components/calendar/AddToCalendar";
import MiniMonth from "@/components/calendar/MiniMonth";
import ReleaseList, { VolumeCover } from "@/components/calendar/ReleaseList";
import Mascot from "@/components/Mascot";
import Page, { P } from "@/components/Page";
import { ChevronDownIcon } from "@/core/components/icons/Icons";
import {
  getCalendar,
  monthName,
  type CalendarMonth,
} from "@/core/lib/collector";
import { useColors } from "@/lib/colors";

const OPEN_MONTHS = 2;
const PEEK = 5;
const MONTH_LIMIT = 8;

function Month({ month }: { month: CalendarMonth }) {
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
      <View className="rounded-[14px] border border-line-soft bg-card px-4 pt-1 pb-1">
        <ReleaseList volumes={month.volumes} limit={MONTH_LIMIT} />
      </View>
    </View>
  );
}

export default function CalendarScreen() {
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
    <Page title="Upcoming Releases">
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
          <P muted>
            Dates show up here once a publisher lists a coming volume for a
            series on your shelf.
          </P>
        </View>
      ) : null}
      {months?.map((m, i) => {
        const shown = i < OPEN_MONTHS || open.has(m.month);
        return (
          <View key={m.month} className="gap-3">
            {i >= OPEN_MONTHS ? (
              <Pressable
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
              </Pressable>
            ) : null}
            {shown ? <Month month={m} /> : null}
          </View>
        );
      })}
    </Page>
  );
}
