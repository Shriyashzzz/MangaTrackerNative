// An edition's books as tiles (the web's pages/Prices/BookTiles.tsx): each
// book's number and the volumes it holds, inked in when on their shelf,
// dashed when still coming, ringed when it answers "which book has vol. N"
import { Pressable, Text, View } from "react-native";
import {
  bookPath,
  shownBooks,
  type LookupLine,
} from "@/core/lib/editionLookup";
import { rangesText } from "@/core/lib/ownedVolumes";
import { openWebPath } from "@/lib/webRoutes";

export default function BookTiles({
  line,
  volume = null,
  owned = [],
}: {
  line: LookupLine;
  volume?: number | null;
  owned?: number[];
}) {
  const mine = new Set(owned);
  const books = shownBooks(line);
  const anyOwned = books.some((b) => b.volumes.every((v) => mine.has(v)));
  const anyComing = books.some((b) => b.coming);
  return (
    <View className="gap-2">
      <View className="flex-row flex-wrap gap-2">
        {books.map((book) => {
          const ownsAll = book.volumes.every((v) => mine.has(v));
          const path = bookPath(book);
          const answer = volume != null && book.volumes.includes(volume);
          return (
            <Pressable
              key={book.number}
              onPress={path ? () => openWebPath(path) : undefined}
              disabled={!path}
              accessibilityLabel={`${line.label} ${book.number}: ${book.volumes.length === 1 ? "vol." : "vols."} ${rangesText(book.volumes)}${ownsAll ? ", on your shelf" : ""}${book.coming ? `, out ${book.coming}` : ""}`}
              className={`min-w-[56px] items-center rounded-[3px] border-[1.5px] px-2 py-1.5 ${ownsAll ? "border-line bg-ink" : book.coming ? "border-dashed border-line-soft" : "border-line bg-card"} ${answer ? "border-2 border-accent" : ""}`}
            >
              <Text
                className={`font-brand pr-[4px] text-[18px] ${ownsAll ? "text-paper" : "text-ink"}`}
              >
                {book.number}
              </Text>
              <Text
                className={`font-mono text-[10.5px] ${ownsAll ? "text-paper" : "text-muted"}`}
              >
                {rangesText(book.volumes)}
              </Text>
              {book.coming ? (
                <Text className="font-mono text-[10px] text-muted">
                  {book.coming.replace(/ \d+,/, "")}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>
      {anyOwned || anyComing ? (
        <Text className="font-body text-[12.5px] text-muted">
          {[
            anyOwned && "Inked in: on your shelf",
            anyComing && "Dashed: coming",
          ]
            .filter(Boolean)
            .join(" · ")}
        </Text>
      ) : null}
    </View>
  );
}
