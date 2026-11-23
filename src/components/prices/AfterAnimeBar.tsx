// "Watched the anime?" on a series' price page (the web's AfterAnimeBar):
// the way to which chapter and volume to start from
import { useCorners } from "@/lib/mangaThemes";
import Tap from "@/components/Tap";
import { Text, View } from "react-native";
import { afterAnimeCanonicalPath } from "@/core/lib/afterAnime";
import { openWebPath } from "@/lib/webRoutes";

export default function AfterAnimeBar({ seriesName }: { seriesName: string }) {
  const corners = useCorners();
  return (
    <View
      className="flex-row items-center gap-3 rounded-[14px] border border-dashed border-line-soft px-3 py-2.5"
      style={corners.panel}
    >
      <View className="min-w-0 flex-1">
        <Text className="font-body-semibold text-[15px] text-ink">
          Watched the anime?
        </Text>
        <Text className="font-body text-[13.5px] text-ink-soft">
          See which chapter and volume of the manga to start from.
        </Text>
      </View>
      <Tap
        onPress={() => openWebPath(afterAnimeCanonicalPath(seriesName))}
        hitSlop={6}
      >
        <Text className="font-body-semibold text-[14px] text-accent border-b pb-[2px] border-accent self-start">
          Find where to start
        </Text>
      </Tap>
    </View>
  );
}
