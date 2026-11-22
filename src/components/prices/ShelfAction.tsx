// On a volume's price page, where it stands on their shelf (the web's
// pages/Prices/ShelfAction.tsx): On your shelf with "I own Vol. 7" (and its
// Undo), or for a series not on the shelf yet, Add to my to-read and "I own
// Vol. 7" through the add form, and the To buy button
import PressScale from "@/components/PressScale";
import { look } from "@/lib/platformLook";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { newBook } from "@/core/lib/books";
import { saveBooks } from "@/core/lib/booksApi";
import {
  ownedOf,
  ownedVolumes,
  owns,
  withVolume,
} from "@/core/lib/ownedVolumes";
import { novelParts } from "@/core/lib/prices";
import { findOnShelf, setVolumesOwned, type Owned } from "@/core/lib/shelf";
import type { ShelfMatch } from "@/core/lib/types";
import { useShelf } from "@/store/shelf";
import { loadToBuyOnce, useToBuy } from "@/store/toBuy";
import Button from "../Button";
import ToReadButton from "./ToReadButton";

const UNDO_MS = 6000;

// "+ To buy", and "See the list" once it's on (the web's ToBuyButton)
export function ToBuyButton({ isbn13 }: { isbn13: string }) {
  const list = useToBuy((s) => s.list);
  const add = useToBuy((s) => s.add);
  const remove = useToBuy((s) => s.remove);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => loadToBuyOnce(), []);
  const onList = Boolean(list?.items.some((item) => item.isbn13 === isbn13));
  const toggle = async () => {
    setSaving(true);
    setError("");
    try {
      await (onList ? remove(isbn13) : add(isbn13));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <View className="flex-1 gap-1">
      <PressScale
        onPress={() => void toggle()}
        disabled={saving || !list}
        accessibilityRole="button"
        accessibilityState={{ selected: onList }}
        style={{ opacity: saving ? 0.6 : 1 }}
        className={`min-h-[36px] items-center justify-center overflow-hidden px-3.5 py-2 ${look.buttonRadius} ${onList ? "border border-award-new bg-award-new/15" : "bg-award-new"}`}
      >
        <Text
          numberOfLines={1}
          className={`font-body-semibold text-[14px] ${onList ? "text-award-new" : "text-on-award-new"}`}
        >
          {onList ? "On To buy" : "+ To buy"}
        </Text>
      </PressScale>
      {error ? (
        <Text className="font-body text-[13px] text-accent">{error}</Text>
      ) : null}
    </View>
  );
}

export default function ShelfAction({
  isbn13,
  series,
  title,
  volume,
  editionBook,
  alsoCalled,
}: {
  isbn13: string;
  series: string;
  title: string;
  volume: number | null;
  editionBook?: { name: string; title: string; holds: number[] | null };
  alsoCalled?: string;
}) {
  const [match, setMatch] = useState<{
    series: string | null;
    manga: ShelfMatch;
  }>({ series: null, manga: null });
  const [undo, setUndo] = useState<{ previous: Owned; what: string } | null>(
    null,
  );
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const undoTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const shelfSize = useShelf((s) => s.manga?.length ?? 0);
  useEffect(() => {
    const controller = new AbortController();
    findOnShelf(series, controller.signal, alsoCalled)
      .then((manga) => setMatch({ series, manga }))
      .catch((e) => {
        if ((e as Error).name !== "AbortError")
          setMatch({ series, manga: null });
      });
    return () => controller.abort();
  }, [series, alsoCalled, shelfSize]);
  useEffect(() => () => clearTimeout(undoTimer.current), []);
  if (match.series !== series) return <View className="h-[40px]" />;

  const manga = match.manga;
  if (!manga) {
    const novel = novelParts(title);
    const params: Record<string, string> = { title: novel.title };
    if (novel.lightNovel) params.format = "novel";
    if (volume != null) params.ownedVolume = String(volume);
    return (
      <View className="gap-2">
        <ToReadButton name={title} cover={null} />
        <View className="flex-row gap-2.5">
          {volume != null && !editionBook ? (
            <Button
              grow
              label={`I own Vol. ${volume}`}
              small
              onPress={() => router.push({ pathname: "/add", params })}
            />
          ) : null}
          {editionBook?.holds?.length ? (
            <Button
              grow
              label={`I own ${editionBook.name}`}
              small
              onPress={() =>
                router.push({
                  pathname: "/add",
                  params: {
                    title,
                    ownedVolumes: editionBook.holds!.join(","),
                    bookTitle: editionBook.title,
                    bookIsbn: isbn13,
                  },
                })
              }
            />
          ) : null}
          <ToBuyButton isbn13={isbn13} />
        </View>
      </View>
    );
  }

  const holds = editionBook
    ? editionBook.holds
    : volume != null
      ? [volume]
      : null;
  const thing = editionBook?.name ?? (volume != null ? `Vol. ${volume}` : null);
  const ownsThis = Boolean(holds?.length && holds.every((v) => owns(manga, v)));
  const before: Owned = {
    volumesOwned: manga.volumesOwned,
    ownedList: manga.ownedList ?? [],
  };
  const setOwned = async (next: Owned, tapped?: string) => {
    setSaving(true);
    setFailed(false);
    try {
      const saved = await setVolumesOwned(manga.id, next);
      setMatch({ series, manga: { ...manga, ...saved } });
      clearTimeout(undoTimer.current);
      if (tapped !== undefined) {
        setUndo({ previous: before, what: tapped });
        if (editionBook?.holds)
          void saveBooks(manga.id, [
            newBook(editionBook.title, editionBook.holds, isbn13),
          ]);
        undoTimer.current = setTimeout(() => setUndo(null), UNDO_MS);
      } else setUndo(null);
      void useShelf.getState().load();
    } catch {
      setFailed(true);
    } finally {
      setSaving(false);
    }
  };
  const openSeries = () =>
    router.push({
      pathname: "/details/[id]",
      params: { id: String(manga.id) },
    });
  return (
    <View className="gap-2">
      <Pressable onPress={openSeries} hitSlop={6} className="self-start">
        <Text className="font-body text-[14px] text-ink-soft underline">
          On your shelf
        </Text>
      </Pressable>
      <View className="flex-row gap-2.5">
        {holds?.length && thing && !ownsThis ? (
          <Button
            grow
            label={saving ? "Saving…" : `I own ${thing}`}
            kind="primary"
            small
            disabled={saving}
            onPress={() =>
              void setOwned(
                editionBook
                  ? ownedVolumes(null, [...ownedOf(manga), ...holds])
                  : withVolume(manga, holds[0]!),
                editionBook ? thing : `vol. ${holds[0]}`,
              )
            }
          />
        ) : (
          <Button
            grow
            label={ownsThis && thing ? `You own ${thing}` : "On your shelf"}
            small
            onPress={openSeries}
          />
        )}
        {!ownsThis ? <ToBuyButton isbn13={isbn13} /> : null}
      </View>
      {failed ? (
        <Text className="font-body text-[13.5px] text-accent">
          That didn't save. Try again.
        </Text>
      ) : null}
      {!failed && undo ? (
        <Text className="font-body text-[13.5px] text-ink-soft">
          Shelf updated: {undo.what} is yours.{" "}
          <Text
            className="font-body-semibold text-ink underline"
            onPress={() => void setOwned(undo.previous)}
          >
            Undo
          </Text>
        </Text>
      ) : null}
    </View>
  );
}
