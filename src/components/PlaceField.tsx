// Where they are in a series, on the add and edit forms (the web's
// components/placeField/PlaceField.tsx): the chapter, the volume they've
// read up to, or both, as their settings say. With each series choosing its
// own way, a small switch beside the label says what the box counts
import { View } from "react-native";
import { tracksOf, type TrackBy } from "@/core/lib/reading";
import { Field, Input } from "./Field";
import Segmented from "./Segmented";

const UNITS = [
  { value: "chapter", label: "Chapter" },
  { value: "volume", label: "Volume" },
] as const;

export default function PlaceField({
  mode,
  byVolume,
  onByVolume,
  chapter,
  onChapter,
  volume,
  onVolume,
  chapterError,
  optional = false,
}: {
  mode: TrackBy;
  byVolume: boolean;
  onByVolume: (byVolume: boolean) => void;
  chapter: string;
  onChapter: (chapter: string) => void;
  volume: string;
  onVolume: (volume: string) => void;
  chapterError?: string;
  optional?: boolean;
}) {
  const tracks = tracksOf({ byVolume }, mode);
  if (mode === "series")
    return (
      <Field
        label="Read up to"
        optional={optional}
        error={byVolume ? undefined : chapterError}
      >
        <View className="gap-2">
          <View className="w-[200px]">
            <Segmented
              label="Track this series by"
              options={UNITS}
              value={byVolume ? "volume" : "chapter"}
              onChange={(unit) => onByVolume(unit === "volume")}
            />
          </View>
          <Input
            keyboardType="number-pad"
            value={byVolume ? volume : chapter}
            placeholder={byVolume ? "e.g. 12" : "e.g. 1073"}
            invalid={!byVolume && Boolean(chapterError)}
            onChangeText={byVolume ? onVolume : onChapter}
          />
        </View>
      </Field>
    );
  return (
    <>
      {tracks.chapters ? (
        <Field label="Current chapter" optional={optional} error={chapterError}>
          <Input
            keyboardType="number-pad"
            value={chapter}
            placeholder="e.g. 1073"
            invalid={Boolean(chapterError)}
            onChangeText={onChapter}
          />
        </Field>
      ) : null}
      {tracks.volumes ? (
        <Field label="Current volume" optional={optional}>
          <Input
            keyboardType="number-pad"
            value={volume}
            placeholder="e.g. 12"
            onChangeText={onVolume}
          />
        </Field>
      ) : null}
    </>
  );
}
