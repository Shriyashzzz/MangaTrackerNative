// Friends, as the web's pages/Friends/Friends.tsx: the shared shelves they
// follow, each a way to that shelf, with Unfollow
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import Mascot from "@/components/Mascot";
import Page, { P } from "@/components/Page";
import { getFriends, setFollowing, type Friend } from "@/core/lib/friends";

const count = (n: number, one: string, more: string) =>
  `${n.toLocaleString("en-US")} ${n === 1 ? one : more}`;

export default function FriendsScreen() {
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [note, setNote] = useState("");
  useEffect(() => {
    getFriends()
      .then(setFriends)
      .catch(() => setNote("Your friends didn't load. Try again."));
  }, []);
  const unfollow = async (friend: Friend) => {
    setNote("");
    try {
      await setFollowing(friend.code, false);
      setFriends((list) => list?.filter((f) => f.code !== friend.code) ?? null);
    } catch (e) {
      setNote((e as Error).message);
    }
  };
  return (
    <Page title="Friends" center={friends?.length === 0}>
      {note ? <P>{note}</P> : null}
      {friends && friends.length === 0 ? (
        <View className="items-center gap-3 py-6">
          <Mascot mood="confused" width={100} />
          <Text className="text-center font-body text-[15px] leading-[22px] text-ink-soft">
            No one yet.{"\n"}Ask a friend for their shelf link, open it and
            press Follow.
          </Text>
        </View>
      ) : null}
      {friends?.map((friend) => (
        <View
          key={friend.code}
          className="flex-row items-center gap-3 border-b border-dashed border-line-soft pb-3"
        >
          <Pressable
            onPress={() =>
              router.push({
                pathname: "/u/[code]",
                params: { code: friend.code },
              })
            }
            className="min-w-0 flex-1"
          >
            <Text className="font-body-semibold text-[16px] text-ink border-b pb-[2px] border-ink self-start">
              {friend.name}
            </Text>
            <Text className="font-mono text-[12.5px] text-muted">
              {count(friend.series, "series", "series")} ·{" "}
              {count(friend.volumes, "volume", "volumes")}
            </Text>
          </Pressable>
          <Pressable onPress={() => void unfollow(friend)} hitSlop={6}>
            <Text className="font-body-medium text-[14px] text-ink-soft border-b pb-[2px] border-ink-soft self-start">
              Unfollow
            </Text>
          </Pressable>
        </View>
      ))}
    </Page>
  );
}
