// What AniList says of a series (the web's SeriesFacts): its rating, how
// popular, how many volumes in Japan, its genres and blurb, folded past a
// few lines
import Tap from "@/components/Tap";
import { openOutside } from "@/lib/openOutside";
import { useState } from "react";
import { Text, View } from "react-native";
import { comicKind, novelParts, originPlace } from "@/core/lib/prices";
import type { SeriesInfo } from "@/core/lib/types";
import { starsOf } from "@/core/pages/Prices/reviews/reviewText";

// what the series is about, three lines until they ask for the rest. On its
// own so a page can run it full width under the cover
export function SeriesDescription({ info }: { info: SeriesInfo }) {
  const [expanded, setExpanded] = useState(false);
  const long = (info.description?.length ?? 0) > 320;
  if (!info.description) return null;
  // folded, it runs on as one paragraph: a blank line in the middle would
  // leave the third line empty beside Read more
  const folded = info.description.replace(/\s+/g, " ").trim();
  return (
    <View>
      <Text
        numberOfLines={expanded ? undefined : 3}
        className="font-body text-[14px] leading-[21px] text-ink"
      >
        {expanded ? info.description : folded}
      </Text>
      {/* folded: Read more sits at the end of the third line itself, on a
          patch of the page's colour over the cut-off words */}
      {long && !expanded ? (
        <Tap
          onPress={() => setExpanded(true)}
          hitSlop={8}
          className="absolute right-0 bottom-0 flex-row bg-paper pl-1"
        >
          <Text className="font-body text-[14px] leading-[21px] text-ink">
            …{" "}
          </Text>
          <Text className="font-body-semibold text-[14px] leading-[21px] text-ink">
            Read more
          </Text>
        </Tap>
      ) : null}
      {long && expanded ? (
        <Tap onPress={() => setExpanded(false)} hitSlop={6}>
          <Text className="self-start border-b border-ink pb-[2px] font-body-medium text-[13.5px] text-ink">
            Show less
          </Text>
        </Tap>
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
  const novel = novelParts(info.name).lightNovel;
  // a Korean comic is a manhwa, a Chinese one a manhua: said with the
  // genres, as one more fact about it. A novel is a novel wherever it's from
  const kind = novel ? null : comicKind(info.origin);
  const chips = [...(kind ? [kind] : []), ...info.genres];
  const facts = [
    info.score != null ? `Rated ★ ${starsOf(info.score)}` : null,
    info.popularityRank != null
      ? `#${info.popularityRank} most popular on AniList`
      : null,
    info.volumes != null
      ? `${info.volumes} volumes${novel ? "" : ` in ${originPlace(info.origin)}`}${info.status === "FINISHED" ? ", finished" : ""}`
      : null,
  ].filter(Boolean);
  return (
    <View className="gap-2">
      <Text className="font-body text-[13.5px] text-ink-soft">
        {facts.join(" · ")}
        {info.siteUrl ? (
          <Text
            className="font-body-medium text-ink underline"
            onPress={() => openOutside(info.siteUrl)}
          >
            {facts.length ? " · " : ""}AniList
          </Text>
        ) : null}
      </Text>
      {chips.length ? (
        <View className="flex-row flex-wrap gap-1.5">
          {chips.map((g) => (
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
