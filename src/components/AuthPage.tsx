// The page round signing up and signing in: the signed-out panels behind,
// a way back at the top, and the form in a paper box with an ink border,
// in the middle of the screen (the signed-out shelf's look). On a phone the
// box fills the width; on an iPad it keeps a form's width
import { Stack, router } from "expo-router";
import type { ReactNode } from "react";
import { Platform, ScrollView, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import Backdrop from "@/components/Backdrop";
import Tap from "@/components/Tap";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { useCorners } from "@/lib/mangaThemes";

const Safe = withUniwind(SafeAreaView);

// the form's widest, on an iPad
const FORM_MOST = 480;

export default function AuthPage({ children }: { children: ReactNode }) {
  const c = useColors();
  const corners = useCorners();
  return (
    <Safe className="flex-1 bg-paper">
      <Backdrop />
      {/* the way back, as the swipe from the edge does: on an iPhone or
          iPad, Apple's own back button over the page, as every page has */}
      {Platform.OS === "ios" ? (
        <Stack.Screen
          options={{
            headerShown: router.canGoBack(),
            title: "",
            headerTransparent: true,
            headerShadowVisible: false,
            headerTintColor: c.ink,
            headerBackButtonDisplayMode: "minimal",
          }}
        />
      ) : router.canGoBack() ? (
        <View className="px-3 pt-1">
          <Tap
            feel="round"
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-11 w-11 items-center justify-center"
          >
            <ChevronLeftIcon color={c.ink} width={24} height={24} />
          </Tap>
        </View>
      ) : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="grow justify-center px-4 py-6"
        >
          <View
            className="w-full gap-5 self-center border-2 border-line bg-paper px-5 py-6"
            style={[{ maxWidth: FORM_MOST }, corners.panel]}
          >
            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Safe>
  );
}
