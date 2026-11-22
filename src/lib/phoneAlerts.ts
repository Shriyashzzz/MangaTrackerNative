// Alerts on this phone: a new volume or chapter for a series on the shelf,
// sent by the server (its push/pushSender.ts) through Expo's push service.
// Switched on in Settings; the phone's token is given to the server for
// whoever is signed in, and taken back when they switch it off or sign out.
// What is sent, and when, is the server's alone
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { AndroidImportance } from "expo-notifications";
import { Platform } from "react-native";
import { apiFetch } from "@/core/lib/api";
import { readLocal, writeLocal } from "./deviceStore";
import { openWebPath } from "./webRoutes";

// what this phone remembers: whether alerts are on, and the token it gave
const ON_KEY = "phoneAlerts";
const TOKEN_KEY = "phoneAlertsToken";
// the Android channel the server sends on (its expoPush.ts)
const CHANNEL = "releases";

// the Expo project the tokens belong to (app.json extra.eas.projectId, put
// there by `eas init`), read from wherever this kind of build keeps it.
// The config is baked in when the app is built: a build made before the
// project was linked has none, and can't get a token
type WithEas = { eas?: { projectId?: string } } | undefined;
const projectId =
  Constants.easConfig?.projectId ??
  (Constants.expoConfig?.extra as WithEas)?.eas?.projectId ??
  (Constants.manifest2?.extra as WithEas)?.eas?.projectId;

export const phoneAlertsAvailable = () => Boolean(projectId);
export const phoneAlertsOn = () => readLocal(ON_KEY) === "yes";

// an alert that arrives while the app is open still shows
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function tokenForThisPhone() {
  if (Platform.OS === "android")
    await Notifications.setNotificationChannelAsync(CHANNEL, {
      name: "New volumes and chapters",
      importance: AndroidImportance.DEFAULT,
    });
  return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
}

const tell = (path: string, token: string) =>
  apiFetch(path, { method: "POST", body: { token } });

export type TurnedOn = "on" | "denied" | "unavailable" | "failed";

// the switch, on: asks the phone's permission, then gives the server the
// token. "denied" when they said no (the phone's own settings undo that)
export async function turnOnPhoneAlerts(): Promise<TurnedOn> {
  if (!projectId) return "unavailable";
  try {
    const asked = await Notifications.requestPermissionsAsync();
    if (!asked.granted) return "denied";
    const token = await tokenForThisPhone();
    const res = await tell("/api/push/device", token);
    if (!res.ok) return "failed";
    writeLocal(ON_KEY, "yes");
    writeLocal(TOKEN_KEY, token);
    return "on";
  } catch {
    return "failed";
  }
}

// the switch, off, or signing out: the server forgets this phone. Asked
// while still signed in; a failure leaves nothing to undo on the phone
export async function turnOffPhoneAlerts() {
  const token = readLocal(TOKEN_KEY);
  writeLocal(ON_KEY, "no");
  writeLocal(TOKEN_KEY, "");
  if (token) await tell("/api/push/device/forget", token).catch(() => {});
}

// signing out: the server forgets this phone for this account, and the
// switch goes off, so nobody who signs in next gets alerts they didn't ask
// for. Never holds the sign-out up: three seconds at most
export async function forgetThisPhone() {
  // signing out switches alerts off on this phone: whoever signs in next
  // (them again, or someone else) turns them on for themselves
  writeLocal(ON_KEY, "no");
  const token = readLocal(TOKEN_KEY);
  if (!token) return;
  writeLocal(TOKEN_KEY, "");
  await Promise.race([
    tell("/api/push/device/forget", token).catch(() => {}),
    new Promise((done) => setTimeout(done, 3000)),
  ]);
}

// signed in with alerts on from before: the token is given again, in case
// it changed or the account did. Never asks the phone anything
export async function refreshPhoneAlerts() {
  if (!projectId || !phoneAlertsOn()) return;
  try {
    const { granted } = await Notifications.getPermissionsAsync();
    if (!granted) return;
    const token = await tokenForThisPhone();
    const before = readLocal(TOKEN_KEY);
    const res = await tell("/api/push/device", token);
    if (!res.ok) return;
    writeLocal(TOKEN_KEY, token);
    // the phone was given a new token: the old one is no good, and goes
    if (before && before !== token)
      await tell("/api/push/device/forget", before).catch(() => {});
  } catch {
    // the next sign-in or app start tries again
  }
}

// a tapped alert opens its page: the server sends the site's address, and
// the app goes to its own screen for that path
export function openTappedAlerts() {
  const open = (response: Notifications.NotificationResponse | null) => {
    const url = response?.notification.request.content.data?.url;
    if (typeof url !== "string") return;
    // opened once: left as "the last one tapped", it would open its page
    // again the next time this runs (signing out and back in)
    Notifications.clearLastNotificationResponse();
    openWebPath(url.replace(/^https?:\/\/[^/]+/, "") || "/");
  };
  // the tap that started the app, then any after
  open(Notifications.getLastNotificationResponse());
  const listening = Notifications.addNotificationResponseReceivedListener(open);
  return () => listening.remove();
}
