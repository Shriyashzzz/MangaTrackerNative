// The add page's title box with AniList's matches under it (the web's
// pages/AddManga/TitleField.tsx): a list of covers and names to pick from,
// "Did you mean" for a typo, and "Add as typed" to keep their own words
import TextBox from "@/components/TextBox";
import Tap from "@/components/Tap";
import { Image } from "expo-image";
import { ScrollView, Text, View } from "react-native";
import { SearchIcon } from "@/core/components/icons/Icons";
import type { CoverHit } from "@/core/lib/anilist";
import { DID_YOU_MEAN } from "@/core/lib/nearMatches";
import {
  MIN_QUERY,
  type SearchStatus,
} from "@/core/components/coverPicker/useCoverSearch";
import { useColors } from "@/lib/colors";

const NO_HITS_NOTE: Partial<Record<string, string>> = {
  error: "Couldn't search right now. Try again in a moment.",
  done: "No manga by that name. Check the spelling.",
};

export default function TitleField({
  value,
  error,
  onChange,
  hits,
  guessed = false,
  status,
  onPick,
  onTyped,
  focusFirst = true,
}: {
  value: string;
  error?: string;
  onChange: (title: string) => void;
  hits: CoverHit[];
  guessed?: boolean;
  status: SearchStatus;
  onPick: (hit: CoverHit) => void;
  onTyped: () => void;
  // false where the name is filled in already and the matches should show
  // without the keyboard over them (an import's Edit)
  focusFirst?: boolean;
}) {
  const c = useColors();
  const typed = value.trim();
  const showing = typed.length >= MIN_QUERY;
  return (
    <View className="gap-2">
      <View
        className={`flex-row items-center gap-2 rounded-[2px] border-[1.5px] bg-paper px-3 ${error ? "border-accent" : "border-line-soft"}`}
      >
        <SearchIcon color={c.inkSoft} width={18} height={18} />
        <TextBox
          value={value}
          onChangeText={onChange}
          onSubmitEditing={() => typed && onTyped()}
          placeholder="Search a title, e.g. Berserk"
          placeholderTextColor={c.muted}
          maxLength={150}
          autoCorrect={false}
          autoFocus={focusFirst}
          returnKeyType="next"
          className="min-h-[46px] flex-1 font-body text-[16px] text-ink"
        />
      </View>
      {showing ? (
        <View className="rounded-[4px] border-[1.5px] border-line bg-card">
          <ScrollView
            className="max-h-[320px]"
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
          >
            {hits.map((hit) => (
              <Tap
                key={hit.id}
                onPress={() => onPick(hit)}
                className="flex-row items-center gap-3 border-b border-line-soft px-3 py-2 active:bg-accent-wash"
              >
                <Image
                  source={{ uri: hit.cover }}
                  style={{ width: 32, height: 48, borderRadius: 2 }}
                  contentFit="cover"
                />
                <View className="min-w-0 flex-1">
                  <Text
                    numberOfLines={1}
                    className="font-body-medium text-[15px] text-ink"
                  >
                    {hit.title}
                  </Text>
                  {hit.year || hit.lightNovel ? (
                    <Text className="font-mono text-[12px] text-muted">
                      {hit.year ?? ""}
                      {hit.lightNovel ? `${hit.year ? " · " : ""}novel` : ""}
                    </Text>
                  ) : null}
                </View>
              </Tap>
            ))}
            {!hits.length ? (
              <Text className="px-3 py-3 font-body text-[14px] text-ink-soft">
                {NO_HITS_NOTE[status] ?? "Looking it up…"}
              </Text>
            ) : null}
          </ScrollView>
          <View className="flex-row items-center justify-between gap-3 border-t border-line-soft px-3 py-2">
            <Text className="font-mono text-[12px] text-muted">
              {hits.length > 0
                ? guessed
                  ? DID_YOU_MEAN
                  : `${hits.length} from AniList`
                : ""}
            </Text>
            <Tap onPress={onTyped} hitSlop={6}>
              <Text className="font-body-semibold text-[14px] text-ink border-b pb-[2px] border-ink self-start">
                Add “{typed}” as typed
              </Text>
            </Tap>
          </View>
        </View>
      ) : null}
    </View>
  );
}
