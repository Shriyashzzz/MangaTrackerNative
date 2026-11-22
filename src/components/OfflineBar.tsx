// A strip along the foot of the app when there's no connection, or when
// changes kept on the phone have just been sent (the web's offlineBar):
// what's going on in one line, so a save that didn't reach the server is
// never a mystery. Gone when there's nothing to say
import { useEffect } from "react";
import { AppState, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { checkConnection, useIsOffline } from "@/core/lib/offline";
import {
  clearChangesNote,
  sendChanges,
  startSendingChanges,
  useOfflineChanges,
} from "@/core/lib/offlineChanges";

// how long "3 changes saved" stays before it clears itself
const NOTE_SHOWN_MS = 6000;

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

  const changes = `${waiting} ${waiting === 1 ? "change" : "changes"}`;
  const said = offline
    ? waiting
      ? `You're offline. ${changes} kept on this phone.`
      : "You're offline. What you change is kept and sent later."
    : sending
      ? `Sending ${changes}…`
      : (note ?? (waiting ? `${changes} waiting to be sent.` : null));
  if (!said) return null;

  return (
    <View
      accessibilityRole="alert"
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
      ) : null}
    </View>
  );
}
