// Edit details, as the Android app's (web pages/UpdateManga/UpdateManga.tsx):
// fix the title, cover or genre, or update where they're up to. The checks
// and the request are the web's own (core seriesFormRules). The cover strip
// (CoverPicker) and the spine picker (VolumePicker) are the next two parts
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import { Field, Input } from "@/components/Field";
import PickSheet from "@/components/PickSheet";
import PlaceField from "@/components/PlaceField";
import Segmented from "@/components/Segmented";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
} from "@/core/components/icons/Icons";
import { apiFetch, errorMessages } from "@/core/lib/api";
import { GENRES } from "@/core/lib/content/genres";
import { ownedVolumes } from "@/core/lib/ownedVolumes";
import { tracksOf } from "@/core/lib/reading";
import {
  problemsIn,
  requestFor,
  type SeriesFormValues,
} from "@/core/lib/seriesFormRules";
import type { Manga } from "@/core/lib/types";
import { useColors } from "@/lib/colors";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";

const Safe = withUniwind(SafeAreaView);

const DESC_MAX = 450;
type Stage = "reading" | "finished" | "planned";
const STAGES = [
  { value: "reading", label: "Still reading" },
  { value: "finished", label: "Finished it" },
  { value: "planned", label: "Want to read" },
] as const;
const FORMATS = [
  { value: "manga", label: "Manga" },
  { value: "novel", label: "Light novel" },
] as const;

export default function EditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const c = useColors();
  const trackBy = usePrefs((s) => s.prefs.trackBy ?? "series");
  const [manga, setManga] = useState<Manga | null>(null);
  const [title, setTitle] = useState("");
  const [image, setImage] = useState("");
  const [genre, setGenre] = useState("");
  const [pickingGenre, setPickingGenre] = useState(false);
  const [stage, setStage] = useState<Stage>("reading");
  const [lightNovel, setLightNovel] = useState(false);
  const [chapter, setChapter] = useState("");
  const [readVolume, setReadVolume] = useState("");
  const [byVolume, setByVolume] = useState(false);
  const [description, setDescription] = useState("");
  const [problems, setProblems] = useState<{
    title?: string;
    bookmark?: string;
    image?: string;
  }>({});
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const tracks = tracksOf({ byVolume }, trackBy);

  useEffect(() => {
    let live = true;
    apiFetch(`/api/manga/${id}`)
      .then(async (res) => {
        if (res.status === 403 || res.status === 404)
          throw new Error("This one isn't on your shelf.");
        if (!res.ok)
          throw new Error(
            "Couldn't load this manga. Check your connection and try again.",
          );
        const { manga: m } = (await res.json()) as { manga: Manga };
        if (!live) return;
        setManga(m);
        setStage(m.planned ? "planned" : m.status ? "finished" : "reading");
        setLightNovel(Boolean(m.lightNovel));
        setChapter(String(m.bookmark ?? ""));
        setReadVolume(String(m.readVolume ?? ""));
        setByVolume(Boolean(m.byVolume));
        setDescription(m.description ?? "");
        setTitle(m.name);
        setImage(m.image ?? "");
        setGenre(m.genre && m.genre !== "unlabled" ? m.genre : "");
      })
      .catch((e: Error) => live && setErrors([e.message]));
    return () => {
      live = false;
    };
  }, [id]);

  const save = async () => {
    if (!manga) return;
    // what they own stays as it is until the spine picker is in
    const owned = ownedVolumes(
      manga.volumesOwned ?? null,
      manga.ownedList ?? [],
    );
    const values: SeriesFormValues = {
      title,
      stage,
      chapter,
      readVolume,
      tracks,
      byVolume,
      rating: 0,
      image,
      ownCover: true,
      genre,
      description,
      lightNovel,
      volumesOwned:
        owned.volumesOwned == null ? "" : String(owned.volumesOwned),
      ownedList: owned.ownedList.join(","),
    };
    const found = problemsIn(values);
    setProblems(found);
    if (found.title || found.bookmark || found.image) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/manga/${id}`, {
        method: "PUT",
        body: requestFor(values),
      });
      if (res.status === 400 || res.status === 409)
        setErrors(await errorMessages(res));
      else if (!res.ok) setErrors(["Something went wrong, please try again."]);
      else {
        setErrors([]);
        void useShelf.getState().load();
        router.back();
      }
    } catch {
      setErrors(["Couldn't reach the server."]);
    } finally {
      setSubmitting(false);
    }
  };

  const genreIsOurs = !genre || GENRES.some((g) => g.value === genre);
  const genreOptions = [
    { value: "", label: "Select a genre" },
    ...(genreIsOurs ? [] : [{ value: genre, label: genre }]),
    ...GENRES,
  ];
  const genreLabel =
    genreOptions.find((g) => g.value === genre)?.label ?? "Select a genre";

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Pressable>
        <Text className="flex-1 font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase">
          Edit details
        </Text>
      </View>
      <DoubleRule />
      {!manga ? (
        errors.length ? (
          <Text className="px-4 pt-6 font-body text-[15px] text-accent">
            {errors[0]}
          </Text>
        ) : null
      ) : (
        <ScrollView
          contentContainerClassName="gap-5 px-4 pt-4 pb-16"
          keyboardShouldPersistTaps="handled"
        >
          <Text className="font-body text-[14.5px] text-ink-soft">
            Fix the title, cover or genre, or update where you're up to.
          </Text>
          <Field label="Title" required error={problems.title}>
            <Input
              value={title}
              onChangeText={(next) => {
                setTitle(next);
                setProblems((p) => ({ ...p, title: undefined }));
              }}
              maxLength={150}
              invalid={Boolean(problems.title)}
            />
          </Field>
          <Field label="Cover image link" optional error={problems.image}>
            <Input
              value={image}
              onChangeText={(next) => {
                setImage(next.trim());
                setProblems((p) => ({ ...p, image: undefined }));
              }}
              placeholder="https://…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              invalid={Boolean(problems.image)}
            />
          </Field>
          <Field label="Type">
            <Segmented
              label="Type"
              options={FORMATS}
              value={lightNovel ? "novel" : "manga"}
              onChange={(v) => setLightNovel(v === "novel")}
            />
          </Field>
          <Field label="Status">
            <Segmented
              label="Status"
              options={STAGES}
              value={stage}
              onChange={(next) => {
                setStage(next);
                setProblems((p) => ({ ...p, bookmark: undefined }));
              }}
            />
          </Field>
          {stage === "reading" ? (
            <PlaceField
              mode={trackBy}
              byVolume={byVolume}
              onByVolume={setByVolume}
              chapter={chapter}
              onChapter={(next) => {
                setChapter(next);
                setProblems((p) => ({ ...p, bookmark: undefined }));
              }}
              volume={readVolume}
              onVolume={setReadVolume}
              chapterError={problems.bookmark}
            />
          ) : null}
          <Field label="Genre" optional>
            <Pressable
              onPress={() => setPickingGenre(true)}
              className="min-h-[46px] flex-row items-center justify-between rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3"
            >
              <Text
                className={`font-body text-[16px] ${genre ? "text-ink" : "text-muted"}`}
              >
                {genreLabel}
              </Text>
              <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
            </Pressable>
          </Field>
          <Field
            label="Notes"
            optional
            aside={
              <Text className="font-mono text-[12px] text-muted">
                {description.length}/{DESC_MAX}
              </Text>
            }
          >
            <Input
              value={description}
              onChangeText={setDescription}
              maxLength={DESC_MAX}
              multiline
              style={{ minHeight: 96, textAlignVertical: "top" }}
            />
          </Field>
          {errors.length ? (
            <View className="gap-1">
              {errors.map((e) => (
                <Text
                  key={e}
                  className="font-body-medium text-[14px] text-accent"
                >
                  {e}
                </Text>
              ))}
            </View>
          ) : null}
          <View className="flex-row items-center justify-end gap-4 pt-2">
            <Button label="Cancel" onPress={() => router.back()} />
            <Button
              label={submitting ? "Saving…" : "Save changes"}
              kind="primary"
              disabled={submitting}
              onPress={() => void save()}
            />
          </View>
        </ScrollView>
      )}
      <PickSheet
        open={pickingGenre}
        title="Genre"
        options={genreOptions}
        picked={genre}
        onPick={setGenre}
        onClose={() => setPickingGenre(false)}
      />
    </Safe>
  );
}
