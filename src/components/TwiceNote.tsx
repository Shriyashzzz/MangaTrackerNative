// The same series on the shelf twice: said on its page, with one button
// that makes them one (the web's pages/Details/TwiceNote.tsx). The server
// keeps everything either had (POST /api/manga/:id/merge)
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { apiFetch } from "@/core/lib/api";
import { titleKey } from "@/core/lib/titleKey";
import type { Manga } from "@/core/lib/types";
import { useShelf } from "@/store/shelf";

export default function TwiceNote({
  manga,
  onMerged,
}: {
  manga: Manga;
  onMerged: () => void;
}) {
  const shelf = useShelf((s) => s.manga);
  const [merging, setMerging] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!shelf) void useShelf.getState().load();
  }, [shelf]);
  const other = shelf?.find(
    (m) =>
      m.id !== manga.id &&
      Boolean(m.lightNovel) === Boolean(manga.lightNovel) &&
      titleKey(m.name) === titleKey(manga.name),
  );
  if (!other) return null;

  const merge = async () => {
    setMerging(true);
    setFailed(false);
    try {
      const res = await apiFetch(`/api/manga/${manga.id}/merge`, {
        method: "POST",
        body: { otherId: other.id },
      });
      if (!res.ok) throw new Error(`merge ${res.status}`);
      await useShelf.getState().load();
      onMerged();
    } catch {
      setFailed(true);
    } finally {
      setMerging(false);
    }
  };

  return (
    <View className="gap-1 rounded-[6px] border-2 border-line bg-accent-wash px-3 py-2">
      <View className="flex-row flex-wrap items-baseline gap-x-3">
        <Text className="font-body text-[14.5px] text-ink">
          This series is on your shelf twice.
        </Text>
        <Pressable onPress={() => void merge()} disabled={merging} hitSlop={6}>
          <Text className="font-body-semibold text-[14.5px] text-accent underline">
            {merging ? "Merging…" : "Merge them"}
          </Text>
        </Pressable>
      </View>
      <Text className="font-body text-[13px] text-ink-soft">
        Every volume, the further chapter, notes and rating are kept.
      </Text>
      {failed ? (
        <Text className="font-body text-[13px] text-accent">
          That didn't work. Try again.
        </Text>
      ) : null}
    </View>
  );
}
