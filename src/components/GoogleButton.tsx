// "Continue with Google", drawn to Google's branding rules (a white or dark
// button with the four-colour G, the system font), and the sign-in it does:
// Google's sheet, then the token to the server, then the account is signed
// in. Tells the page what went wrong in its own words
import { Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { errorMessages } from "@/core/lib/api";
import { orOffline } from "@/core/lib/offline";
import { useColors } from "@/lib/colors";
import { askGoogle, googleSignInReady } from "@/lib/googleSignIn";
import { look } from "@/lib/platformLook";
import { useAuth } from "@/store/auth";
import PressScale from "./PressScale";

// Google's "G" mark, as Google ships it
function GoogleMark() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

export default function GoogleButton({
  onBusy,
  onError,
}: {
  onBusy: (busy: boolean) => void;
  // the page shows it; "" clears it
  onError: (message: string) => void;
}) {
  const c = useColors();
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);
  if (!googleSignInReady()) return null;

  const press = async () => {
    onError("");
    onBusy(true);
    try {
      const asked = await askGoogle();
      if ("cancelled" in asked) return;
      if ("problem" in asked) return onError(asked.problem);
      const result = await signInWithGoogle(asked.token);
      if (result.ok) return;
      onError(
        (await errorMessages(result))[0] ??
          "Google sign-in didn't work. Try again.",
      );
    } catch {
      onError(orOffline("Something went wrong. Please try again."));
    } finally {
      onBusy(false);
    }
  };

  return (
    <View className="gap-3">
      <PressScale
        onPress={() => void press()}
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        style={{ alignSelf: "stretch" }}
        className={`min-h-[48px] flex-row items-center justify-center gap-3 overflow-hidden border border-line-soft bg-card px-5 ${look.buttonRadius}`}
      >
        <GoogleMark />
        <Text className="font-body-medium text-[16px] text-ink">
          Continue with Google
        </Text>
      </PressScale>
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1" style={{ backgroundColor: c.lineSoft }} />
        <Text className="font-body text-[13px] text-muted">or</Text>
        <View className="h-px flex-1" style={{ backgroundColor: c.lineSoft }} />
      </View>
    </View>
  );
}
