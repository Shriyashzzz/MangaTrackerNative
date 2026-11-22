// A strip along the foot of the app when there's no connection, or when
// changes kept on the phone have just been sent (the web's offlineBar):
// what's going on in one line, so a save that didn't reach the server is
// never a mystery. Gone when there's nothing to say. With changes waiting, a
// tap opens the list of them; on a page that can't work offline it says so
// before a tap fails
import { usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { checkConnection, useIsOffline } from "@/core/lib/offline";
import {
  clearChangesNote,
  sendChanges,
  startSendingChanges,
  useOfflineChanges,
  waitingChanges,
  type OfflineChange,
} from "@/core/lib/offlineChanges";
import { inOrder } from "@/core/lib/offlineChangeRules";
import { changeWords } from "@/lib/changeWords";
import { useShelf } from "@/store/shelf";
import Sheet from "./Sheet";

// how long "3 changes saved" stays before it clears itself
const NOTE_SHOWN_MS = 6000;

// pages that can't do their job with no connection, and what to say on them
const NEEDS_CONNECTION: [start: string, said: string][] = [
  ["/add", "Adding a series needs a connection."],
  ["/import", "Importing a list needs a connection."],
  ["/scan", "Scanning a book needs a connection."],
  ["/to-buy", "Changes to this list need a connection."],
  ["/prices", "Prices are as you last saw them."],
];

export default function OfflineBar({ signedIn }: { signedIn: boolean }) {
  const insets = useSafeAreaInsets();
  const offline = useIsOffline();
  const waiting = useOfflineChanges((s) => s.waiting);
  const sending = useOfflineChanges((s) => s.sending);
  const note = useOfflineChanges((s) => s.note);

  // signed in: anything waiting goes now, and whenever the connection is
  // back. The app coming to the front asks whether it is
  useEffect(() => {
    if (!signedIn) return;
    startSendingChanges();
    const watching = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      void checkConnection().then(() => sendChanges());
    });
    return () => watching.remove();
  }, [signedIn]);
  useEffect(() => {
    if (!note) return;
    const timer = setTimeout(clearChangesNote, NOTE_SHOWN_MS);
    return () => clearTimeout(timer);
  }, [note]);

  // the changes waiting, read when the list is opened
  const [listed, setListed] = useState<OfflineChange[] | null>(null);
  const shelf = useShelf((state) => state.manga);
  const openList = async () => setListed(inOrder(await waitingChanges()));
  const path = usePathname();
  const here = NEEDS_CONNECTION.find(([start]) => path.startsWith(start));

  const changes = `${waiting} ${waiting === 1 ? "change" : "changes"}`;
  const said = offline
    ? waiting
      ? `You're offline. ${changes} kept on this phone.`
      : here
        ? `You're offline. ${here[1]}`
        : "You're offline. What you change is kept and sent later."
    : sending
      ? `Sending ${changes}…`
      : (note ?? (waiting ? `${changes} waiting to be sent.` : null));
  if (!said) return null;

  const canOpen = waiting > 0;
  return (
    <>
      <Pressable
        accessibilityRole={canOpen ? "button" : "alert"}
        accessibilityHint={canOpen ? "Shows the changes waiting" : undefined}
        disabled={!canOpen}
        onPress={() => void openList()}
        className="flex-row items-center gap-3 border-t border-line-soft bg-card px-4 pt-2"
        style={{ paddingBottom: Math.max(insets.bottom, 8) }}
      >
        <View
          className={`h-2 w-2 rounded-full ${offline ? "bg-accent" : "bg-ok"}`}
        />
        <Text className="min-w-0 flex-1 font-body text-[13.5px] text-ink">
          {said}
        </Text>
        {!offline && waiting && !sending ? (
          <Pressable onPress={() => void sendChanges()} hitSlop={8}>
            <Text className="font-body-semibold text-[13.5px] text-accent-ink">
              Send now
            </Text>
          </Pressable>
        ) : canOpen ? (
          <Text className="font-body-semibold text-[13.5px] text-accent-ink">
            See
          </Text>
        ) : null}
      </Pressable>
      <Sheet
        open={listed !== null}
        onClose={() => setListed(null)}
        scroll
        contentClassName="px-5 pb-8"
      >
        <Text className="font-display text-[20px] text-ink">
          Kept on this phone
        </Text>
        <Text className="pt-1 pb-3 font-body text-[14px] text-ink-soft">
          {offline
            ? "These are sent when you're back online."
            : "These are on their way."}
        </Text>
        {(listed ?? []).map((change) => (
          <View
            key={change.key}
            className="border-t border-dotted border-line-soft py-2.5"
          >
            <Text
              numberOfLines={1}
              className="font-body-medium text-[15px] text-ink"
            >
              {shelf?.find((m) => m.id === change.mangaId)?.name ?? "A series"}
            </Text>
            <Text className="font-body text-[13.5px] text-muted">
              {changeWords(change)}
            </Text>
          </View>
        ))}
      </Sheet>
    </>
  );
}
