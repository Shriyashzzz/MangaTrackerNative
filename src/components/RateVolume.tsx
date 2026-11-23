// Rating a volume from a series' page, for the next buyer to see on that
// volume's price page. As the web's pages/Details/RateVolume.tsx, the page
// asks one of two ways (core useRateVolume decides which):
//   RateVolumeCard   "How was vol. 9?" in a banner, for a few days after
//                    they finish a volume. Its cross closes it until they
//                    finish another
//   RateVolume       any other time: a ticket beside the series' rating,
//                    the volume's number on an inked stub and smaller
//                    stars. About the last volume they've read, until it's
//                    rated; its cross hides it until they read on
import { useCorners } from "@/lib/mangaThemes";
import Tap from "@/components/Tap";
import { Text, View } from "react-native";
import { InkCrossIcon } from "@/core/components/icons/Icons";
import type { ShelfVolume } from "@/core/lib/reviews";
import type { VolumeRating } from "@/core/pages/Details/useRateVolume";
import { useColors } from "@/lib/colors";
import StarRating from "./StarRating";

type Props = { volume: VolumeRating; onWrite: (volume: ShelfVolume) => void };

// under a volume's stars once it's rated: words go with a rating
function WaysOn({ volume, onWrite }: Props) {
  const { asked, rating, hasWords } = volume;
  if (!asked || rating === 0) return null;
  return (
    <Tap onPress={() => onWrite(asked)} hitSlop={6}>
      <Text className="font-body-medium text-[13.5px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
        {hasWords ? "Edit your review" : "Add a few words"}
      </Text>
    </Tap>
  );
}

export default function RateVolume({ volume, onWrite }: Props) {
  const c = useColors();
  const { asked, rating, problem, rate, showTicket, hideTicket } = volume;
  if (!asked || !showTicket) return null;
  return (
    <View
      className="flex-row items-stretch border-[1.5px] border-dashed border-line bg-card"
      accessibilityLabel={
        rating
          ? `Your rating of vol. ${asked.volume}`
          : `Rate vol. ${asked.volume}`
      }
    >
      <View className="min-w-[54px] items-center justify-center bg-ink px-2.5 pt-1 pb-0.5">
        <Text className="font-mono text-[10px] tracking-[1px] text-paper uppercase">
          Vol.
        </Text>
        <Text className="font-brand pr-[6px] text-[24px] leading-[26px] text-paper">
          {asked.volume}
          {"\u00A0"}
        </Text>
      </View>
      <View className="min-w-0 flex-1 gap-1.5 py-2 pr-9 pl-3">
        <View className="min-h-[18px] flex-row items-center">
          {!rating ? (
            <Text className="font-body text-[13.5px] text-ink-soft">
              How was vol. {asked.volume}?
            </Text>
          ) : (
            <WaysOn volume={volume} onWrite={onWrite} />
          )}
        </View>
        <StarRating
          value={rating}
          size="md"
          onChange={(stars) => void rate(stars)}
        />
        {problem ? (
          <Text className="font-body-medium text-[13px] text-accent">
            {problem}
          </Text>
        ) : null}
      </View>
      <Tap
        feel="round"
        onPress={hideTicket}
        hitSlop={12}
        accessibilityLabel={`Don't ask about vol. ${asked.volume}`}
        className="absolute top-2 right-2.5"
      >
        <InkCrossIcon color={c.inkSoft} width={14} height={14} />
      </Tap>
    </View>
  );
}

export function RateVolumeCard({ volume, onWrite }: Props) {
  const corners = useCorners();
  const c = useColors();
  const { asked, rating, problem, rate, closeBanner } = volume;
  if (!asked) return null;
  return (
    <View
      className="gap-3 rounded-[14px] border border-line-soft bg-card px-4 py-3 pr-10"
      style={corners.panel}
    >
      <View className="gap-1">
        <Text className="font-display text-[20px] text-ink">
          {rating
            ? `Your rating of vol. ${asked.volume}`
            : `How was vol. ${asked.volume}?`}
        </Text>
        {rating ? (
          <WaysOn volume={volume} onWrite={onWrite} />
        ) : (
          <Text className="font-body text-[14px] text-ink-soft">
            Your rating helps the next reader decide.
          </Text>
        )}
        {problem ? (
          <Text className="font-body-medium text-[13px] text-accent">
            {problem}
          </Text>
        ) : null}
      </View>
      <StarRating
        value={rating}
        size="lg"
        onChange={(stars) => void rate(stars)}
      />
      <Tap
        feel="round"
        onPress={() => void closeBanner()}
        hitSlop={12}
        accessibilityLabel="Hide this"
        className="absolute top-3 right-3"
      >
        <InkCrossIcon color={c.inkSoft} width={16} height={16} />
      </Tap>
    </View>
  );
}
