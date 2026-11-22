// Signing in with Google on the phone: Google's own sheet picks the account
// and hands back an ID token made out to the website's web client, which is
// the client the server checks tokens against (server auth/googleSignIn.ts).
// So the app and the website sign in through one server route. The client
// IDs come from .env.local (see .env.example)
import {
  GoogleSignin,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { Platform } from "react-native";

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
const IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? "";

// whether this build knows its Google clients: without them the button
// stays off the page rather than failing on a tap
export const googleSignInReady = () =>
  Boolean(WEB_CLIENT_ID) && (Platform.OS !== "ios" || Boolean(IOS_CLIENT_ID));

let configured = false;
function configure() {
  if (configured) return;
  GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    ...(IOS_CLIENT_ID ? { iosClientId: IOS_CLIENT_ID } : {}),
  });
  configured = true;
}

export type GoogleOutcome =
  { token: string } | { cancelled: true } | { problem: string };

// Google's account sheet, then the token; or why there is none
export async function askGoogle(): Promise<GoogleOutcome> {
  configure();
  try {
    if (Platform.OS === "android")
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });
    const answer = await GoogleSignin.signIn();
    if (answer.type !== "success") return { cancelled: true };
    const token = answer.data.idToken;
    if (!token)
      return { problem: "Google didn't hand back a sign-in. Try again." };
    return { token };
  } catch (e) {
    if (isErrorWithCode(e)) {
      if (e.code === statusCodes.SIGN_IN_CANCELLED) return { cancelled: true };
      if (e.code === statusCodes.IN_PROGRESS) return { cancelled: true };
      if (e.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE)
        return {
          problem: "Google Play services are needed to sign in with Google.",
        };
    }
    return { problem: "Google sign-in didn't work. Try again." };
  }
}

// after signing in, Google's own session on the device is let go too, so
// the next sign-in shows the account sheet again
export const forgetGoogle = () => GoogleSignin.signOut().catch(() => {});
