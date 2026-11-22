// "+ Add to my to-read" on a series' price page (the web's components/
// toRead/ToReadButton.tsx): the series onto the shelf's To read list, or
// the way to it when it's there already
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { pickGenre } from "@/core/lib/anilist";
import { apiFetch } from "@/core/lib/api";
import { novelParts } from "@/core/lib/prices";
import { titleKey as sameName } from "@/core/lib/titleKey";
import { useShelf } from "@/store/shelf";
import Button from "../Button";

export default function ToReadButton({
  name,
  altNames = [],
  cover,
  genres = [],
}: {
  name: string;
  altNames?: string[];
  cover: string | null;
  genres?: string[];
}) {
  const shelf = useShelf((s) => s.manga);
  const loadShelf = useShelf((s) => s.load);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (!shelf) void loadShelf();
  }, [shelf, loadShelf]);
  const novel = novelParts(name);
  const names = [name, ...altNames].map((n) => sameName(novelParts(n).title));
  const onShelf = shelf?.find(
    (m) =>
      Boolean(m.lightNovel) === novel.lightNovel &&
      names.includes(sameName(m.name)),
  );
  if (onShelf)
    return (
      <Pressable
        onPress={() =>
          router.push({
            pathname: "/details/[id]",
            params: { id: String(onShelf.id) },
          })
        }
        hitSlop={6}
        accessibilityRole="link"
        className="flex-row items-center gap-1.5 self-start rounded-full border border-ok bg-ok/15 px-3 py-1.5 active:opacity-70"
      >
        <Text className="font-body-semibold text-[14px] text-ok">
          {onShelf.planned ? "On your to-read list" : "On your shelf"}
        </Text>
      </Pressable>
    );
  const add = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiFetch("/api/manga", {
        method: "POST",
        body: {
          name: novel.title.slice(0, 150),
          status: false,
          planned: true,
          ...(novel.lightNovel ? { lightNovel: true } : {}),
          ...(cover ? { image: cover } : {}),
          ...(pickGenre(genres) ? { genre: pickGenre(genres) } : {}),
        },
      });
      if (!res.ok && res.status !== 409)
        throw new Error(`Add failed ${res.status}`);
      await loadShelf();
    } catch {
      setError("That didn't save. Try again.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <View className="gap-2">
      <Button
        wide
        label={saving ? "Adding…" : "+ Add to my to-read"}
        small
        disabled={saving || !shelf}
        onPress={() => void add()}
      />
      {error ? (
        <Text className="font-body text-[13.5px] text-accent">{error}</Text>
      ) : null}
    </View>
  );
}
