// One earlier season's answer (the web's SeasonPanel.tsx): the season, where
// to start after it, its notes, what to buy, and the way to suggest a fix
import { Text, View } from "react-native";
import type { VolumeOffers } from "@/core/lib/afterAnime";
import {
  afterLabel,
  keepNumbers,
  startText,
  type AnimeStop,
} from "@/core/lib/afterAnimeText";
import type { SeriesVolume } from "@/core/lib/types";
import AnswerWords from "./AnswerWords";
import FixForm from "./FixForm";
import SeasonBuy from "./SeasonBuy";
import SeasonNotes from "./SeasonNotes";

export default function SeasonPanel({
  stop,
  seriesName,
  volumes,
  offers,
  seriesCoverUrl,
}: {
  stop: AnimeStop;
  seriesName: string;
  volumes: SeriesVolume[] | null;
  offers: Record<string, VolumeOffers>;
  seriesCoverUrl: string | null;
}) {
  return (
    <View className="gap-3 border-t border-line-soft pt-4">
      {/* one heading, on two lines: the season, then the answer */}
      <View className="gap-1">
        <Text className="font-mono text-[12px] tracking-[1px] text-muted uppercase">
          {keepNumbers(afterLabel(stop))}
        </Text>
        <Text className="font-display text-[19px] leading-[26px] text-ink">
          <AnswerWords text={keepNumbers(startText(stop))} />
        </Text>
        <SeasonNotes stop={stop} />
      </View>
      <SeasonBuy
        stop={stop}
        seriesName={seriesName}
        volumes={volumes}
        offers={offers}
        seriesCoverUrl={seriesCoverUrl}
      />
      <FixForm seriesName={seriesName} season={stop.label} />
    </View>
  );
}
