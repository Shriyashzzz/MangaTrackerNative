// What opens a price page needs the connection: offline, it's greyed and
// does nothing, until the connection is back. The one rule for every way
// to a price page. (The Prices tab still opens: offline, it says so)
//   Tap: its needsConnection prop
//   text links and buttons: useNeedsConnection, spread on the element
import { useIsOffline } from "@/core/lib/offline";

export const OFFLINE_OPACITY = 0.4;

// `link(onPress)`: the props for a text link that opens a price page.
// Offline: no press, greyed, and said to be off for VoiceOver. `off`: for
// a Button, which greys itself when disabled
export function useNeedsConnection() {
  const off = useIsOffline();
  const link = (onPress: () => void) =>
    off
      ? {
          onPress: undefined,
          disabled: true,
          style: { opacity: OFFLINE_OPACITY },
          accessibilityState: { disabled: true },
        }
      : { onPress };
  return { off, link };
}
