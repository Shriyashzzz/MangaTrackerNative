// "Watched the anime?" on a series' price page (the web's AfterAnimeBar):
// the way to which chapter and volume to start from
import { Pressable, Text, View } from "react-native";
import { afterAnimeCanonicalPath } from "@/core/lib/afterAnime";
import { openWebPath } from "@/lib/webRoutes";

export default function AfterAnimeBar({ seriesName }: { seriesName: string }) {
  return (
    <View className="flex-row items-center gap-3 rounded-[4px] border-[1.5px] border-dashed border-line px-3 py-2.5">
      <View className="min-w-0 flex-1">
        <Text className="font-body-semibold text-[15px] text-ink">
          Watched the anime?
        </Text>
        <Text className="font-body text-[13.5px] text-ink-soft">
          See which chapter and volume of the manga to start from.
        </Text>
      </View>
      <Pressable
        onPress={() => openWebPath(afterAnimeCanonicalPath(seriesName))}
        hitSlop={6}
      >
        <Text className="font-body-semibold text-[14px] text-accent underline">
          Find where to start
        </Text>
      </Pressable>
    </View>
  );
}
