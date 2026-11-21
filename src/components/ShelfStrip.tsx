// A series' strip of books with the line under it (where they are, or how to
// use it) and a word when a change didn't save. Takes a useSeriesShelf, so
// the series page and the Volumes tab draw the same shelf
import { Text, View } from "react-native";
import type { SeriesShelf } from "@/lib/useSeriesShelf";
import VolumeStrip from "./VolumeStrip";

export default function ShelfStrip({ shelf }: { shelf: SeriesShelf }) {
  return (
    <View className="gap-2">
      <VolumeStrip {...shelf.strip} />
      <Text className="text-center font-mono text-[12.5px] text-muted">
        {shelf.placeText}
      </Text>
      {shelf.saveFailed ? (
        <Text className="text-center font-body-medium text-[14px] text-accent">
          That didn't save. Try again.
        </Text>
      ) : null}
    </View>
  );
}
