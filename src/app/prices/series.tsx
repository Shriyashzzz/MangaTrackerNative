// A series' prices, as the Android app's (web pages/Prices/PriceSeries.tsx):
// its cover and name, how many volumes are out, and every volume as a cover
// with its price, theirs stamped "Yours". A cover opens that volume's prices
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import DoubleRule from "@/components/DoubleRule";
import SeriesCover from "@/components/SeriesCover";
import VolumeTile from "@/components/VolumeTile";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { ownedOf } from "@/core/lib/ownedVolumes";
import { getSeries } from "@/core/lib/prices";
import { findOnShelf } from "@/core/lib/shelf";
import type { Series, ShelfMatch } from "@/core/lib/types";
import { useColors } from "@/lib/colors";

const Safe = withUniwind(SafeAreaView);

// four covers a row, as the app's grid (web index.css .app-cover-grid)
const PER_ROW = 4;
const GAP = 10;

export default function PriceSeriesScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const c = useColors();
  const { width } = useWindowDimensions();
  const [series, setSeries] = useState<Series | null>(null);
  const [mine, setMine] = useState<ShelfMatch>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    getSeries(name, controller.signal)
      .then(setSeries)
      .catch((e: Error) => !controller.signal.aborted && setFailed(e.message));
    findOnShelf(name, controller.signal)
      .then(setMine)
      .catch(() => {});
    return () => controller.abort();
  }, [name]);

  const owned = new Set(mine ? ownedOf(mine) : []);
  const tile = (width - 32 - GAP * (PER_ROW - 1)) / PER_ROW;

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Pressable>
        <Text
          numberOfLines={1}
          className="flex-1 font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase"
        >
          {series?.name ?? name}
        </Text>
      </View>
      <DoubleRule />
      {failed ? (
        <Text className="px-4 pt-6 font-body text-[15px] text-ink-soft">
          {failed}
        </Text>
      ) : !series ? null : (
        <ScrollView contentContainerClassName="gap-5 px-4 pt-4 pb-16">
          <View className="flex-row gap-3.5">
            <SeriesCover
              name={series.name}
              url={series.info?.coverUrl}
              width={90}
              border={2}
            />
            <View className="min-w-0 flex-1 gap-1.5">
              <Text className="font-display text-[24px] leading-[28px] text-ink">
                {series.name}
              </Text>
              <Text className="font-body text-[14px] text-ink-soft">
                {series.volumes.length} volumes in English
              </Text>
              {mine ? (
                <Text className="font-body text-[14px] text-ink-soft">
                  {owned.size} on your shelf
                </Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row flex-wrap" style={{ gap: GAP, rowGap: 18 }}>
            {series.volumes
              .filter((v) => Number.isInteger(v.volume))
              .map((v) => (
                <VolumeTile
                  key={v.isbn13}
                  volume={v}
                  yours={owned.has(v.volume)}
                  width={tile}
                />
              ))}
          </View>
        </ScrollView>
      )}
    </Safe>
  );
}
