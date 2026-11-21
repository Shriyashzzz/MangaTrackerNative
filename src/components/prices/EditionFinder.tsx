// "Which book has volume 23?" (the web's EditionFinder): the book of each
// edition that holds the volume typed, each a way to its prices
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { lookUpVolume, type LookupLine } from "@/core/lib/editionLookup";
import { openWebPath } from "@/lib/webRoutes";
import { Input } from "../Field";

export default function EditionFinder({
  lines,
  startAt,
  onVolume,
}: {
  lines: LookupLine[];
  startAt: number | null;
  onVolume?: (volume: number | null) => void;
}) {
  const [typed, setTyped] = useState(startAt == null ? "" : String(startAt));
  const volume = /^\d{1,4}$/.test(typed.trim()) ? Number(typed) : null;
  const answers = volume ? lookUpVolume(lines, volume) : [];
  return (
    <View className="gap-2">
      <View className="flex-row items-center gap-2">
        <Text className="font-body text-[14.5px] text-ink">
          Which book has volume
        </Text>
        <Input
          value={typed}
          onChangeText={(t) => {
            setTyped(t);
            onVolume?.(/^\d{1,4}$/.test(t.trim()) ? Number(t) : null);
          }}
          keyboardType="number-pad"
          placeholder="23"
          className="min-h-[40px] w-[70px] text-center font-mono"
        />
        <Text className="font-body text-[14.5px] text-ink">?</Text>
        {startAt != null && volume === startAt ? (
          <Text className="font-mono text-[11.5px] text-muted">your next</Text>
        ) : null}
      </View>
      {volume != null
        ? answers.map(({ line, book }) => (
            <View
              key={line.key}
              className="flex-row flex-wrap items-baseline gap-x-2"
            >
              <Text className="font-body text-[14px] text-ink-soft">
                {line.label}:
              </Text>
              {book ? (
                <Pressable
                  onPress={
                    book.path ? () => openWebPath(book.path!) : undefined
                  }
                  disabled={!book.path}
                  hitSlop={6}
                >
                  <Text
                    className={`font-body-semibold text-[14px] ${book.path ? "text-ink underline" : "text-ink-soft"}`}
                  >
                    {book.name}
                    {book.coming ? (
                      <Text className="font-body text-muted">
                        {" "}
                        · out {book.coming}
                      </Text>
                    ) : null}
                  </Text>
                </Pressable>
              ) : (
                <Text className="font-body text-[14px] text-ink-soft">
                  No {line.label} book holds vol. {volume}
                </Text>
              )}
            </View>
          ))
        : null}
      <Pressable
        onPress={() => router.push("/editions")}
        hitSlop={6}
        className="self-start"
      >
        <Text className="font-body text-[13px] text-muted underline">
          Every series with other editions →
        </Text>
      </Pressable>
    </View>
  );
}
