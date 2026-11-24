// Settings, Account: the readers they've blocked, each with Unblock (the
// web's Settings BlockedSection; server blocks/blocks.ts). Blocking itself is
// done on a review or on a shared shelf
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Avatar from "../Avatar";
import Button from "../Button";
import {
  getBlocks,
  unblockReader,
  type BlockedReader,
} from "@/core/lib/blocks";
import { orOffline } from "@/core/lib/offline";
import { Help, Note, Section } from "./parts";

export default function BlockedReaders() {
  const [blocks, setBlocks] = useState<BlockedReader[] | null>(null);
  const [failed, setFailed] = useState("");
  useEffect(() => {
    getBlocks()
      .then(setBlocks)
      .catch(() => setFailed(orOffline("Couldn't load them. Try again.")));
  }, []);
  const unblock = async (id: number) => {
    setFailed("");
    try {
      await unblockReader(id);
      setBlocks((now) => now?.filter((b) => b.id !== id) ?? null);
    } catch (e) {
      setFailed((e as Error).message);
    }
  };
  return (
    <Section title="Blocked readers">
      <Help>
        You don't see their reviews, and neither of you can open or follow the
        other's shared shelf. To block someone, tap Block on one of their
        reviews or on their shared shelf.
      </Help>
      {blocks && blocks.length === 0 ? <Help>Nobody is blocked.</Help> : null}
      {blocks?.map((b, i) => (
        <View
          key={b.id}
          className={`min-h-[52px] flex-row items-center gap-3 ${i > 0 ? "border-t border-dashed border-line-soft" : ""}`}
        >
          <Avatar id={b.avatar} size={32} border={2} />
          <Text className="min-w-0 flex-1 font-body-semibold text-[15px] text-ink">
            {b.name}
          </Text>
          <Button small label="Unblock" onPress={() => void unblock(b.id)} />
        </View>
      ))}
      {failed ? <Note text={failed} failed /> : null}
    </Section>
  );
}
