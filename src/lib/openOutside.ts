// Opening something outside the app (a store, AniList, an email): only a web
// or mail address is ever handed to the phone, whatever the data says, and a
// phone with nothing to open it doesn't leave a failure hanging
import { Linking } from "react-native";

const ALLOWED = /^(https?:|mailto:)/i;

export function openOutside(url: string | null | undefined) {
  if (!url || !ALLOWED.test(url.trim())) return;
  Linking.openURL(url.trim()).catch(() => {});
}
