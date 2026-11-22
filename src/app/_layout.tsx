// The app's frame: the fonts the web uses, the session checked once, then
// the tabs for everyone; the pages that need an account only when signed in
import { View } from "react-native";
import "../global.css";
import { Bangers_400Regular } from "@expo-google-fonts/bangers";
import { ComicNeue_700Bold } from "@expo-google-fonts/comic-neue";
import {
  Fraunces_400Regular,
  Fraunces_400Regular_Italic,
  Fraunces_600SemiBold,
} from "@expo-google-fonts/fraunces";
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
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
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { loadDeviceStore } from "@/lib/deviceStore";
import OfflineBar from "@/components/OfflineBar";
import Tour from "@/components/Tour";
import { forgetAccountData } from "@/lib/forgetAccount";
import { openTappedAlerts, refreshPhoneAlerts } from "@/lib/phoneAlerts";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Bangers_400Regular,
    ComicNeue_700Bold,
    Fraunces_400Regular,
    Fraunces_400Regular_Italic,
    Fraunces_600SemiBold,
    IBMPlexSans_400Regular,
    IBMPlexSans_500Medium,
    IBMPlexSans_600SemiBold,
    IBMPlexMono_400Regular,
    IBMPlexMono_500Medium,
    IBMPlexMono_600SemiBold,
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

  // signed out, however it happened: the account's data leaves memory
  useEffect(() => {
    if (isSignedIn === false) forgetAccountData();
  }, [isSignedIn]);
  // phone alerts: the token given again once signed in, and a tapped alert
  // opened once the screens are up
  useEffect(() => {
    if (isSignedIn && storeLoaded) void refreshPhoneAlerts();
  }, [isSignedIn, storeLoaded]);
  const ready =
    (fontsLoaded || fontError) && isSignedIn !== null && storeLoaded;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);
  useEffect(() => {
    if (ready && isSignedIn) return openTappedAlerts();
  }, [ready, isSignedIn]);
  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <BottomSheetModalProvider>
          <StatusBar style="auto" />
          {/* the pages, with Kenji's tour floating over them (never
              pushing them about) */}
          <View style={{ flex: 1 }}>
            <Stack
              screenOptions={{
                headerShown: false,
                // pages slide in from the right and swipe back from anywhere,
                // as an iPhone's do
                animation: "ios_from_right",
                animationDuration: 320,
                gestureEnabled: true,
                fullScreenGestureEnabled: true,
                animationMatchesGesture: true,
              }}
            >
              {/* open to anyone: the tabs (a guest's shelf, prices, sign in),
                the price pages, and the pages about the app */}
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="prices/series" />
              <Stack.Screen name="prices/[isbn]" />
              <Stack.Screen name="after-anime/index" />
              <Stack.Screen name="after-anime/[slug]" />
              <Stack.Screen name="editions" />
              <Stack.Screen name="deals" />
              <Stack.Screen name="series" />
              <Stack.Screen name="updates" />
              <Stack.Screen name="faq" />
              <Stack.Screen name="about" />
              <Stack.Screen name="acknowledgements" />
              <Stack.Screen name="privacy" />
              <Stack.Screen name="u/[code]" />
              <Stack.Protected guard={Boolean(isSignedIn)}>
                <Stack.Screen name="details/[id]" />
                <Stack.Screen name="edit/[id]" />
                <Stack.Screen name="add" />
                <Stack.Screen name="scan" />
                <Stack.Screen name="settings" />
                <Stack.Screen name="to-buy" />
                <Stack.Screen name="new-releases" />
                <Stack.Screen name="friends" />
                <Stack.Screen name="import" />
                <Stack.Screen name="calendar" />
                <Stack.Screen name="year" />
                <Stack.Screen name="stats" />
              </Stack.Protected>
              <Stack.Protected guard={!isSignedIn}>
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="sign-up" />
                <Stack.Screen name="forgot-password" />
              </Stack.Protected>
              {/* from a reset link, signed in or not */}
              <Stack.Screen name="reset-password/[token]" />
            </Stack>
            <Tour signedIn={Boolean(isSignedIn)} />
          </View>
          {/* no connection, or kept changes just sent: said along the foot */}
          <OfflineBar signedIn={Boolean(isSignedIn)} />
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
