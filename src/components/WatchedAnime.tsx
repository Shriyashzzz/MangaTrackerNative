// "Watched the anime? Tap your last season": on the add form, a season fills
// in where they're up to (the web's pages/AfterAnime/WatchedAnime.tsx; the
// answer and the arithmetic are the web's, core afterAnime)
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getAfterAnime, type AfterAnime } from "@/core/lib/afterAnime";
import { placeAfter, type AnimeStop } from "@/core/lib/afterAnimeText";

export default function WatchedAnime({
  seriesName,
  onPick,
}: {
  seriesName: string;
  onPick: (place: { chapter: number | null; volume: number | null }) => void;
}) {
  const [found, setFound] = useState<{
    asked: string;
    show: AfterAnime;
  } | null>(null);
  const [picked, setPicked] = useState<{ asked: string; label: string } | null>(
    null,
  );
  useEffect(() => {
    const controller = new AbortController();
    getAfterAnime(seriesName, controller.signal)
      .then((show) => setFound({ asked: seriesName, show }))
      .catch(() => {
        // no anime we know of: nothing to offer
      });
    return () => controller.abort();
  }, [seriesName]);

  const show = found?.asked === seriesName ? found.show : null;
  const seasons = (show?.stops ?? []).filter((stop) => !stop.coversAll);
  if (!seasons.length) return null;

  const pick = (stop: AnimeStop) => {
    setPicked({ asked: seriesName, label: stop.label });
    onPick(placeAfter(stop));
  };
  return (
    <View className="gap-2" accessibilityLabel="Watched the anime?">
      <Text className="font-body text-[14.5px] text-ink-soft">
        Watched the anime? Tap your last season:
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {seasons.map((stop) => {
          const on =
            picked?.asked === seriesName && picked.label === stop.label;
          return (
            <Pressable
              key={stop.label}
              onPress={() => pick(stop)}
              accessibilityState={{ selected: on }}
              className={`rounded-[3px] border-[1.5px] px-2.5 py-1.5 ${on ? "border-accent bg-accent-wash" : "border-line"}`}
            >
              <Text
                className={`font-body-medium text-[14px] ${on ? "text-accent-ink" : "text-ink"}`}
              >
                {stop.label === "The anime" ? "Yes, all of it" : stop.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
