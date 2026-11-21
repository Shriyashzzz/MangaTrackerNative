// What a New card opens (the web's pages/Home/ReleaseModal.tsx): the volumes
// (or an edition's books) they're behind, each a way to its prices; for a
// chapter reader, the books their next chapters are in, and chapters no
// English volume holds yet
import { router } from "expo-router";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { bookName } from "@/core/lib/bookName";
import { chaptersText } from "@/core/lib/chapterWords";
import { volumesToGet } from "@/core/lib/releaseMath";
import type { Manga, ReleaseStatus } from "@/core/lib/types";
import Button from "./Button";

const count = (n: number) => n.toLocaleString("en-US");
const cantTellYet = (from: number, to: number) =>
  from === to
    ? `Ch. ${count(from)} is out. We can't tell yet if it's in an English volume.`
    : `Ch. ${count(from)}–${count(to)} are out. We can't tell yet if they're in an English volume.`;
function notInEnglishYet(
  past: NonNullable<ReleaseStatus["chaptersPastEnglish"]>,
) {
  const { volume, endsAt, from, to } = past;
  const ends =
    volume != null && endsAt != null
      ? `Vol. ${volume} ends at ch. ${count(endsAt)}.`
      : "";
  const out =
    from === to
      ? `Ch. ${count(from)} is out, but it isn't in an English volume yet.`
      : `Ch. ${count(from)}–${count(to)} are out, but they aren't in an English volume yet.`;
  return ends ? `${ends} ${out}` : out;
}

export default function ReleaseModal({
  manga,
  found,
  yours,
  kind = "volumes",
  onClose,
}: {
  manga: Manga;
  found: ReleaseStatus;
  yours?: string;
  kind?: "volumes" | "chapters";
  onClose: () => void;
}) {
  const byChapter = kind === "chapters";
  const edition = byChapter ? null : (found.editionBooks ?? null);
  const editionBooks = edition?.toGet ?? [];
  const volumes = byChapter || edition ? [] : volumesToGet(found);
  const books = byChapter ? (found.chapterBooks ?? []) : [];
  const pastEnglish = byChapter ? (found.chaptersPastEnglish ?? null) : null;
  let title = `${manga.name}: ${volumes.length} ${volumes.length === 1 ? "volume" : "volumes"} behind`;
  if (byChapter)
    title = `${manga.name}: ch. ${count(found.nextChapter ?? 0)} next`;
  else if (edition)
    title = `${manga.name}: ${editionBooks.length} ${editionBooks.length === 1 ? "book" : "books"} behind`;
  const open = (isbn13: string) => {
    onClose();
    router.push(`/prices/${isbn13}`);
  };
  const Row = ({
    label,
    note,
    isbn13,
  }: {
    label: string;
    note?: string | null;
    isbn13?: string | null;
  }) => (
    <Pressable
      onPress={isbn13 ? () => open(isbn13) : undefined}
      disabled={!isbn13}
      className="flex-row items-baseline gap-2 border-b border-dotted border-line-soft py-2.5"
    >
      <Text
        className={`font-body-semibold text-[15px] ${isbn13 ? "text-ink underline" : "text-ink-soft"}`}
      >
        {label}
      </Text>
      {note ? (
        <Text className="font-mono text-[12.5px] text-muted">· {note}</Text>
      ) : null}
    </Pressable>
  );
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View className="max-h-[80%] rounded-t-2xl bg-card">
        <View className="flex-row items-center justify-between gap-3 px-5 pt-4 pb-2">
          <Text className="flex-1 font-display text-[19px] text-ink">
            {title}
          </Text>
          <Button label="Close" small onPress={onClose} />
        </View>
        <ScrollView contentContainerClassName="px-5 pb-8">
          {yours ? (
            <Text className="pb-1 font-body text-[14px] text-ink-soft">
              {yours}
            </Text>
          ) : null}
          {books.map((b) => (
            <Row
              key={b.label}
              label={b.label}
              note={b.chapters ? chaptersText(b.chapters) : null}
              isbn13={b.isbn13}
            />
          ))}
          {editionBooks.map((b) => (
            <Row
              key={b.number}
              label={bookName(edition!.label, b.number)}
              isbn13={b.isbn13}
            />
          ))}
          {volumes.map((v) => (
            <Row key={v.volume} label={`Vol. ${v.volume}`} isbn13={v.isbn13} />
          ))}
          {pastEnglish ? (
            <Text className="pt-3 font-body text-[14px] text-ink-soft">
              {notInEnglishYet(pastEnglish)}
            </Text>
          ) : null}
          {byChapter &&
          !pastEnglish &&
          !books.length &&
          found.nextChapter != null ? (
            <Text className="pt-3 font-body text-[14px] text-ink-soft">
              {cantTellYet(
                found.nextChapter,
                found.latestChapter ?? found.nextChapter,
              )}
            </Text>
          ) : null}
        </ScrollView>
      </View>
    </Modal>
  );
}
