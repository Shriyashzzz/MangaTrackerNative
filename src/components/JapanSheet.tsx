// What "Vol. 17 in Japan" means for one series, from the New tab's In Japan
// list: where the reader is, the newest volume in English and the newest in
// Japan, side by side, and why there's nothing to buy here. A sheet, since
// the series' own page says none of this
import { useRouter } from "expo-router";
import { Text, View } from "react-native";
import type { Manga, ReleaseStatus } from "@/core/lib/types";
import Button from "./Button";
import Sheet from "./Sheet";

const volume = (n: number | null | undefined) =>
  n == null ? null : `Volume ${n}`;

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-4 border-t border-dotted border-line-soft py-3">
      <Text className="font-body text-[15px] text-ink-soft">{label}</Text>
      <Text className="font-body-semibold text-[16px] text-ink">{value}</Text>
    </View>
  );
}

export default function JapanSheet({
  manga,
  found,
  onClose,
}: {
  // null while it's closed
  manga: Manga | null;
  found: ReleaseStatus | null | undefined;
  onClose: () => void;
}) {
  const router = useRouter();
  // what they own, or else the volume their chapter is in; a reader by the
  // chapter whose volume isn't known is told the chapter
  const yours =
    volume(found?.currentVolume) ??
    (manga?.bookmark ? `Chapter ${manga.bookmark}` : "Not started");
  const open = () => {
    if (!manga) return;
    onClose();
    router.push(`/details/${manga.id}`);
  };
  return (
    <Sheet open={manga !== null} onClose={onClose} contentClassName="px-5 pb-8">
      <Text
        numberOfLines={2}
        className="pb-3 font-display text-[20px] text-ink"
      >
        {manga?.name}
      </Text>
      <Line label="You" value={yours} />
      <Line
        label="In English"
        value={volume(found?.latestVolume) ?? "None yet"}
      />
      <Line
        label="In Japan"
        value={volume(found?.latestJapaneseVolume) ?? "Not known"}
      />
      <Text className="border-t border-dotted border-line-soft pt-3 pb-5 font-body text-[14px] leading-[20px] text-ink-soft">
        Japan is ahead, so more English volumes are on the way. We only track
        Japanese release dates. We don't work with Japanese stores, so there are
        no prices for these.
      </Text>
      <Button label="Open the series" kind="primary" onPress={open} />
    </Sheet>
  );
}
