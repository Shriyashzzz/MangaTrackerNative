// A series as a card on the price pages (the web's pages/Prices/
// SeriesCard.tsx): its cover with its score as stars, the name, and a line
// of what it is
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
function volumesText(series: SeriesCardData, lightNovel: boolean) {
  const { volumes: japan, englishVolumes: english } = series;
  if (lightNovel) return japan ? vols(japan) : null;
  if (!english) return japan ? `${vols(japan)} in Japan` : null;
  if (!japan || english === japan) return vols(english);
  return `${english} in English · ${japan} in Japan`;
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

export default function SeriesCard({
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
      <Text numberOfLines={2} className="font-mono text-[11px] text-muted">
        {[
          shown.lightNovel && "Light novel",
          series.year,
          volumesText(series, shown.lightNovel),
          series.genre,
        ]
          .filter(Boolean)
          .join(" · ")}
      </Text>
    </PressScale>
  );
}
