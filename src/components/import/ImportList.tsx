// The series a book import found, grouped by how the matching went (the
// web's pages/Import/ImportList.tsx): Not on AniList, Couldn't check,
// Omnibus editions, Found. Each row a tick, its name and what the file says
// of it, "Did you mean", and Edit, which opens the match sheet
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Button from "@/components/Button";
import { ChevronDownIcon, InfoIcon } from "@/core/components/icons/Icons";
import { editOf, type BookSeries } from "@/core/lib/imports/bookImport";
import { shelfKey } from "@/core/lib/titleKey";
import {
  matchLine,
  omnibusNote,
  sparesNote,
} from "@/core/pages/Import/importRowText";
import { useNearNames } from "@/core/pages/Import/useNearNames";
import { useColors } from "@/lib/colors";
import { useBookImport, type Match } from "@/store/bookImport";
import { useShelf } from "@/store/shelf";
import CheckRow from "./CheckRow";
import { Note } from "./ImportParts";
import MatchModal from "./MatchModal";

const Tag = ({ children }: { children: string }) => (
  <Text className="font-mono text-[12.5px] text-muted">{children}</Text>
);

export default function ImportList({
  found,
  rows,
  matchOf,
  keptApartFrom,
  ticked,
  importing,
  lookingUp,
}: {
  found: BookSeries[] | null;
  rows: BookSeries[];
  matchOf: (s: BookSeries) => Match | undefined;
  keptApartFrom: (s: BookSeries) => string | null;
  ticked: (s: BookSeries) => boolean;
  importing: boolean;
  lookingUp: boolean;
}) {
  const c = useColors();
  const imported = useBookImport();
  const { edits } = imported;
  const [editing, setEditing] = useState<BookSeries | null>(null);
  const [searchFirst, setSearchFirst] = useState<string | null>(null);
  const openEdit = (s: BookSeries, name: string | null = null) => {
    setSearchFirst(name);
    setEditing(s);
  };
  // a known name close to one AniList didn't have
  const near = useNearNames(
    lookingUp
      ? []
      : rows
          .filter((r) => matchOf(r) === null && !editOf(r, edits))
          .map((r) => r.title),
  );
  const shelf = useShelf((st) => st.manga);
  useEffect(() => {
    if (!shelf) void useShelf.getState().load();
  }, [shelf]);
  const onShelf = useMemo(
    () =>
      new Set(
        (shelf ?? []).map((m) => shelfKey(m.name, Boolean(m.lightNovel))),
      ),
    [shelf],
  );

  const seriesRow = (s: BookSeries) => {
    const match = matchOf(s);
    const apart = keptApartFrom(s);
    const name = match && match !== "failed" ? match.name : s.title;
    const edit = editOf(s, edits);
    const edited = Boolean(edit);
    const saidNotOnAniList = edit?.match === null;
    const suggested = match === null && !edited ? near.get(s.title) : null;
    const spares = sparesNote(s);
    return (
      <View key={s.key} className="flex-row items-start gap-2">
        <View className="min-w-0 flex-1">
          <CheckRow
            checked={ticked(s)}
            disabled={importing || match === undefined}
            onToggle={() =>
              imported.chooseAll(s.members ?? [s.key], !ticked(s))
            }
            label={name}
          >
            <Text className="font-display text-[16px] text-ink">{name}</Text>
            <Text className="font-mono text-[13px] leading-[19px] text-ink-soft">
              {matchLine(s, match, apart, saidNotOnAniList)}
            </Text>
            {suggested ? (
              <Text
                onPress={importing ? undefined : () => openEdit(s, suggested)}
                className="font-body-semibold text-[14px] text-ink underline"
              >
                Did you mean {suggested}?
              </Text>
            ) : null}
            {spares ? <Tag>{spares}</Tag> : null}
            {s.omnibus && match && match !== "failed" ? (
              <Tag>{omnibusNote(s)}</Tag>
            ) : null}
            {match &&
            match !== "failed" &&
            onShelf.has(shelfKey(name, s.lightNovel)) ? (
              <Tag>Already on your shelf: new volumes are added to it</Tag>
            ) : null}
            {edited ? <Tag>Edited by you</Tag> : null}
          </CheckRow>
        </View>
        <View className="pt-1.5">
          <Button
            small
            label="Edit"
            disabled={importing || match === undefined}
            onPress={() => openEdit(s)}
          />
        </View>
      </View>
    );
  };

  const isFound = (r: BookSeries) => {
    const m = matchOf(r);
    return m != null && m !== "failed";
  };
  // one list while matching, then by how it went
  const groups = lookingUp
    ? [{ id: "all", title: null, rows }]
    : [
        {
          id: "missing",
          title: "Not on AniList",
          rows: rows.filter((r) => matchOf(r) === null),
        },
        {
          id: "unchecked",
          title: "Couldn't check AniList",
          rows: rows.filter((r) => matchOf(r) === "failed"),
        },
        {
          id: "omnibus",
          title: "Omnibus editions",
          rows: rows.filter((r) => isFound(r) && r.omnibus),
        },
        {
          id: "matched",
          title: "Found",
          rows: rows.filter((r) => isFound(r) && !r.omnibus),
        },
      ].filter((g) => g.rows.length);

  // groups they folded away, for this import's list
  const [closed, setClosed] = useState<{
    for: BookSeries[] | null;
    ids: Set<string>;
  }>({ for: null, ids: new Set() });
  const closedIds = closed.for === found ? closed.ids : new Set<string>();
  const toggleGroup = (id: string) =>
    setClosed((was) => {
      const ids = new Set(was.for === found ? was.ids : []);
      if (!ids.delete(id)) ids.add(id);
      return { for: found, ids };
    });
  // an edited row moves group: its new group opens so it can be seen
  const [followed, setFollowed] = useState<string | null>(null);
  if (followed) {
    const into = groups.find((g) =>
      g.rows.some((r) => (r.members ?? [r.key]).includes(followed)),
    );
    setFollowed(null);
    if (into && closedIds.has(into.id)) {
      const ids = new Set(closedIds);
      ids.delete(into.id);
      setClosed({ for: found, ids });
    }
  }
  const [omnibusInfo, setOmnibusInfo] = useState(false);

  return (
    <>
      <View accessibilityLabel="Series to add" className="gap-1">
        {groups.map((g) =>
          g.title ? (
            <View key={g.id} className="gap-1">
              <View className="flex-row items-center gap-2 border-t border-line-soft pt-3">
                <Pressable
                  onPress={() => toggleGroup(g.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !closedIds.has(g.id) }}
                  className="flex-1 flex-row items-center gap-2 py-1"
                >
                  <Text className="font-brand pr-[4px] text-[17px] tracking-[0.5px] text-ink uppercase">
                    {g.title}
                    {"\u00A0"}
                  </Text>
                  <Text className="font-mono text-[13px] text-muted">
                    {g.rows.length}
                  </Text>
                  <View
                    style={{
                      transform: [
                        { rotate: closedIds.has(g.id) ? "-90deg" : "0deg" },
                      ],
                    }}
                  >
                    <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
                  </View>
                </Pressable>
                {g.id === "omnibus" ? (
                  <Pressable
                    onPress={() => setOmnibusInfo(!omnibusInfo)}
                    hitSlop={8}
                    accessibilityLabel="What's an omnibus?"
                    accessibilityState={{ expanded: omnibusInfo }}
                  >
                    <InfoIcon color={c.inkSoft} width={18} height={18} />
                  </Pressable>
                ) : null}
              </View>
              {g.id === "omnibus" && omnibusInfo ? (
                <Note>
                  An omnibus is one big book that holds several volumes, like a
                  3-in-1. Its listing doesn't always say which volumes are
                  inside, so check the count with Edit.
                </Note>
              ) : null}
              {/* closed only hides them: their ticks still count */}
              {closedIds.has(g.id) ? null : g.rows.map(seriesRow)}
            </View>
          ) : (
            g.rows.map(seriesRow)
          ),
        )}
      </View>

      {editing ? (
        <MatchModal
          series={editing}
          searchFirst={searchFirst ?? undefined}
          current={matchOf(editing)}
          edited={Boolean(editOf(editing, edits))}
          onSave={(edit) => {
            imported.edit(editing.members ?? [editing.key], edit);
            setFollowed(editing.key);
          }}
          onUndo={() => {
            imported.unedit(editing.members ?? [editing.key]);
            setFollowed(editing.key);
          }}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </>
  );
}
