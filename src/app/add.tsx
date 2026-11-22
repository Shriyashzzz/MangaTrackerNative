// Add a manga, as the Android app's (web pages/AddManga/AddManga.tsx): search
// the title and pick the series (or keep what they typed), then the rest
// opens under it: status, where they're up to (a season of the anime fills
// it in), stars, and under "More about it" the volumes they own, the type,
// genre and notes. The checks and the request are the web's own (core
// seriesFormRules); AniList's matches come through core useCoverSearch
import { isDemo } from "@/core/lib/demo";
import TourTarget from "@/components/TourTarget";
import Tap from "@/components/Tap";
import { useIsOffline } from "@/core/lib/offline";
import { Image } from "expo-image";
import {
  router,
  useLocalSearchParams,
  useNavigation,
  usePreventRemove,
} from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Alert, BackHandler, Keyboard, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Button from "@/components/Button";
import DoubleRule from "@/components/DoubleRule";
import { Field, Input } from "@/components/Field";
import PickSheet from "@/components/PickSheet";
import PlaceField from "@/components/PlaceField";
import Segmented from "@/components/Segmented";
import StarRating from "@/components/StarRating";
import TitleField from "@/components/TitleField";
import VolumePicker, { useVolumePicker } from "@/components/VolumePicker";
import WatchedAnime from "@/components/WatchedAnime";
import {
  ChevronDownIcon,
  ChevronLeftIcon,
  LinkIcon,
} from "@/core/components/icons/Icons";
import { useCoverSearch } from "@/core/components/coverPicker/useCoverSearch";
import type { CoverHit } from "@/core/lib/anilist";
import { apiFetch, errorMessages } from "@/core/lib/api";
import { newBook } from "@/core/lib/books";
import { saveBooks } from "@/core/lib/booksApi";
import { GENRES } from "@/core/lib/content/genres";
import { priceName } from "@/core/lib/prices";
import { tracksOf } from "@/core/lib/reading";
import {
  problemsIn,
  requestFor,
  type SeriesFormValues,
} from "@/core/lib/seriesFormRules";
import { findOnShelf } from "@/core/lib/shelf";
import type { ShelfMatch } from "@/core/lib/types";
import { useBuyOptions } from "@/core/pages/Details/useBuyOptions";
import { useColors } from "@/lib/colors";
import { readLocal, writeLocal } from "@/lib/deviceStore";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import { DEFAULT_TRACK_BY } from "@/lib/trackBy";

const Safe = withUniwind(SafeAreaView);

const DESC_MAX = 450;
const GENRE_OPTIONS = [{ value: "", label: "Select a genre" }, ...GENRES];
// AniList's matches in the title list
const MATCHES = 30;
// whether they left "More about it" open last time
const MORE_KEY = "addMoreOpen";
type Stage = "reading" | "finished" | "planned";
const STAGES = [
  { value: "reading", label: "Still reading" },
  { value: "finished", label: "Finished it" },
  { value: "planned", label: "Want to read" },
] as const;
const FORMATS = [
  { value: "manga", label: "Manga" },
  { value: "novel", label: "Novel" },
] as const;

// the series already on their shelf under this title, said before they fill
// the rest in (the server still refuses a second copy on saving)
function useAlreadyOnShelf(title: string, chosen: boolean) {
  const [already, setAlready] = useState<{
    title: string;
    match: NonNullable<ShelfMatch>;
  } | null>(null);
  useEffect(() => {
    const name = title.trim();
    if (!chosen || !name) return;
    const controller = new AbortController();
    findOnShelf(name, controller.signal)
      .then((match) => setAlready(match ? { title, match } : null))
      .catch(() => {});
    return () => controller.abort();
  }, [chosen, title]);
  return already;
}

// "Leave without adding it?": the keyboard goes first, so the question
// isn't drawn while the page is still moving under it
function askToLeave(setLeaving: (leaving: boolean) => void) {
  Keyboard.dismiss();
  Alert.alert("Leave without adding it?", "What you entered won't be kept.", [
    { text: "Keep editing", style: "cancel" },
    { text: "Leave", style: "destructive", onPress: () => setLeaving(true) },
  ]);
}

export default function AddScreen() {
  const c = useColors();
  // no connection: the strip at the foot says why the button is off
  const offline = useIsOffline();
  // from a price page: the title, its format, and a volume or book they own
  const params = useLocalSearchParams<{
    title?: string;
    format?: string;
    ownedVolume?: string;
    volumesOwned?: string;
    ownedVolumes?: string;
    bookTitle?: string;
    bookIsbn?: string;
    // from After the anime: the last chapter it covered, and the last
    // volume it covered all of
    chapter?: string;
    readVolume?: string;
  }>();
  const trackBy = usePrefs((s) => s.prefs.trackBy ?? DEFAULT_TRACK_BY);
  const fromPrices = (params.title ?? "").slice(0, 150);
  const novelFromPrices = params.format === "novel";
  const [stage, setStage] = useState<Stage>("reading");
  // a whole number from the address, within reason
  const whole = (typed: string | undefined, most: number) => {
    const n = Number(typed);
    return Number.isInteger(n) && n > 0 && n <= most ? String(n) : null;
  };
  const [chapter, setChapter] = useState(whole(params.chapter, 100000) ?? "0");
  const [readVolume, setReadVolume] = useState(
    whole(params.readVolume, 999) ?? "",
  );
  const [byVolumeChoice, setByVolumeChoice] = useState<boolean | null>(null);
  const [rating, setRating] = useState(0);
  const [problems, setProblems] = useState<{
    title?: string;
    bookmark?: string;
    image?: string;
  }>({});
  const [title, setTitle] = useState(fromPrices);
  const [picked, setPicked] = useState<CoverHit | null>(null);
  const [chosen, setChosen] = useState(Boolean(fromPrices));
  const [image, setImage] = useState("");
  const [ownCover, setOwnCover] = useState(false);
  const [brokenCover, setBrokenCover] = useState<string | null>(null);
  const [genre, setGenre] = useState("");
  const [pickingGenre, setPickingGenre] = useState(false);
  const [lightNovel, setLightNovel] = useState(novelFromPrices);
  const already = useAlreadyOnShelf(title, chosen);
  const formatTouched = useRef(novelFromPrices);
  const byVolume = byVolumeChoice ?? lightNovel;
  const tracks = tracksOf({ byVolume }, trackBy);
  const digits = title.replace(/[\s-]/g, "");
  const typedIsbn = /^(97[89]\d{10}|\d{9}[\dXx])$/.test(digits) ? digits : null;
  const [genreFromAniList, setGenreFromAniList] = useState(false);
  const genreTouched = useRef(false);
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Leaving with something entered (the back arrow, the phone's back, or
  // Cancel) asks first: a slip no longer throws a half-filled form away.
  // The three ways out ask before any move starts, so the page never
  // begins to slide away and snap back; usePreventRemove is only the net
  // under them (a swipe back). The guard comes off once it's saved, or once
  // they've said Leave, and only then does the page move (while the guard
  // is up, that move would be held back too)
  const [savedId, setSavedId] = useState<number | null>(null);
  const [leaving, setLeaving] = useState(false);
  const entered =
    title.trim() !== (fromPrices ?? "").trim() || picked !== null || rating > 0;
  // (never on the practice shelf: nothing there is theirs to lose)
  const navigation = useNavigation();
  const guarded = entered && savedId === null && !leaving && !isDemo();
  const leave = () => (guarded ? askToLeave(setLeaving) : router.back());
  usePreventRemove(guarded, () => askToLeave(setLeaving));
  useEffect(() => {
    if (!guarded) return;
    const back = BackHandler.addEventListener("hardwareBackPress", () => {
      // only while this form is the page in front: with another page over
      // it (the series just opened from here), back is that page's
      if (!navigation.isFocused()) return false;
      askToLeave(setLeaving);
      return true;
    });
    return () => back.remove();
  }, [guarded]);
  useEffect(() => {
    if (leaving) router.back();
  }, [leaving]);
  useEffect(() => {
    if (savedId === null) return;
    router.replace({
      pathname: "/details/[id]",
      params: { id: String(savedId) },
    });
  }, [savedId]);
  const fromVolume = Number(params.ownedVolume) || null;
  const volumesFromLink = fromVolume ?? (Number(params.volumesOwned) || null);
  const bookVolumes = (params.ownedVolumes ?? "")
    .split(",")
    .map(Number)
    .filter((v) => Number.isInteger(v) && v > 0)
    .slice(0, 60);
  const fromBook = bookVolumes.length
    ? {
        title: (params.bookTitle ?? "").slice(0, 200),
        isbn13: (params.bookIsbn ?? "").slice(0, 13),
      }
    : null;
  const [moreOpen, setMoreOpen] = useState(
    () =>
      Boolean(volumesFromLink || bookVolumes.length) ||
      readLocal(MORE_KEY) === "1",
  );
  const series = useBuyOptions(
    picked ? priceName({ name: picked.title, lightNovel }) : null,
    { volumesOwned: null },
  );
  const volumes = useVolumePicker({
    volumesOwned: bookVolumes.length ? null : volumesFromLink,
    ownedList: bookVolumes.length
      ? bookVolumes
      : fromVolume
        ? [fromVolume]
        : [],
  });

  const autoPick = useRef(Boolean(fromPrices));
  const pickTitle = (hit: CoverHit) => {
    autoPick.current = false;
    setTitle(hit.title);
    setPicked(hit);
    setChosen(true);
    setProblems({});
    if (!ownCover) setImage(hit.cover);
    if (!formatTouched.current) setLightNovel(hit.lightNovel);
    if (!genreTouched.current) {
      setGenre(hit.genre ?? "");
      setGenreFromAniList(Boolean(hit.genre));
    }
  };
  const searching = !chosen || (!picked && title === fromPrices);
  const search = useCoverSearch(searching ? title : "", {
    perPage: MATCHES,
    onFound: (hits, query) => {
      if (!autoPick.current || query !== fromPrices.trim()) return;
      const same = hits.find(
        (h) => h.title.toLowerCase() === query.toLowerCase(),
      );
      if (same) pickTitle(same);
    },
  });
  const asTyped = () => {
    autoPick.current = false;
    if (!formatTouched.current) setLightNovel(novelFromPrices);
    setPicked(null);
    if (!genreTouched.current) {
      setGenre("");
      setGenreFromAniList(false);
    }
    setChosen(true);
    setProblems({});
    if (!ownCover) setImage("");
  };
  const change = () => {
    autoPick.current = false;
    setChosen(false);
    setPicked(null);
  };
  const closeOwnCover = () => {
    setOwnCover(false);
    setImage(picked?.cover ?? "");
    setProblems((e) => ({ ...e, image: undefined }));
  };

  const submit = async () => {
    setErrors([]);
    const values: SeriesFormValues = {
      title,
      stage,
      chapter,
      readVolume,
      tracks,
      byVolume,
      rating,
      image,
      ownCover,
      genre,
      description,
      lightNovel,
      volumesOwned:
        volumes.saved.volumesOwned == null
          ? ""
          : String(volumes.saved.volumesOwned),
      ownedList: volumes.saved.ownedList.join(","),
    };
    const found = problemsIn(values);
    setProblems(found);
    if (found.title) return change();
    if (found.bookmark || found.image) return;
    setSubmitting(true);
    try {
      const res = await apiFetch("/api/manga", {
        method: "POST",
        body: requestFor(values),
      });
      if (res.ok) {
        const { id } = (await res.json()) as { id: number };
        if (fromBook)
          await saveBooks(id, [
            newBook(fromBook.title, bookVolumes, fromBook.isbn13 || undefined),
          ]).catch(() => {});
        void useShelf.getState().load();
        setSavedId(id);
      } else setErrors(await errorMessages(res));
    } catch {
      setErrors(["Couldn't reach the server. Are you signed in?"]);
    } finally {
      setSubmitting(false);
    }
  };

  const genreName = GENRES.find((g) => g.value === genre)?.label;
  const meta = [lightNovel ? "Novel" : "Manga", picked?.year, genreName].filter(
    Boolean,
  );
  const coverShows = Boolean(image) && brokenCover !== image;
  const genreLabel =
    GENRE_OPTIONS.find((g) => g.value === genre)?.label ?? "Select a genre";

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Tap
          feel="round"
          onPress={leave}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back to the shelf"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Tap>
        <Text className="flex-1 font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase">
          Add a manga
          {"\u00A0"}
        </Text>
      </View>
      <DoubleRule />
      <KeyboardAwareScrollView
        bottomOffset={24}
        contentContainerClassName="gap-5 px-4 pt-4 pb-16"
        keyboardShouldPersistTaps="handled"
      >
        {!chosen ? (
          <Field label="Title" required error={problems.title}>
            <TitleField
              value={title}
              error={problems.title}
              onChange={(next) => {
                setTitle(next);
                setProblems((e) => ({ ...e, title: undefined }));
              }}
              hits={search.query === title.trim() ? search.hits : []}
              guessed={search.guessed}
              status={search.status}
              onPick={pickTitle}
              onTyped={asTyped}
            />
            {!problems.title ? (
              typedIsbn ? (
                <View className="flex-row flex-wrap items-baseline gap-2">
                  <Text className="font-body text-[14px] text-ink-soft">
                    That's an ISBN.
                  </Text>
                  <Tap
                    onPress={() =>
                      router.replace({
                        pathname: "/scan",
                        params: { isbn: typedIsbn },
                      })
                    }
                    hitSlop={6}
                  >
                    <Text className="font-body-semibold text-[14px] text-ink border-b pb-[2px] border-ink self-start">
                      Add the book it belongs to
                    </Text>
                  </Tap>
                </View>
              ) : (
                <Text className="font-body text-[13.5px] text-muted">
                  Choose a match and we fill in the cover, type and genre.
                </Text>
              )
            ) : null}
          </Field>
        ) : (
          <>
            {/* what they picked: cover, name, what we know of it, Change */}
            <View className="flex-row gap-3 rounded-[4px] border-[1.5px] border-line-soft bg-card p-3">
              {coverShows ? (
                <Image
                  source={{ uri: image }}
                  style={{
                    width: 56,
                    aspectRatio: 2 / 3,
                    borderWidth: 1.5,
                    borderColor: c.line,
                  }}
                  contentFit="cover"
                  onError={() => setBrokenCover(image)}
                />
              ) : (
                <View
                  style={{
                    width: 56,
                    aspectRatio: 2 / 3,
                    borderWidth: 1.5,
                    borderColor: c.lineSoft,
                    borderStyle: "dashed",
                  }}
                  className="items-center justify-center p-1"
                >
                  <Text className="text-center font-mono text-[9.5px] text-muted">
                    {image ? "link not loading" : "no cover"}
                  </Text>
                </View>
              )}
              <View className="min-w-0 flex-1 gap-1">
                <Text className="font-display text-[19px] leading-[23px] text-ink">
                  {title}
                </Text>
                <Text className="font-mono text-[12px] text-muted">
                  {picked ? meta.join(" · ") : "As you typed it"}
                </Text>
                <View className="mt-1 flex-row flex-wrap gap-x-4 gap-y-1">
                  <Tap onPress={change} hitSlop={6}>
                    <Text className="font-body-medium text-[14px] text-ink border-b pb-[2px] border-ink self-start">
                      Change
                    </Text>
                  </Tap>
                  {!ownCover ? (
                    <Tap
                      onPress={() => {
                        setOwnCover(true);
                        setImage("");
                      }}
                      hitSlop={6}
                      className="flex-row items-center gap-1"
                    >
                      <LinkIcon color={c.inkSoft} width={14} height={14} />
                      <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
                        {picked ? "Use my own cover" : "Add a cover image"}
                      </Text>
                    </Tap>
                  ) : null}
                </View>
              </View>
            </View>
            {already?.title === title ? (
              <View className="flex-row flex-wrap items-baseline gap-2 rounded-[14px] bg-accent-wash px-3 py-2">
                <Text className="font-body text-[14.5px] text-ink">
                  Already on your shelf as{" "}
                  <Text className="font-body-semibold">
                    {already.match.name}
                  </Text>
                  .
                </Text>
                <Tap
                  onPress={() =>
                    router.replace({
                      pathname: "/details/[id]",
                      params: { id: String(already.match.id) },
                    })
                  }
                  hitSlop={6}
                >
                  <Text className="font-body-semibold text-[14.5px] text-accent border-b pb-[2px] border-accent self-start">
                    Open it
                  </Text>
                </Tap>
              </View>
            ) : null}
            {ownCover ? (
              <Field label="Your own cover" error={problems.image}>
                <View className="flex-row items-center gap-2">
                  <View className="flex-1">
                    <Input
                      value={image}
                      onChangeText={(next) => {
                        setImage(next.trim());
                        setProblems((er) => ({ ...er, image: undefined }));
                      }}
                      placeholder="https://…"
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                      invalid={Boolean(problems.image)}
                    />
                  </View>
                  <Tap onPress={closeOwnCover} hitSlop={6}>
                    <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
                      {picked ? "Use theirs" : "Remove link"}
                    </Text>
                  </Tap>
                </View>
              </Field>
            ) : null}
            <Field label="Status" required>
              <Segmented
                label="Status"
                options={STAGES}
                value={stage}
                onChange={(next) => {
                  setStage(next);
                  setProblems((e) => ({ ...e, bookmark: undefined }));
                }}
              />
            </Field>
            {stage === "reading" ? (
              <PlaceField
                mode={trackBy}
                byVolume={byVolume}
                onByVolume={setByVolumeChoice}
                chapter={chapter}
                onChapter={(next) => {
                  setChapter(next);
                  setProblems((er) => ({ ...er, bookmark: undefined }));
                }}
                volume={readVolume}
                onVolume={setReadVolume}
                chapterError={problems.bookmark}
                optional
              />
            ) : null}
            {stage === "reading" && !lightNovel ? (
              <TourTarget name="anime">
                <WatchedAnime
                  seriesName={title.trim()}
                  onPick={(place) => {
                    if (place.chapter !== null)
                      setChapter(String(place.chapter));
                    if (place.volume !== null)
                      setReadVolume(String(place.volume));
                    setProblems((e) => ({ ...e, bookmark: undefined }));
                  }}
                />
              </TourTarget>
            ) : null}
            {stage !== "planned" ? (
              <Field label="Your rating" optional>
                <StarRating
                  value={rating}
                  size="lg"
                  onChange={(stars) => setRating(stars === rating ? 0 : stars)}
                />
              </Field>
            ) : null}
            <Tap
              onPress={() => {
                setMoreOpen(!moreOpen);
                writeLocal(MORE_KEY, moreOpen ? "0" : "1");
              }}
              accessibilityState={{ expanded: moreOpen }}
              className="flex-row items-center justify-between border-y border-dashed border-line-soft py-3"
            >
              <View>
                <Text className="font-body-semibold text-[15px] text-ink">
                  More about it
                </Text>
                <Text className="font-body text-[13px] text-muted">
                  Volumes, notes, type, genre
                </Text>
              </View>
              <View
                style={{
                  transform: [{ rotate: moreOpen ? "180deg" : "0deg" }],
                }}
              >
                <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
              </View>
            </Tap>
            {moreOpen ? (
              <View className="gap-5">
                <VolumePicker
                  picker={volumes}
                  out={series.latest?.volume ?? null}
                />
                <Field label="Type">
                  <Segmented
                    label="Type"
                    options={FORMATS}
                    value={lightNovel ? "novel" : "manga"}
                    onChange={(v) => {
                      formatTouched.current = true;
                      setLightNovel(v === "novel");
                    }}
                  />
                </Field>
                <Field
                  label="Genre"
                  optional
                  aside={
                    genreFromAniList ? (
                      <Text className="font-mono text-[11.5px] text-muted">
                        from AniList
                      </Text>
                    ) : undefined
                  }
                >
                  <Tap
                    onPress={() => setPickingGenre(true)}
                    className="min-h-[46px] flex-row items-center justify-between rounded-[2px] border-[1.5px] border-line-soft bg-paper px-3"
                  >
                    <Text
                      className={`font-body text-[16px] ${genre ? "text-ink" : "text-muted"}`}
                    >
                      {genreLabel}
                    </Text>
                    <ChevronDownIcon color={c.inkSoft} width={18} height={18} />
                  </Tap>
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
                    placeholder={
                      lightNovel
                        ? "Your thoughts on the novel…"
                        : "Your thoughts on the manga…"
                    }
                    style={{ minHeight: 96, textAlignVertical: "top" }}
                  />
                </Field>
              </View>
            ) : null}
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
              <Button label="Cancel" onPress={leave} />
              <Button
                label={submitting ? "Adding…" : "Put it on the shelf"}
                kind="primary"
                disabled={submitting || offline}
                onPress={() => void submit()}
              />
            </View>
          </>
        )}
      </KeyboardAwareScrollView>
      <PickSheet
        open={pickingGenre}
        title="Genre"
        options={GENRE_OPTIONS}
        picked={genre}
        onPick={(value) => {
          genreTouched.current = true;
          setGenre(value);
          setGenreFromAniList(false);
        }}
        onClose={() => setPickingGenre(false)}
      />
    </Safe>
  );
}
