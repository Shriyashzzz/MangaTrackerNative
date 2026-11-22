// Upcoming volumes, one a row (the web's components/calendar/ReleaseList.tsx):
// the day, the cover (the series' with the volume's on top), the name, and
// Preorder for one not on the shelf yet; each saves to a calendar
import { coverAt } from "@/lib/coverAt";
import LightNovelBand from "@/components/LightNovelBand";
import Tap from "@/components/Tap";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useState } from "react";
import { Text, View } from "react-native";
import { dayName, type CalendarVolume } from "@/core/lib/collector";
import { coverSrc, novelParts } from "@/core/lib/prices";
import { useColors } from "@/lib/colors";
import AddToCalendar from "./AddToCalendar";

export function VolumeCover({
  volume,
  big = false,
}: {
  volume: CalendarVolume;
  big?: boolean;
}) {
  const c = useColors();
  const w = big ? 56 : 36;
  return (
    <View
      style={{
        width: w,
        aspectRatio: 2 / 3,
        borderWidth: 1.5,
        borderColor: c.line,
        backgroundColor: c.paper2,
        overflow: "hidden",
      }}
    >
      {volume.seriesCover ? (
        <Image
          source={{ uri: coverSrc(volume.seriesCover) }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : null}
      {volume.coverUrl ? (
        <Image
          source={{ uri: coverAt(volume.coverUrl, w) }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : null}
      {novelParts(volume.title).lightNovel ||
      novelParts(volume.name).lightNovel ? (
        <LightNovelBand width={w} />
      ) : null}
    </View>
  );
}

const ROOMY_UP_TO = 3;

export default function ReleaseList({
  volumes,
  limit,
}: {
  volumes: CalendarVolume[];
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  const shown = !limit || all ? volumes : volumes.slice(0, limit);
  const roomy = shown.length <= ROOMY_UP_TO;
  return (
    <View>
      {shown.map((v, i) => {
        const sameDay = i > 0 && shown[i - 1]!.published === v.published;
        const named = `${v.name}${v.volume !== null ? ` Vol. ${v.volume}` : ""}`;
        return (
          <View
            key={v.isbn13}
            // a rule between rows, none under the last
            className={`flex-row items-center gap-3 py-3 ${i < shown.length - 1 ? "border-b border-line-soft" : ""}`}
          >
            <View className="w-[62px] flex-row items-center gap-1">
              <Text className="flex-1 font-mono-medium text-[12px] text-ink">
                {sameDay ? "" : dayName(v.published)}
              </Text>
              <AddToCalendar volumes={[v]} label={`Add ${named} to calendar`} />
            </View>
            <Tap
              onPress={() => router.push(`/prices/${v.isbn13}`)}
              className="min-w-0 flex-1 flex-row items-center gap-3 active:opacity-70"
              accessibilityLabel={`${named}: out ${dayName(v.published)}${v.owned ? ", on your shelf" : ""}`}
            >
              <VolumeCover volume={v} big={roomy} />
              <View className="min-w-0 flex-1">
                <Text
                  numberOfLines={1}
                  className="font-body-semibold text-[14.5px] text-ink"
                >
                  {v.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-mono text-[12px] text-muted"
                >
                  {v.volume !== null ? `Vol. ${v.volume}` : v.title}
                </Text>
              </View>
            </Tap>
            {v.owned ? null : (
              <Tap
                onPress={() => router.push(`/prices/${v.isbn13}`)}
                hitSlop={6}
              >
                <Text className="font-body-semibold text-[13.5px] text-accent border-b pb-[2px] border-accent self-start">
                  Preorder →
                </Text>
              </Tap>
            )}
          </View>
        );
      })}
      {limit && volumes.length > limit ? (
        <Tap onPress={() => setAll(!all)} className="py-2">
          <Text className="font-body-semibold text-[14px] text-ink border-b pb-[2px] border-ink self-start">
            {all ? "Show fewer" : `Show all ${volumes.length}`}
          </Text>
        </Tap>
      ) : null}
    </View>
  );
}
