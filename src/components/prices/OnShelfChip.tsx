// "On your shelf", small, right under a cover on the price pages: the series
// is theirs already, and a tap opens it. Nothing when it isn't
import { router } from "expo-router";
import { Pressable, Text } from "react-native";
import { novelParts } from "@/core/lib/prices";
import { titleKey as sameName } from "@/core/lib/titleKey";
import { useShelf } from "@/store/shelf";

export default function OnShelfChip({
  name,
  altNames = [],
}: {
  name: string;
  altNames?: string[];
}) {
  const shelf = useShelf((s) => s.manga);
  const novel = novelParts(name);
  const names = [name, ...altNames].map((n) => sameName(novelParts(n).title));
  const onShelf = shelf?.find(
    (m) =>
      Boolean(m.lightNovel) === novel.lightNovel &&
      names.includes(sameName(m.name)),
  );
  if (!onShelf) return null;
  return (
    <Pressable
      onPress={() =>
        router.push({
          pathname: "/details/[id]",
          params: { id: String(onShelf.id) },
        })
      }
      hitSlop={8}
      accessibilityRole="link"
      className="mt-2 self-center rounded-full border border-ok/40 bg-ok/10 px-2 py-0.5 active:opacity-70"
    >
      <Text className="font-body-medium text-[11px] text-ok">
        {onShelf.planned ? "On to-read" : "On your shelf"}
      </Text>
    </Pressable>
  );
}
