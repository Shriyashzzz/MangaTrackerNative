// The app's frame: the fonts the web uses, the session checked once, then
// the shelf for someone signed in and the sign-in page for anyone else
import "../global.css";
import { Bangers_400Regular } from "@expo-google-fonts/bangers";
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
} from "@expo-google-fonts/ibm-plex-mono";
import {
  IBMPlexSans_400Regular,
  IBMPlexSans_500Medium,
  IBMPlexSans_600SemiBold,
} from "@expo-google-fonts/ibm-plex-sans";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { Uniwind } from "uniwind";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { loadDeviceStore } from "@/lib/deviceStore";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Bangers_400Regular,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
  });
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const check = useAuth((s) => s.check);
  // light, dark, or the device's own, as the account chose (Settings)
  const theme = usePrefs((s) => s.prefs.theme);
  useEffect(() => {
    Uniwind.setTheme(theme === "light" || theme === "dark" ? theme : "system");
  }, [theme]);

  // what this device remembers (lib/deviceStore.ts): read before any screen
  const [storeLoaded, setStoreLoaded] = useState(false);
  useEffect(() => {
    void check();
    void loadDeviceStore().then(() => setStoreLoaded(true));
  }, [check]);

  const ready =
    (fontsLoaded || fontError) && isSignedIn !== null && storeLoaded;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="details/[id]" />
          <Stack.Screen name="edit/[id]" />
          <Stack.Screen name="add" />
          <Stack.Screen name="scan" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="to-buy" />
          <Stack.Screen name="new-releases" />
          <Stack.Screen name="friends" />
          <Stack.Screen name="import" />
          <Stack.Screen name="updates" />
          <Stack.Screen name="faq" />
          <Stack.Screen name="about" />
          <Stack.Screen name="privacy" />
          <Stack.Screen name="calendar" />
          <Stack.Screen name="editions" />
          <Stack.Screen name="deals" />
          <Stack.Screen name="series" />
          <Stack.Screen name="year" />
          <Stack.Screen name="u/[code]" />
          <Stack.Screen name="prices/series" />
          <Stack.Screen name="prices/[isbn]" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="sign-in" />
        </Stack.Protected>
      </Stack>
    </GestureHandlerRootView>
  );
}
