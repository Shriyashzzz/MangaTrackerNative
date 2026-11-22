// A few other shows with an answer (the web's MoreShows.tsx), under a show's
// page
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import SeriesCard from "@/components/prices/SeriesCard";
import {
  afterAnimeCanonicalPath,
  getAfterAnimeIndex,
  type AfterAnimeShow,
} from "@/core/lib/afterAnime";
import { hrefOf } from "@/lib/webRoutes";

const SHOWN = 6;

export const openShow = (name: string) => {
  const href = hrefOf(afterAnimeCanonicalPath(name));
  if (href) router.push(href);
};

export default function MoreShows({ notThis }: { notThis: string }) {
  const [shows, setShows] = useState<AfterAnimeShow[]>([]);
  useEffect(() => {
    const controller = new AbortController();
    getAfterAnimeIndex(controller.signal)
      .then(setShows)
      .catch(() => {
        // the page stands without them
      });
    return () => controller.abort();
  }, []);

  const others = shows.filter((show) => show.slug !== notThis).slice(0, SHOWN);
  if (!others.length) return null;
  return (
    <View className="gap-3">
      <Text className="font-brand pr-[5px] text-[20px] tracking-[1px] text-ink uppercase">
        More shows
        {"\u00A0"}
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {others.map((show) => (
          <SeriesCard
            key={show.slug}
            series={{ name: show.name, coverUrl: show.coverUrl }}
            width={100}
            onPress={() => openShow(show.name)}
          />
        ))}
      </ScrollView>
    </View>
  );
}
