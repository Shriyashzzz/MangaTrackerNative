// "Save the date" (the web's components/calendar/AddToCalendar.tsx): one
// release into Google Calendar, or the dates as a calendar file handed to
// the phone's share sheet for Apple, Outlook and the rest
import { useState } from "react";
import { Linking, Pressable, Share, Text } from "react-native";
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
        className={`flex-row items-center gap-1.5 ${big ? "self-start rounded-[3px] border-[1.5px] border-line px-2.5 py-1.5" : "p-1"}`}
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
            onPress: () =>
              void Linking.openURL(
                one ? googleCalendarLink(one, pageFor) : GOOGLE_IMPORT_PAGE,
              ).then(() => (one ? undefined : shareFile())),
          },
          { label: "Apple, Outlook and others", onPress: shareFile },
        ]}
      />
    </>
  );
}
