// What AniList says of a series (the web's SeriesFacts): its rating, how
// popular, how many volumes in Japan, its genres and blurb, folded past a
// few lines
import { useState } from "react";
import { Linking, Pressable, Text, View } from "react-native";
import { novelParts } from "@/core/lib/prices";
import type { SeriesInfo } from "@/core/lib/types";
import { starsOf } from "@/core/pages/Prices/reviews/reviewText";

// what the series is about, three lines until they ask for the rest. On its
// own so a page can run it full width under the cover
export function SeriesDescription({ info }: { info: SeriesInfo }) {
  const [expanded, setExpanded] = useState(false);
  const long = (info.description?.length ?? 0) > 320;
  if (!info.description) return null;
  return (
    <View>
      <Text
        numberOfLines={expanded ? undefined : 3}
        className="font-body text-[14px] leading-[21px] text-ink"
      >
        {info.description}
      </Text>
      {long ? (
        <Pressable onPress={() => setExpanded(!expanded)} hitSlop={6}>
          <Text className="self-start border-b border-ink pb-[2px] font-body-medium text-[13.5px] text-ink">
            {expanded ? "Show less" : "Read more"}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export default function SeriesFacts({
  info,
  withDescription = true,
}: {
  info: SeriesInfo;
  // false where the page draws SeriesDescription itself
  withDescription?: boolean;
}) {
  const facts = [
    info.score != null ? `Rated ★ ${starsOf(info.score)}` : null,
    info.popularityRank != null
      ? `#${info.popularityRank} most popular on AniList`
      : null,
    info.volumes != null
      ? `${info.volumes} volumes${novelParts(info.name).lightNovel ? "" : " in Japan"}${info.status === "FINISHED" ? ", finished" : ""}`
      : null,
  ].filter(Boolean);
  return (
    <View className="gap-2">
      <Text className="font-body text-[13.5px] text-ink-soft">
        {facts.join(" · ")}
        {info.siteUrl ? (
          <Text
            className="font-body-medium text-ink underline"
            onPress={() => void Linking.openURL(info.siteUrl)}
          >
            {facts.length ? " · " : ""}AniList
          </Text>
        ) : null}
      </Text>
      {info.genres.length ? (
        <View className="flex-row flex-wrap gap-1.5">
          {info.genres.map((g) => (
            <Text
              key={g}
              className="rounded-[2px] border-[1.5px] border-line-soft px-2 py-0.5 font-body-medium text-[12px] text-ink-soft"
            >
              {g}
            </Text>
          ))}
        </View>
      ) : null}
      {withDescription ? <SeriesDescription info={info} /> : null}
    </View>
  );
}
