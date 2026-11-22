// "Save the date" (the web's components/calendar/AddToCalendar.tsx): one
// release into Google Calendar, or the dates as a calendar file handed to
// the phone's share sheet for Apple, Outlook and the rest
import { openOutside } from "@/lib/openOutside";
import { useState } from "react";
import { Pressable, Share, Text } from "react-native";
import { CalendarPlusIcon } from "@/core/components/icons/Icons";
import { buildIcs, googleCalendarLink, hasDay } from "@/core/lib/addToCalendar";
import type { CalendarVolume } from "@/core/lib/collector";
import { volumePath } from "@/core/lib/pricePaths";
import { siteOrigin } from "@/core/lib/siteOrigin";
import { useColors } from "@/lib/colors";
import MenuSheet from "../MenuSheet";

const GOOGLE_IMPORT_PAGE =
  "https://calendar.google.com/calendar/u/0/r/settings/export";
const pageFor = (v: CalendarVolume) =>
  `${siteOrigin()}${volumePath(v.isbn13, v.title)}`;

export default function AddToCalendar({
  volumes,
  label,
  big = false,
  text,
}: {
  volumes: CalendarVolume[];
  label: string;
  big?: boolean;
  text?: string;
}) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const dated = volumes.filter(hasDay);
  const one = dated.length === 1 ? dated[0]! : null;
  if (!dated.length) return null;
  const word = big
    ? (text ?? (one ? "Save the date" : `Save all ${dated.length} dates`))
    : "Add";
  const shareFile = () =>
    void Share.share({ title: label, message: buildIcs(dated, pageFor) }).catch(
      () => {},
    );
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityLabel={label}
        hitSlop={6}
        className={`flex-row items-center gap-1.5 ${big ? "min-h-[36px] self-start rounded-full bg-ink/10 px-3.5 py-2" : "p-1"}`}
      >
        <CalendarPlusIcon color={c.ink} width={18} height={18} />
        {big ? (
          <Text className="font-body-medium text-[14px] text-ink">{word}</Text>
        ) : null}
      </Pressable>
      <MenuSheet
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        items={[
          {
            label: "Google Calendar",
            onPress: () => {
              openOutside(
                one ? googleCalendarLink(one, pageFor) : GOOGLE_IMPORT_PAGE,
              );
              // several dates: Google's import page, and the file to give it
              if (!one) void shareFile();
            },
          },
          { label: "Apple, Outlook and others", onPress: shareFile },
        ]}
      />
    </>
  );
}
