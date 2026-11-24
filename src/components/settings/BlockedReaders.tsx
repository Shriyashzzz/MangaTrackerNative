// Settings, Account: the readers they've blocked, the newest few with
// Unblock (which asks first), and the way to the rest (app/blocked.tsx).
// Blocking itself is done on a review or on a shared shelf
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Alert, Text, View } from "react-native";
import Avatar from "../Avatar";
import Button from "../Button";
import Tap from "../Tap";
import {
  BLOCKS_SHOWN,
  getBlocks,
  unblockAsk,
  unblockReader,
  type BlockList,
  type BlockedReader,
} from "@/core/lib/blocks";
import { orOffline } from "@/core/lib/offline";
import { Help, Note, Section } from "./parts";

export default function BlockedReaders() {
  const [list, setList] = useState<BlockList | null>(null);
  const [failed, setFailed] = useState("");
  const load = () =>
    getBlocks(BLOCKS_SHOWN)
      .then(setList)
      .catch(() => setFailed(orOffline("Couldn't load them. Try again.")));
  useEffect(() => {
    void load();
  }, []);
  const unblock = (b: BlockedReader) =>
    Alert.alert("Unblock?", unblockAsk(b.name), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Unblock",
        onPress: () => {
          setFailed("");
          // the next one along moves up into the few shown
          unblockReader(b.id)
            .then(load)
            .catch((e: Error) => setFailed(e.message));
        },
      },
    ]);
  return (
    <Section title="Blocked readers">
      <Help>
        You don't see their reviews, and neither of you can open or follow the
        other's shared shelf. To block someone, tap Block on one of their
        reviews or on their shared shelf.
      </Help>
      {list && list.total === 0 ? <Help>Nobody is blocked.</Help> : null}
      {list?.blocks.map((b, i) => (
        <View
          key={b.id}
          className={`min-h-[52px] flex-row items-center gap-3 ${i > 0 ? "border-t border-dashed border-line-soft" : ""}`}
        >
          <Avatar id={b.avatar} size={32} border={2} />
          {/* a long name stays on one line */}
          <Text
            numberOfLines={1}
            className="min-w-0 flex-1 font-body-semibold text-[15px] text-ink"
          >
            {b.name}
          </Text>
          <Button small label="Unblock" onPress={() => unblock(b)} />
        </View>
      ))}
      {list && list.total > list.blocks.length ? (
        <Tap
          onPress={() => router.push("/blocked")}
          accessibilityRole="link"
          className="self-start py-1"
        >
          <Text className="font-body-semibold text-[15px] text-ink underline">
            See all {list.total.toLocaleString("en-US")} blocked readers →
          </Text>
        </Tap>
      ) : null}
      {failed ? <Note text={failed} failed /> : null}
    </Section>
  );
}
