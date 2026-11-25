// What a New card opens (the web's pages/Home/ReleaseModal.tsx): the volumes
// (or an edition's books) they're behind, each a way to its prices; for a
// chapter reader, the books their next chapters are in, and chapters no
// English volume holds yet. As on the phone's web app the rows stack up from
// the foot: what they have at the bottom, the next volume just above it,
// later ones further up, so the sheet opens at its foot and the top is a
// drag away; at the top, one more drag down closes it (Sheet)
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { bookName } from "@/core/lib/bookName";
import { chaptersText } from "@/core/lib/chapterWords";
import { volumesToGet } from "@/core/lib/releaseMath";
import type { Manga, ReleaseStatus } from "@/core/lib/types";
import Button from "./Button";
import Sheet from "./Sheet";

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

type Row = {
  key: string;
  label: string;
  note?: string | null;
  isbn13?: string | null;
};

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
  // in the list's own order, first to last; drawn from the foot up
  const rows: Row[] = [
    ...books.map((b) => ({
      key: `b${b.label}`,
      label: b.label,
      note: b.chapters ? chaptersText(b.chapters) : null,
      isbn13: b.isbn13,
    })),
    ...editionBooks.map((b) => ({
      key: `e${b.number}`,
      label: bookName(edition!.label, b.number),
      isbn13: b.isbn13,
    })),
    ...volumes.map((v) => ({
      key: `v${v.volume}`,
      label: `Vol. ${v.volume}`,
      isbn13: v.isbn13,
    })),
  ];
  const tail = pastEnglish
    ? notInEnglishYet(pastEnglish)
    : byChapter && !books.length && found.nextChapter != null
      ? cantTellYet(found.nextChapter, found.latestChapter ?? found.nextChapter)
      : null;
  return (
    <Sheet open onClose={onClose} fromTheFoot contentClassName="px-5 pb-6">
      <View className="flex-row items-center justify-between gap-3 pt-1 pb-2">
        <Text className="flex-1 font-display text-[19px] text-ink">
          {title}
        </Text>
        <Button label="Close" small onPress={onClose} />
      </View>
      {/* the top of the sheet: what no English volume holds yet */}
      {tail ? (
        <Text className="pb-2 font-body text-[14px] text-ink-soft">{tail}</Text>
      ) : null}
      {[...rows].reverse().map((row) => (
        <Tap
          key={row.key}
          onPress={row.isbn13 ? () => open(row.isbn13!) : undefined}
          disabled={!row.isbn13}
          needsConnection={Boolean(row.isbn13)}
          className="flex-row items-baseline gap-2 border-t border-dotted border-line-soft py-2.5"
        >
          <Text
            className={`font-body-semibold text-[15px] ${row.isbn13 ? "text-ink underline" : "text-ink-soft"}`}
          >
            {row.label}
          </Text>
          {row.note ? (
            <Text className="font-mono text-[12.5px] text-muted">
              · {row.note}
            </Text>
          ) : null}
        </Tap>
      ))}
      {/* the foot: what they have */}
      {yours ? (
        <Text className="pt-2 font-body text-[14px] text-ink-soft">
          {yours}
        </Text>
      ) : null}
    </Sheet>
  );
}
