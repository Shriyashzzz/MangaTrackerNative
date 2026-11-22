// One series on the shelf, as the Android app's row (web components/mangaCard
// MangaCard.tsx, its rows): cover, name, their stars under it, the genre,
// and on the right how far through they are (a bar when the total is known,
// the place alone when it isn't). The words come from the web's own rules (core cardText,
// reading), so the two apps always say the same. While selecting, a tick box
// sits on the cover and a tap picks the row. A long press opens the
// platform's own menu: Edit, Move to, Select several, Delete
import Tap from "@/components/Tap";
import SeriesCover from "@/components/SeriesCover";
import {
  MenuView,
  type MenuAction,
  type MenuComponentRef,
} from "@react-native-menu/menu";
import * as Haptics from "expo-haptics";
import { Link, router } from "expo-router";
import { memo, useRef, useState } from "react";
import { Alert, Platform, Text, View } from "react-native";
import { useRipple } from "@/lib/press";
import { useShelf } from "@/store/shelf";
import MenuSheet from "./MenuSheet";
import { CheckIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { progressOf, rowKindLine } from "@/core/components/mangaCard/cardText";
import { placeText, tracksOf, type TrackBy } from "@/core/lib/reading";
import type { Manga } from "@/core/lib/types";
import StarRating from "./StarRating";

// memo'd with plain props: picking one row in Select, or a refresh that
// changes nothing, redraws only the rows it touches
export default memo(function ShelfRow({
  manga,
  trackBy,
  latestChapter,
  latestVolume,
  selecting = false,
  checked = false,
  onToggle,
  onSelectSeveral,
}: {
  manga: Manga;
  trackBy: TrackBy;
  latestChapter?: number | null;
  latestVolume?: number | null;
  // Select is on, and whether this row is picked
  selecting?: boolean;
  checked?: boolean;
  onToggle?: (id: number) => void;
  // "Select several" from the menu
  onSelectSeveral?: (id: number) => void;
}) {
  const select = selecting
    ? { checked, onToggle: () => onToggle?.(manga.id) }
    : undefined;
  const onLongPress = () => onSelectSeveral?.(manga.id);
  const c = useColors();
  const ripple = useRipple();
  // Android's menu is opened from the row's own long press (the row takes
  // the touch before the menu's view sees it); an iPhone's opens itself
  const menu = useRef<MenuComponentRef>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { unit, reading, knownTotal } = progressOf(
    manga,
    tracksOf(manga, trackBy),
    latestChapter ?? manga.latestChapter,
    latestVolume,
  );
  // where they are, said on the right of every row: with its bar when the
  // total is known, on its own when it isn't
  const place = manga.planned ? "to read" : placeText(manga, trackBy);
  const kindLine = rowKindLine(manga);
  const rating = Number(manga.rating) || 0;

  const row = (
    <Tap
      android_ripple={ripple}
      onPress={select?.onToggle}
      onLongPress={
        select || Platform.OS !== "android"
          ? undefined
          : () => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSheetOpen(true);
            }
      }
      delayLongPress={400}
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
          unit={unit}
          reading={reading}
          knownTotal={knownTotal}
          place={place}
        />
      </View>
    </Tap>
  );
  const act = (id: string) => {
    if (id === "edit") router.push(`/edit/${manga.id}`);
    else if (id === "select") onLongPress();
    else if (id === "delete") askToDelete(manga);
    else if (id.startsWith("move:"))
      void useShelf
        .getState()
        .moveMany([manga.id], id.slice("move:".length) as ShelfStatus);
  };
  if (select) return row;
  if (Platform.OS === "android")
    return (
      <>
        <Link href={`/details/${manga.id}`} asChild>
          {row}
        </Link>
        <MenuSheet
          open={sheetOpen}
          title={manga.name}
          items={menuActions(manga).map((a) => ({
            label: a.title,
            danger: a.id === "delete",
            onPress: () => act(a.id ?? ""),
          }))}
          onClose={() => setSheetOpen(false)}
        />
      </>
    );
  return (
    <MenuView
      ref={menu}
      title={manga.name}
      shouldOpenOnLongPress
      actions={menuActions(manga)}
      onPressAction={({ nativeEvent }) => {
        void Haptics.selectionAsync();
        act(nativeEvent.event ?? "");
      }}
    >
      <Link href={`/details/${manga.id}`} asChild>
        {row}
      </Link>
    </MenuView>
  );
});

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

// the right of a row, reading only: "Finished", how far through with a
// bar under it, or just the place when the total isn't known (web MangaCard RowProgress)
function RowProgress({
  finished,
  unit,
  reading,
  knownTotal,
  place,
}: {
  finished: boolean;
  unit: "ch." | "vol.";
  reading: number;
  knownTotal: number | null;
  // "ch. 100" or "to read": said alone when there's no total for a bar
  place: string | null;
}) {
  const text = "font-mono text-[12px] text-ink-soft text-right";
  if (finished) return <Text className={text}>Finished</Text>;
  if (knownTotal == null || reading <= 0)
    return place ? (
      <Text numberOfLines={1} className={text}>
        {place}
      </Text>
    ) : null;
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
