// Choosing which AniList series a book is, and how many volumes of it they
// own (the web's pages/Import/MatchModal.tsx), in a sheet: search AniList as
// they type, the hits as a pick-one list, "None of these", then the volumes
import Tap from "@/components/Tap";
import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Button from "@/components/Button";
import { Field, Input } from "@/components/Field";
import Sheet from "@/components/Sheet";
import {
  AniListBusy,
  aniListGapMs,
  searchSeries,
  type SeriesHit,
} from "@/core/lib/anilist";
import { gapsIn, type BookSeries } from "@/core/lib/imports/bookImport";
import { knownNamesNear } from "@/core/lib/knownNames";
import { DID_YOU_MEAN, withNearMatches } from "@/core/lib/nearMatches";
import {
  ownedVolumes,
  parseVolumes,
  rangesText,
} from "@/core/lib/ownedVolumes";
import type { Edit, Match } from "@/store/bookImport";
import { Note } from "./ImportParts";

const TYPING_PAUSE_MS = 450;

const FORMATS: Record<string, string> = {
  MANGA: "Manga",
  NOVEL: "Novel",
  ONE_SHOT: "One shot",
};

type Found =
  | { state: "idle" }
  | { state: "searching" }
  | { state: "done"; hits: SeriesHit[]; guessed: boolean }
  | { state: "waiting"; seconds: number }
  | { state: "unreachable" }
  | { state: "failed" };

export default function MatchModal({
  series,
  current,
  edited,
  searchFirst = series.title,
  onSave,
  onUndo,
  onClose,
}: {
  series: BookSeries;
  current: Match | undefined;
  edited: boolean;
  // the name to search first: the series' own, or a "Did you mean"
  searchFirst?: string;
  onSave: (edit: Edit) => void;
  onUndo: () => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState(searchFirst);
  const [found, setFound] = useState<Found>({ state: "searching" });
  const [tries, setTries] = useState(0);
  // undefined: what the import matched stays; null: none of these
  const [picked, setPicked] = useState<SeriesHit | null | undefined>();
  const [volumes, setVolumes] = useState(
    gapsIn(series.ownedList)
      ? rangesText(series.ownedList!)
      : String(series.ownedVolumes),
  );
  const [countTyped, setCountTyped] = useState(false);
  const matched = current && current !== "failed" ? current : null;

  // searched after a pause in typing, and no sooner than AniList allows
  useEffect(() => {
    const words = search.trim();
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ask = (after: number) => {
      timer = setTimeout(() => {
        setFound({ state: "searching" });
        withNearMatches(
          words,
          (text, retry) => searchSeries(text, controller.signal, retry),
          (hit) => hit.name,
          (text) => knownNamesNear(text, controller.signal),
        )
          .then(({ hits, guessed }) =>
            setFound({ state: "done", hits, guessed }),
          )
          .catch((e: unknown) => {
            if (controller.signal.aborted) return;
            if (e instanceof AniListBusy && e.unreachable)
              setFound({ state: "unreachable" });
            else if (e instanceof AniListBusy) {
              setFound({ state: "waiting", seconds: e.waitSeconds });
              ask(e.waitSeconds * 1000);
            } else setFound({ state: "failed" });
          });
      }, after);
    };
    if (words)
      ask(
        words === searchFirst && !tries
          ? 0
          : Math.max(TYPING_PAUSE_MS, aniListGapMs()),
      );
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [search, searchFirst, tries]);

  const results: Found = search.trim() ? found : { state: "idle" };
  const chosenId =
    picked === undefined ? matched?.anilistId : (picked?.anilistId ?? null);
  const noneChosen =
    picked === null || (picked === undefined && current === null);
  const typed = volumes.trim();
  const runTo = /^\d{1,3}$/.test(typed) ? Number(typed) : null;
  const list = runTo === null ? parseVolumes(typed) : null;
  const countOk = typed !== "" && (runTo !== null || Boolean(list?.length));
  let matchLine = "Not on AniList";
  if (matched) matchLine = `Matched to ${matched.name}`;
  else if (current === "failed") matchLine = "Couldn't check AniList";
  let volumesHint =
    "A number is every volume up to it; a list like 1-5, 8 keeps the gaps.";
  if (!countOk)
    volumesHint = "A number (up to that volume) or a list like 1-5, 8.";
  else if (series.omnibus)
    volumesHint =
      "Omnibuses and box sets hold several volumes each: list the volumes, not the books (1-27, 30).";

  const save = () => {
    if (!countOk) return;
    const edit: Edit = {};
    if (picked !== undefined)
      edit.match = picked && {
        anilistId: picked.anilistId,
        malId: picked.malId,
        name: picked.name,
        cover: picked.cover,
        fit: "exact",
      };
    if (countTyped) {
      edit.volumes = runTo ?? Math.max(0, ...list!.filter(Number.isInteger));
      edit.list = runTo === null ? ownedVolumes(null, list).ownedList : [];
    }
    if (edit.match !== undefined || edit.volumes !== undefined) onSave(edit);
    onClose();
  };

  return (
    <Sheet open onClose={onClose} maxHeight={0.92}>
      <View className="gap-4 pt-1">
        <View>
          <Text className="font-display text-[18px] text-ink">
            {series.title}
          </Text>
          <Text className="font-mono text-[13px] text-ink-soft">
            {matchLine}
          </Text>
        </View>

        <Field label="Which series is it?">
          <Input
            value={search}
            onChangeText={(text) => {
              setSearch(text);
              setFound({ state: "searching" });
            }}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            placeholder="Search AniList"
          />
        </Field>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="AniList series"
          className="gap-1"
        >
          {results.state === "searching" ? (
            <Note>Searching AniList…</Note>
          ) : null}
          {results.state === "idle" ? (
            <Note>Type the series' name to search AniList.</Note>
          ) : null}
          {results.state === "waiting" ? (
            <Note>
              AniList asked us to slow down. Searching again in{" "}
              {results.seconds} seconds.
            </Note>
          ) : null}
          {results.state === "unreachable" || results.state === "failed" ? (
            <View className="flex-row flex-wrap items-baseline gap-1">
              <Note>
                {results.state === "unreachable"
                  ? "Couldn't reach AniList. Check your connection, then"
                  : "AniList didn't answer that search."}
              </Note>
              <Text
                onPress={() => setTries((n) => n + 1)}
                className="font-body-semibold text-[14.5px] text-ink underline"
              >
                search again
              </Text>
            </View>
          ) : null}
          {results.state === "done" && !results.hits.length ? (
            <Note>
              No manga by that name. Check the spelling, try its Japanese name,
              or a shorter one.
            </Note>
          ) : null}
          {results.state === "done" && results.guessed ? (
            <Note>{DID_YOU_MEAN}</Note>
          ) : null}
          {results.state === "done"
            ? results.hits.map((hit) => (
                <Hit
                  key={hit.anilistId}
                  hit={hit}
                  chosen={chosenId === hit.anilistId}
                  onPress={() => setPicked(hit)}
                />
              ))
            : null}
          <Tap
            onPress={() => setPicked(null)}
            accessibilityRole="radio"
            accessibilityState={{ checked: noneChosen }}
            className={`rounded-[4px] border-[1.5px] px-3 py-3 ${noneChosen ? "border-accent bg-accent-wash" : "border-line-soft"}`}
          >
            <Text className="font-body text-[14.5px] text-ink">
              None of these: not on AniList, leave it off my shelf
            </Text>
          </Tap>
        </View>

        <Field label="Volumes owned" error={countOk ? undefined : volumesHint}>
          <Input
            value={volumes}
            onChangeText={(text) => {
              setVolumes(text);
              setCountTyped(true);
            }}
            autoCorrect={false}
            placeholder="14, or 1-5, 8"
            invalid={!countOk}
          />
          {countOk ? <Note>{volumesHint}</Note> : null}
        </Field>

        <View className="flex-row flex-wrap justify-end gap-2">
          {edited ? (
            <Button
              small
              label="Undo my edits"
              onPress={() => {
                onUndo();
                onClose();
              }}
            />
          ) : null}
          <Button small label="Cancel" onPress={onClose} />
          <Button
            small
            kind="primary"
            label="Save"
            disabled={!countOk}
            onPress={save}
          />
        </View>
      </View>
    </Sheet>
  );
}

function Hit({
  hit,
  chosen,
  onPress,
}: {
  hit: SeriesHit;
  chosen: boolean;
  onPress: () => void;
}) {
  const meta = [
    hit.year,
    hit.format ? (FORMATS[hit.format] ?? "Other") : null,
    hit.adult ? "18+" : null,
  ]
    .filter(Boolean)
    .join(" · ");
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ checked: chosen }}
      className={`flex-row items-center gap-3 rounded-[4px] border-[1.5px] p-2 ${chosen ? "border-accent bg-accent-wash" : "border-line-soft"}`}
    >
      {hit.cover ? (
        <Image
          source={{ uri: hit.cover }}
          style={{ width: 40, height: 56, borderRadius: 2 }}
          contentFit="cover"
        />
      ) : (
        <View className="h-14 w-10 rounded-[2px] bg-paper-2" />
      )}
      <View className="min-w-0 flex-1">
        <Text className="font-body-semibold text-[15px] text-ink">
          {hit.name}
        </Text>
        {hit.otherName ? (
          <Text numberOfLines={1} className="font-body text-[13px] text-muted">
            {hit.otherName}
          </Text>
        ) : null}
        {meta ? (
          <Text className="font-mono text-[12.5px] text-ink-soft">{meta}</Text>
        ) : null}
      </View>
    </Tap>
  );
}
