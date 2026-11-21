// One series on the shelf, as the Android app's row (web components/mangaCard
// MangaCard.tsx, its rows): cover, name, their stars under it, their place
// when the right side doesn't say it, the genre, and on the right how far
// through they are. The words come from the web's own rules (core cardText,
// reading), so the two apps always say the same. While selecting, a tick box
// sits on the cover and a tap picks the row. A long press opens the
// platform's own menu: Edit, Move to, Select several, Delete
import SeriesCover from "@/components/SeriesCover";
import { MenuView, type MenuAction } from "@react-native-menu/menu";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import { Alert, Platform, Pressable, Text, View } from "react-native";
import { useRipple } from "@/lib/press";
import { useShelf } from "@/store/shelf";
import { CheckIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { progressOf, rowKindLine } from "@/core/components/mangaCard/cardText";
import { ownedOf } from "@/core/lib/ownedVolumes";
import { placeText, tracksOf, type TrackBy } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import StarRating from "./StarRating";

export default function ShelfRow({
  manga,
  trackBy,
  latestChapter,
  latestVolume,
  select,
  onLongPress,
}: {
  manga: Manga;
  trackBy: TrackBy;
  latestChapter?: number | null;
  latestVolume?: number | null;
  select?: { checked: boolean; onToggle: () => void };
  // "Select several" from the menu
  onLongPress?: () => void;
}) {
  const c = useColors();
  const ripple = useRipple();
  const { unit, reading, knownTotal } = progressOf(
    manga,
    tracksOf(manga, trackBy),
    latestChapter ?? manga.latestChapter,
    latestVolume,
  );
  // the right side says "ch. 50 of 101" with its bar: the place isn't said twice
  const progressSaysPlace = !manga.status && reading > 0 && knownTotal != null;
  const place = placeText(manga, trackBy);
  const rowLine = progressSaysPlace ? null : manga.planned ? "to read" : place;
  const kindLine = rowKindLine(manga);
  const rating = Number(manga.rating) || 0;

  const row = (
    <Pressable
      android_ripple={ripple}
      onPress={select?.onToggle}
      accessibilityState={select ? { selected: select.checked } : undefined}
      className={`flex-row items-center gap-3 py-1.5 active:opacity-70 ${select?.checked ? "bg-accent-wash" : ""}`}
    >
      <View>
        <SeriesCover
          name={manga.name}
          lightNovel={manga.lightNovel}
          url={manga.image}
          width={44}
        />
        {select ? (
          <View
            className={`absolute top-1 left-1 h-5 w-5 items-center justify-center rounded-[3px] border-[1.5px] ${select.checked ? "border-accent bg-accent" : "border-line bg-card"}`}
          >
            {select.checked ? (
              <CheckIcon color={c.paper} width={14} height={14} />
            ) : null}
          </View>
        ) : null}
      </View>
      <View className="min-w-0 flex-1 gap-[2px]">
        <Text numberOfLines={1} className="font-display text-[17px] text-ink">
          {manga.name}
        </Text>
        {rating > 0 && <StarRating value={rating} />}
        {rowLine ? (
          <Text
            numberOfLines={1}
            className="font-mono-medium text-[13.5px] text-ink-soft"
          >
            {rowLine}
          </Text>
        ) : null}
        {kindLine ? (
          <Text
            numberOfLines={1}
            className="font-mono text-[12.5px] text-muted"
          >
            {kindLine}
          </Text>
        ) : null}
      </View>
      <View className="w-[120px] items-end gap-1 pr-2">
        <RowProgress
          finished={manga.status}
          ownedCount={ownedOf(manga).length}
          unit={unit}
          reading={reading}
          knownTotal={knownTotal}
        />
      </View>
    </Pressable>
  );
  if (select) return row;
  return (
    <MenuView
      title={manga.name}
      shouldOpenOnLongPress
      actions={menuActions(manga)}
      onPressAction={({ nativeEvent }) => {
        void Haptics.selectionAsync();
        const id = nativeEvent.event;
        if (id === "edit") router.push(`/edit/${manga.id}`);
        else if (id === "select") onLongPress?.();
        else if (id === "delete") askToDelete(manga);
        else if (id.startsWith("move:"))
          void useShelf
            .getState()
            .moveMany([manga.id], id.slice("move:".length) as ShelfStatus);
      }}
    >
      <Link href={`/details/${manga.id}`} asChild>
        {row}
      </Link>
    </MenuView>
  );
}

type ShelfStatus = "reading" | "finished" | "planned";

// the other two tabs it could go to, then Select and Delete
function menuActions(manga: Manga): MenuAction[] {
  const current: ShelfStatus = manga.planned
    ? "planned"
    : manga.status
      ? "finished"
      : "reading";
  const moves: { status: ShelfStatus; title: string; sf: string }[] = [
    { status: "reading", title: "Move to Reading", sf: "book" },
    { status: "finished", title: "Move to Finished", sf: "checkmark.circle" },
    { status: "planned", title: "Move to To read", sf: "bookmark" },
  ];
  const ios = Platform.OS === "ios";
  return [
    { id: "edit", title: "Edit details", image: ios ? "pencil" : undefined },
    ...moves
      .filter((m) => m.status !== current)
      .map((m) => ({
        id: `move:${m.status}`,
        title: m.title,
        image: ios ? m.sf : undefined,
      })),
    {
      id: "select",
      title: "Select several",
      image: ios ? "checklist" : undefined,
    },
    {
      id: "delete",
      title: "Delete",
      attributes: { destructive: true },
      image: ios ? "trash" : undefined,
    },
  ];
}

function askToDelete(manga: Manga) {
  Alert.alert(
    `Delete ${manga.name}?`,
    "It comes off your shelf with its volumes and books, rating, reading progress and notes.",
    [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete it",
        style: "destructive",
        onPress: () => {
          void useShelf
            .getState()
            .removeMany([manga.id])
            .then((done) => {
              if (!done) Alert.alert("That didn't delete it. Try again.");
            });
        },
      },
    ],
  );
}

// the right of a row: "Finished", how many books, or how far through with a
// bar under it (web MangaCard RowProgress)
function RowProgress({
  finished,
  ownedCount,
  unit,
  reading,
  knownTotal,
}: {
  finished: boolean;
  ownedCount: number;
  unit: "ch." | "vol.";
  reading: number;
  knownTotal: number | null;
}) {
  const text = "font-mono text-[12px] text-ink-soft text-right";
  if (finished) return <Text className={text}>Finished</Text>;
  if (!reading && ownedCount)
    return (
      <Text className={text}>
        {ownedCount} {ownedCount === 1 ? "vol" : "vols"}
      </Text>
    );
  if (knownTotal == null || reading <= 0) return null;
  const percent = knownTotal ? Math.min((reading / knownTotal) * 100, 100) : 0;
  return (
    <>
      <Text className={text}>
        {unit} {reading} of {knownTotal}
      </Text>
      <View className="h-1.5 w-full overflow-hidden rounded-full border border-line bg-card">
        <View className="h-full bg-accent" style={{ width: `${percent}%` }} />
      </View>
    </>
  );
}
