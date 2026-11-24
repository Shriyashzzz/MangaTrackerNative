// The app's frame: the fonts the web uses, the session checked once, then
// the tabs for everyone; the pages that need an account only when signed in
import TryingTheme from "@/components/TryingTheme";
import { loadLook, themeOf, useWornTheme } from "@/lib/mangaThemes";
import { whenCollectorNeeded } from "@/core/lib/api";
import { usePlan } from "@/store/plan";
import CollectorSheet from "@/components/CollectorSheet";
import Intro from "@/components/Intro";
import { View, Appearance } from "react-native";
import "../global.css";
import { Bangers_400Regular } from "@expo-google-fonts/bangers";
import { Chewy_400Regular } from "@expo-google-fonts/chewy";
import { PermanentMarker_400Regular } from "@expo-google-fonts/permanent-marker";
import { PirataOne_400Regular } from "@expo-google-fonts/pirata-one";
import { Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import { Creepster_400Regular } from "@expo-google-fonts/creepster";
import { BebasNeue_400Regular } from "@expo-google-fonts/bebas-neue";
import { Rajdhani_700Bold } from "@expo-google-fonts/rajdhani";

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
import { useCallback, useEffect, useState } from "react";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { loadDeviceStore } from "@/lib/deviceStore";
import OfflineBar from "@/components/OfflineBar";
import Tour from "@/components/Tour";
import { forgetAccountData } from "@/lib/forgetAccount";
import {
  askForAlertsOnce,
  openTappedAlerts,
  refreshPhoneAlerts,
} from "@/lib/phoneAlerts";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";

SplashScreen.preventAutoHideAsync();

// a limit the server says is full: the Collector sheet, saying which, and
// the plan read again so its counts are right
whenCollectorNeeded((what) => {
  const plan = usePlan.getState();
  void plan.load();
  plan.showCollector(
    what === "series" || what === "scans" || what === "priceAlerts"
      ? what
      : null,
  );
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Bangers_400Regular,
    // the manga themes' heading lettering (lib/mangaThemes.ts)
    Chewy_400Regular,
    PermanentMarker_400Regular,
    PirataOne_400Regular,
    Fredoka_600SemiBold,
    Creepster_400Regular,
    BebasNeue_400Regular,
    Rajdhani_700Bold,
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
  // or a manga theme picked on this iPhone, worn while Premium is theirs
  // (lib/mangaThemes.ts): where the limits hold, a free account is light
  // or dark again
  const wearing = useWornTheme();
  useEffect(() => {
    Uniwind.setTheme(
      wearing ?? (theme === "light" || theme === "dark" ? theme : "system"),
    );
    // Apple's own parts (the tab bar, the bar buttons, sheets) follow
    // light or dark: a theme says which it is; otherwise the account's
    // choice, or the device's
    Appearance.setColorScheme(
      wearing
        ? themeOf(wearing)!.dark
          ? "dark"
          : "light"
        : theme === "light" || theme === "dark"
          ? theme
          : "unspecified",
    );
  }, [theme, wearing]);

  // what this device remembers (lib/deviceStore.ts): read before any screen
  const [storeLoaded, setStoreLoaded] = useState(false);
  useEffect(() => {
    void check();
    void loadDeviceStore().then(() => {
      loadLook();
      setStoreLoaded(true);
    });
  }, [check]);

  // signed out, however it happened: the account's data leaves memory
  useEffect(() => {
    if (isSignedIn === false) forgetAccountData();
  }, [isSignedIn]);
  // phone alerts: the token given again once signed in, and a tapped alert
  // opened once the screens are up
  useEffect(() => {
    if (!isSignedIn || !storeLoaded) return;
    // what their plan allows on this device (store/plan.ts)
    void usePlan.getState().load();
    // (asked for once, the first time; after that, kept up to date)
    askForAlertsOnce();
    void refreshPhoneAlerts();
  }, [isSignedIn, storeLoaded]);
  // the opening burst, once each time the app starts (components/Intro.tsx)
  const [introOn, setIntroOn] = useState(true);
  const introDone = useCallback(() => setIntroOn(false), []);
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
          <StatusBar
            style={
              wearing ? (themeOf(wearing)!.dark ? "light" : "dark") : "auto"
            }
          />
          {/* Collector, opened from Settings or by a full limit */}
          <CollectorSheet />
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
                <Stack.Screen name="blocked" />
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
            {introOn ? <Intro onDone={introDone} /> : null}
          </View>
          {/* no connection, or kept changes just sent: said along the foot */}
          <OfflineBar signedIn={Boolean(isSignedIn)} />
          {/* a free reader trying a manga theme on: the time left, over
              every page */}
          <TryingTheme />
        </BottomSheetModalProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}
