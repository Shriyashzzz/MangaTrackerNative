// Blocked readers, every one (the web's pages/Blocked): newest first, each
// with Unblock, which asks first. Settings, Account shows the newest few and
// links here. A long list scrolls smoothly (only the rows on screen are
// drawn) and gets the header's search bar
import { useEffect, useState } from "react";
import { Alert, FlatList, Text, View } from "react-native";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import Page, { P } from "@/components/Page";
import {
  blocksMatching,
  getBlocks,
  SEARCH_FROM,
  unblockAsk,
  unblockReader,
  type BlockedReader,
} from "@/core/lib/blocks";
import { orOffline } from "@/core/lib/offline";
import { columnStyle } from "@/lib/wide";

export default function BlockedScreen() {
  const [blocks, setBlocks] = useState<BlockedReader[] | null>(null);
  const [typed, setTyped] = useState("");
  const [note, setNote] = useState("");
  useEffect(() => {
    getBlocks()
      .then((r) => setBlocks(r.blocks))
      .catch(() => setNote(orOffline("They didn't load. Try again.")));
  }, []);
  const unblock = (b: BlockedReader) =>
    Alert.alert("Unblock?", unblockAsk(b.name), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: () => {
          setNote("");
          unblockReader(b.id)
            .then(() =>
              setBlocks((now) => now?.filter((x) => x.id !== b.id) ?? null),
            )
            .catch((e: Error) => setNote(e.message));
        },
      },
    ]);
  const shown = blocks ? blocksMatching(blocks, typed) : [];
  return (
    <Page
      title="Blocked readers"
      scroll={false}
      search={
        blocks && blocks.length >= SEARCH_FROM
          ? { placeholder: "Search blocked readers", onChangeText: setTyped }
          : undefined
      }
    >
      <FlatList
        data={shown}
        keyExtractor={(b) => String(b.id)}
        contentInsetAdjustmentBehavior="automatic"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          ...columnStyle,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 48,
        }}
        ListHeaderComponent={
          <View className="gap-2 pb-2">
            <P muted>
              You don't see their reviews, and neither of you can open or follow
              the other's shared shelf. They aren't told.
            </P>
            {note ? (
              <Text className="font-body text-[14px] text-accent">{note}</Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          blocks ? (
            <P muted>
              {blocks.length === 0
                ? "Nobody is blocked."
                : "No blocked reader goes by that name."}
            </P>
          ) : undefined
        }
        ItemSeparatorComponent={() => (
          <View className="h-px border-t border-dashed border-line-soft" />
        )}
        renderItem={({ item: b }) => (
          <View className="min-h-[56px] flex-row items-center gap-3">
            <Avatar id={b.avatar} size={36} border={2} />
            {/* a long name stays on one line, so every row keeps its height */}
            <Text
              numberOfLines={1}
              className="min-w-0 flex-1 font-body-semibold text-[15px] text-ink"
            >
              {b.name}
            </Text>
            <Button small label="Unblock" onPress={() => unblock(b)} />
          </View>
        )}
      />
    </Page>
  );
}
