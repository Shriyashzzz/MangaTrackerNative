// A series as a card on the price pages (the web's pages/Prices/
// SeriesCard.tsx): its cover with its score as stars, the name, and a line
// of what it is
import { memo } from "react";
import { router } from "expo-router";
import PressScale from "../PressScale";
import { Text, View } from "react-native";
import { StarIcon } from "@/core/components/icons/Icons";
import { novelParts } from "@/core/lib/prices";
import { starsOf } from "@/core/pages/Prices/reviews/reviewText";
import { useColors } from "@/lib/colors";
import SeriesCover from "../SeriesCover";

type SeriesCardData = {
  name: string;
  coverUrl: string | null;
  thumbUrl?: string | null;
  year?: number | null;
  volumes?: number | null;
  englishVolumes?: number | null;
  score?: number | null;
  genre?: string;
  lightNovel?: boolean;
};

const vols = (count: number) => `${count} vol${count === 1 ? "" : "s"}`;
// one count under the cover: the English volumes, and nothing when that
// isn't known (never the Japanese count)
function volumesText(series: SeriesCardData) {
  const english = series.englishVolumes;
  return english ? vols(english) : null;
}

export function SeriesScoreBadge({ percent }: { percent?: number | null }) {
  const c = useColors();
  if (!percent) return null;
  return (
    <View
      // the top corner, inside the cover: a light novel's band runs across
      // its foot, and a row that scrolls sideways cuts off anything that
      // hangs outside
      className="absolute top-1 right-1 flex-row items-center gap-0.5 rounded-[2px] border border-line bg-paper px-1"
      style={{ zIndex: 2 }}
      accessibilityLabel={`Rated ${starsOf(percent)} out of 5`}
    >
      <StarIcon filled color={c.star} width={11} height={11} />
      <Text className="font-mono-medium text-[11px] text-ink">
        {starsOf(percent)}
      </Text>
    </View>
  );
}

// memo'd: a grid that only changes its order (All series' sort) redraws no
// card whose series is the same object as before
export default memo(function SeriesCard({
  series,
  width = 110,
  params,
  onPress,
}: {
  series: SeriesCardData;
  width?: number;
  params?: Record<string, string>;
  // somewhere else than the series' price page (After the anime's shows)
  onPress?: () => void;
}) {
  const shown = novelParts(series.name);
  const volumes = volumesText(series);
  return (
    <PressScale
      onPress={
        onPress ??
        (() =>
          router.push({
            pathname: "/prices/series",
            params: { name: series.name, ...params },
          }))
      }
      style={{ width }}
      className="gap-1.5"
    >
      <View>
        <SeriesCover
          name={series.name}
          lightNovel={series.lightNovel ?? shown.lightNovel}
          url={series.thumbUrl ?? series.coverUrl}
          width={width}
        />
        <SeriesScoreBadge percent={series.score} />
      </View>
      <Text
        numberOfLines={2}
        className="font-body-semibold text-[13.5px] leading-[17px] text-ink"
      >
        {shown.title}
      </Text>
      {/* under the name, only how many volumes (a novel says so on its
          cover's band) */}
      {volumes ? (
        <Text numberOfLines={2} className="font-mono text-[11px] text-muted">
          {volumes}
        </Text>
      ) : null}
    </PressScale>
  );
});
