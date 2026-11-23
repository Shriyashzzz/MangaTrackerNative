// Sign in with Apple, on an iPhone or iPad: Apple's own button, in Apple's
// look, as its rules ask, above the Google button. Apple's sheet asks for
// Face ID and whether to share or hide their email; the token it hands back
// is checked by the server (server src/auth/appleSignIn.ts)
import * as AppleAuthentication from "expo-apple-authentication";
import { useEffect, useState } from "react";
import { Platform } from "react-native";
import { errorMessages } from "@/core/lib/api";
import { orOffline } from "@/core/lib/offline";
import { useColors } from "@/lib/colors";
import { useAuth } from "@/store/auth";

export default function AppleButton({
  onBusy,
  onError,
  signUp = false,
}: {
  onBusy: (busy: boolean) => void;
  onError: (message: string) => void;
  signUp?: boolean;
}) {
  const c = useColors();
  const signInWithApple = useAuth((s) => s.signInWithApple);
  const [offered, setOffered] = useState(false);
  useEffect(() => {
    if (Platform.OS !== "ios") return;
    void AppleAuthentication.isAvailableAsync().then(setOffered);
  }, []);
  if (!offered) return null;

  const press = async () => {
    onError("");
    try {
      const answer = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!answer.identityToken)
        return onError("Apple didn't hand back a sign-in. Try again.");
      onBusy(true);
      const res = await signInWithApple(
        answer.identityToken,
        answer.fullName?.givenName ?? null,
      );
      if (!res.ok)
        onError(
          (await errorMessages(res))[0] ??
            "Apple sign-in didn't work. Try again.",
        );
    } catch (e) {
      // closed Apple's sheet: nothing to say
      if ((e as { code?: string }).code === "ERR_REQUEST_CANCELED") return;
      onError(orOffline("Apple sign-in didn't work. Try again."));
    } finally {
      onBusy(false);
    }
  };

  // dark on the light paper, light on the dark (Apple's two looks)
  const dark = c.paper === "#16140f";
  return (
    <AppleAuthentication.AppleAuthenticationButton
      buttonType={
        signUp
          ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
          : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
      }
      buttonStyle={
        dark
          ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE
          : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
      }
      cornerRadius={12}
      style={{ alignSelf: "stretch", height: 48 }}
      onPress={() => void press()}
    />
  );
}
