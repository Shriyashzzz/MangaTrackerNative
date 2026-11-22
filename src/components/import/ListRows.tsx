// A list import's series, before they go on the shelf (MyAnimeList, AniList
// or Kitsu): each one named, with a tick to leave it out and Edit to say
// which series it really is, for a name their list spells another way.
// Folded by default: a list of hundreds is a long page, and most people
// only want to check it
import { useState } from "react";
import { Text, View } from "react-native";
import { useCoverSearch } from "@/core/components/coverPicker/useCoverSearch";
import { MAL_LISTS, type MalItem } from "@/core/lib/imports/malImport";
import Button from "../Button";
import { H2 } from "../Page";
import FoldRow from "../FoldRow";
import Sheet from "../Sheet";
import TitleField from "../TitleField";
import CheckRow from "./CheckRow";

// rows drawn at first, and added per "Show more": a long list stays quick
const PAGE = 40;
const MATCHES = 6;

const labelOf = (status: string) =>
  MAL_LISTS.find((l) => l.status === status)?.label ?? status;

// "ch. 150 · 14 vols": what their list says about it, only what it knows
function placeOf({ entry }: MalItem) {
  const parts = [
    entry.chapters ? `ch. ${entry.chapters}` : null,
    entry.ownedVolumes
      ? `${entry.ownedVolumes} ${entry.ownedVolumes === 1 ? "vol" : "vols"}`
      : entry.readVolumes
        ? `read vol. ${entry.readVolumes}`
        : null,
  ].filter(Boolean);
  return parts.join(" · ");
}

export default function ListRows({
  items,
  unticked,
  left,
  disabled,
  onToggleOne,
  onRename,
}: {
  items: MalItem[];
  // the sub-lists (by status) that aren't being added: their series aren't
  // listed
  unticked: Set<string>;
  // single series left out, by their place in the list
  left: Set<number>;
  disabled: boolean;
  onToggleOne: (at: number) => void;
  onRename: (at: number, name: string, cover?: string) => void;
}) {
  const [shown, setShown] = useState(PAGE);
  const [editing, setEditing] = useState<number | null>(null);
  const [typed, setTyped] = useState("");
  const search = useCoverSearch(editing === null ? "" : typed, {
    perPage: MATCHES,
  });

  // each with its place in the whole list, which is what the ticks go by
  const rows = items
    .map((item, at) => ({ item, at }))
    .filter(({ item }) => !unticked.has(item.status));
  const edited = editing === null ? null : items[editing];
  const close = () => setEditing(null);

  return (
    <>
      <FoldRow title="Check the list" count={rows.length}>
        <View>
          <Text className="pb-1 font-body text-[13.5px] text-ink-soft">
            Untick one to leave it out. Edit fixes a name AniList won't know.
          </Text>
          {rows.slice(0, shown).map(({ item, at }) => (
            <View
              key={at}
              className="flex-row items-center gap-2 border-b border-line-soft"
            >
              <View className="min-w-0 flex-1">
                <CheckRow
                  checked={!left.has(at)}
                  disabled={disabled}
                  onToggle={() => onToggleOne(at)}
                  label={item.entry.title}
                >
                  <View className="min-w-0">
                    <Text
                      numberOfLines={2}
                      className="font-body-semibold text-[15px] text-ink"
                    >
                      {item.entry.title}
                    </Text>
                    <Text className="font-mono text-[12.5px] text-muted">
                      {[labelOf(item.status), placeOf(item)]
                        .filter(Boolean)
                        .join(" · ")}
                    </Text>
                  </View>
                </CheckRow>
              </View>
              <Button
                small
                label="Edit"
                disabled={disabled}
                onPress={() => {
                  setTyped(item.entry.title);
                  setEditing(at);
                }}
              />
            </View>
          ))}
          {rows.length > shown ? (
            <View className="pt-3">
              <Button
                small
                label={`Show ${Math.min(PAGE, rows.length - shown)} more`}
                onPress={() => setShown(shown + PAGE)}
              />
            </View>
          ) : null}
        </View>
      </FoldRow>

      <Sheet open={editing !== null} onClose={close} maxHeight={0.9}>
        {edited ? (
          <View className="gap-3 pb-4">
            <H2>Which series is it?</H2>
            <Text className="font-body text-[14px] text-ink-soft">
              Your list calls it{" "}
              <Text className="font-body-semibold text-ink">
                {edited.entry.otherNames?.at(-1) ?? edited.entry.title}
              </Text>
              . Search AniList and pick the right one.
            </Text>
            <TitleField
              value={typed}
              onChange={setTyped}
              hits={search.query === typed.trim() ? search.hits : []}
              guessed={search.guessed}
              status={search.status}
              focusFirst={false}
              onPick={(hit) => {
                onRename(editing!, hit.title, hit.cover);
                close();
              }}
              onTyped={() => {
                if (typed.trim()) onRename(editing!, typed.trim());
                close();
              }}
            />
          </View>
        ) : null}
      </Sheet>
    </>
  );
}
