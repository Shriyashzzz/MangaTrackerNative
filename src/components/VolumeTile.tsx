// One volume on a series' price page, as the Android app's cover grid (web
// pages/Prices/VolumeCard.tsx): its cover with a "Vol. 5" flag, "Yours" when
// it's on their shelf, and its price under it, or "check price"
import Tap from "@/components/Tap";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { Text, View } from "react-native";
import { coverSrc, formatCents } from "@/core/lib/prices";
import type { SeriesVolume } from "@/core/lib/types";
import { useColors } from "@/lib/colors";

export default function VolumeTile({
  volume,
  yours,
  width,
}: {
  volume: SeriesVolume;
  yours: boolean;
  width: number;
}) {
  const c = useColors();
  return (
    <Link href={`/prices/${volume.isbn13}`} asChild>
      <Tap style={{ width }} className="gap-1 active:opacity-70">
        <View>
          <Image
            source={
              volume.coverUrl ? { uri: coverSrc(volume.coverUrl) } : undefined
            }
            style={{
              width,
              aspectRatio: 2 / 3,
              borderWidth: 1.5,
              borderColor: c.line,
              backgroundColor: c.paper,
              opacity: yours ? 1 : 0.9,
            }}
            contentFit="cover"
            transition={180}
          />
          <View className="absolute top-0 left-0 flex-row items-baseline gap-0.5 bg-ink px-1.5">
            <Text className="font-brand pr-[4px] text-[10px] tracking-[0.5px] text-paper uppercase">
              Vol.
              {"\u00A0"}
            </Text>
            <Text className="font-brand pr-[4px] text-[15px] text-paper">
              {volume.volume}
              {"\u00A0"}
            </Text>
          </View>
          {yours ? (
            <View className="absolute bottom-1 left-1 rounded-[2px] border-[1.5px] border-line bg-card px-1">
              <Text className="font-brand pr-[4px] text-[11px] tracking-[1px] text-ink uppercase">
                Yours
                {"\u00A0"}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          numberOfLines={1}
          className="font-mono-medium text-[12px] text-ink"
        >
          {volume.knownPriceCents != null
            ? formatCents(volume.knownPriceCents)
            : "check price"}
        </Text>
      </Tap>
    </Link>
  );
}
