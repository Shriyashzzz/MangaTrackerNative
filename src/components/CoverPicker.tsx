// The cover of the add and edit forms (the web's components/coverPicker/
// CoverPicker.tsx): the chosen cover, a strip to pick from (their own books'
// covers first, tagged "yours", then AniList's matches for the title), and a
// box for a pasted link
import Tap from "@/components/Tap";
import { Image } from "expo-image";
import { useRef, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { CoverHit } from "@/core/lib/anilist";
import { useCoverSearch } from "@/core/components/coverPicker/useCoverSearch";
import { isVolumeCover } from "@/core/lib/coverSizes";
import { coverSrc } from "@/core/lib/prices";
import { useColors } from "@/lib/colors";
import { Input } from "./Field";

export type OwnCover = { url: string; name: string };

// one cover to pick: a search hit, or one of their own books ("yours")
function Thumb({
  url,
  selected,
  label,
  onPress,
  yours = false,
}: {
  url: string;
  selected: boolean;
  label: string;
  onPress: () => void;
  yours?: boolean;
}) {
  const c = useColors();
  return (
    <Tap
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={{ width: 58 }}
    >
      <Image
        source={{ uri: yours ? coverSrc(url) : url }}
        style={{
          width: 58,
          aspectRatio: 2 / 3,
          borderWidth: selected ? 2.5 : 1.5,
          borderColor: selected ? c.accent : c.lineSoft,
          backgroundColor: c.paper2,
        }}
        contentFit="cover"
      />
      {yours ? (
        <View className="absolute inset-x-0 bottom-0 bg-ink py-[1px]">
          <Text className="text-center font-mono text-[9px] tracking-[0.5px] text-paper uppercase">
            yours
          </Text>
        </View>
      ) : null}
    </Tap>
  );
}

export default function CoverPicker({
  title,
  value,
  onChange,
  coverChosen = false,
  error,
  ownCovers = [],
}: {
  title: string;
  value: string;
  onChange: (url: string, match: CoverHit | null) => void;
  // don't choose a cover on their behalf: they've already picked this manga
  coverChosen?: boolean;
  error?: string;
  ownCovers?: OwnCover[];
}) {
  const c = useColors();
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  // once they pick or paste something we stop auto-choosing for them
  const touched = useRef(Boolean(value));
  const search = useCoverSearch(title, {
    onFound: (found) => {
      if (!touched.current && !coverChosen && found.length)
        onChange(found[0]!.cover, found[0]!);
    },
  });
  const broken = Boolean(value) && brokenUrl === value;
  const pick = (url: string, match: CoverHit | null = null) => {
    touched.current = true;
    onChange(url, match);
  };
  const pasted =
    Boolean(value) &&
    !search.hits.some((r) => r.cover === value) &&
    !isVolumeCover(value) &&
    !/anilist\.co|myanimelist|kitsu/i.test(value);
  const pickedOwn = ownCovers.find((o) => o.url === value);
  const hasOwn = ownCovers.length > 0;
  const hasImage = Boolean(value) && !broken;
  const note = pickedOwn
    ? `${pickedOwn.name}, your book`
    : search.status === "loading"
      ? "Looking it up…"
      : search.status === "done"
        ? search.hits.length
          ? "Matches from AniList"
          : hasOwn
            ? "From books you own"
            : "No covers found for that title"
        : search.status === "error"
          ? "Couldn't reach AniList, paste a link instead"
          : hasOwn
            ? "From books you own"
            : "";

  return (
    <View className="gap-2">
      <Text className="font-body-semibold text-[14.5px] text-ink">
        Cover{" "}
        <Text className="font-body text-[13px] text-muted">(optional)</Text>
      </Text>
      <View className="flex-row gap-3">
        <View
          style={{
            width: 96,
            aspectRatio: 2 / 3,
            borderWidth: 1.5,
            borderColor: hasImage ? c.line : c.lineSoft,
            borderStyle: hasImage ? "solid" : "dashed",
            backgroundColor: c.paper,
          }}
          className="items-center justify-center p-2"
        >
          {hasImage ? (
            <Image
              source={{ uri: coverSrc(value) }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              onError={() => setBrokenUrl(value)}
            />
          ) : (
            <Text className="text-center font-display-italic text-[12px] text-muted">
              {broken
                ? "hm, that link isn't loading as an image"
                : "type a title and a cover shows up here"}
            </Text>
          )}
        </View>
        <View className="min-w-0 flex-1 gap-2">
          <View className="flex-row items-baseline justify-between gap-2">
            <Text className="shrink font-mono text-[11.5px] text-muted">
              {note}
            </Text>
            {value ? (
              <Tap onPress={() => pick("")} hitSlop={6}>
                <Text className="font-body text-[13px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
                  No cover
                </Text>
              </Tap>
            ) : null}
          </View>
          {hasOwn || search.hits.length ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 6 }}
              style={{ opacity: search.status === "loading" ? 0.6 : 1 }}
            >
              {ownCovers.map((own) => (
                <Thumb
                  key={own.url}
                  url={own.url}
                  selected={value === own.url}
                  label={`${own.name}, your book`}
                  onPress={() => pick(value === own.url ? "" : own.url)}
                  yours
                />
              ))}
              {search.hits.map((r) => (
                <Thumb
                  key={r.cover}
                  url={r.cover}
                  selected={value === r.cover}
                  label={
                    (r.year ? `${r.title} (${r.year})` : r.title) +
                    (r.lightNovel ? ", novel" : "")
                  }
                  onPress={() => pick(value === r.cover ? "" : r.cover, r)}
                />
              ))}
            </ScrollView>
          ) : null}
          <Input
            value={pasted ? value : ""}
            onChangeText={(text) => pick(text)}
            placeholder="or paste an image link"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            invalid={Boolean(error)}
            className="min-h-[42px] text-[14px]"
          />
        </View>
      </View>
      {error ? (
        <Text className="font-body-medium text-[13.5px] text-accent">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
