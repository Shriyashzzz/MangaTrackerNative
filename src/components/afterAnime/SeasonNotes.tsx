// What else a season's answer carries (the web's SeasonNotes.tsx): what its
// source says is worth knowing ("Skips Chap 80-81"), and that a reader
// corrected it
import { Text, View } from "react-native";
import type { AnimeStop } from "@/core/lib/afterAnimeText";

export default function SeasonNotes({ stop }: { stop: AnimeStop }) {
  if (!stop.note && !stop.corrected) return null;
  return (
    <View className="gap-1">
      {stop.note ? (
        <Text className="font-body text-[14px] leading-[20px] text-ink-soft">
          Worth knowing: {stop.note}
        </Text>
      ) : null}
      {stop.corrected ? (
        <Text className="self-start rounded-[3px] border border-line-soft px-1.5 py-[1px] font-mono text-[11px] tracking-[0.5px] text-muted uppercase">
          Corrected by a reader
        </Text>
      ) : null}
    </View>
  );
}
