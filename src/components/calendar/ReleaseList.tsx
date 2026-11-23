// Upcoming volumes, one a row (the web's components/calendar/ReleaseList.tsx):
// the day, the cover (the series' with the volume's on top), the name, and
// Preorder for one not on the shelf yet; each saves to a calendar
import DrawnCover from "@/components/DrawnCover";
import { coverAt } from "@/lib/coverAt";
import LightNovelBand from "@/components/LightNovelBand";
import Tap from "@/components/Tap";
import { Image } from "expo-image";
import { VolTab } from "@/components/prices/VolumeCard";
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
      {/* behind the volume's own cover (an upcoming one often has none
          yet): the series' cover, or with none of that either, the drawn
          one, never an empty box */}
      {volume.seriesCover ? (
        <Image
          source={{ uri: coverSrc(volume.seriesCover) }}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : (
        <View style={{ position: "absolute" }}>
          <DrawnCover title={volume.name} width={w - 3} />
        </View>
      )}
      {volume.coverUrl ? (
        <Image
          source={{ uri: coverAt(volume.coverUrl, w) }}
          style={{ width: "100%", height: "100%" }}
          contentFit="cover"
        />
      ) : null}
      {volume.volume !== null ? (
        <VolTab number={String(volume.volume)} small={!big} />
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
        const named = `${v.name}${v.volume !== null ? ` Vol. ${v.volume}` : ""}`;
        return (
          <View
            key={v.isbn13}
            // a rule between rows, none under the last
            className={`flex-row gap-3 py-3 ${i < shown.length - 1 ? "border-b border-line-soft" : ""}`}
          >
            <Tap
              onPress={() => router.push(`/prices/${v.isbn13}`)}
              className="active:opacity-70"
              accessibilityLabel={`${named}: out ${dayName(v.published)}${v.owned ? ", on your shelf" : ""}`}
            >
              <VolumeCover volume={v} big={roomy} />
            </Tap>
            {/* the name and volume, and under them the date to save */}
            <View className="min-w-0 flex-1 justify-between gap-2">
              <Tap onPress={() => router.push(`/prices/${v.isbn13}`)}>
                <Text
                  numberOfLines={1}
                  className="font-body-semibold text-[16px] leading-[22px] text-ink"
                >
                  {v.name}
                </Text>
                <Text
                  numberOfLines={1}
                  className="font-mono text-[13px] text-muted"
                >
                  {v.volume !== null ? `Vol. ${v.volume}` : v.title}
                </Text>
              </Tap>
              <AddToCalendar
                plain
                text="Save date"
                volumes={[v]}
                label={`Add ${named} to calendar`}
              />
            </View>
            {/* when it's out, big, over the way to preorder it */}
            <View className="min-w-[112px] items-center justify-between gap-2">
              <Text className="font-brand pr-[4px] text-[26px] leading-[28px] tracking-[1px] text-ink uppercase">
                {dayName(v.published)}
                {"\u00A0"}
              </Text>
              {v.owned ? (
                <Text className="min-h-[32px] font-body text-[13px] leading-[32px] text-muted">
                  On your shelf
                </Text>
              ) : (
                <Tap
                  onPress={() => router.push(`/prices/${v.isbn13}`)}
                  accessibilityRole="button"
                  className="min-h-[34px] justify-center rounded-full border-[1.5px] border-ink bg-accent px-3.5"
                >
                  <Text className="font-body-semibold text-[14px] text-on-accent">
                    Preorder →
                  </Text>
                </Tap>
              )}
            </View>
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
