// Settings, as the Android app's (web pages/Settings): one row of tabs
// across the top, then the tab. Profile (name, picture, sharing), Appearance
// (light or dark), New releases, Your shelf, Prices, Account (email, the
// weekly email, alerts, export, delete). Every setting is saved on the
// account (store/prefs save, the web's savePrefs; store/account)
import Backdrop from "@/components/Backdrop";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState, type ComponentRef } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import DoubleRule from "@/components/DoubleRule";
import AccountTab from "@/components/settings/AccountTab";
import AppearanceTab from "@/components/settings/AppearanceTab";
import NewReleasesTab from "@/components/settings/NewReleasesTab";
import PricesTab from "@/components/settings/PricesTab";
import ProfileTab from "@/components/settings/ProfileTab";
import ShelfSettingsTab from "@/components/settings/ShelfSettingsTab";
import { ChevronLeftIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import { useAccount } from "@/store/account";

const Safe = withUniwind(SafeAreaView);

const TABS = [
  { id: "profile", label: "Profile" },
  { id: "appearance", label: "Appearance" },
  { id: "new-releases", label: "New releases" },
  { id: "shelf", label: "Your shelf" },
  { id: "prices", label: "Prices" },
  { id: "account", label: "Account" },
] as const;
type TabId = (typeof TABS)[number]["id"];

export default function SettingsScreen() {
  const c = useColors();
  const params = useLocalSearchParams<{ tab?: string; at?: string }>();
  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === params.tab) ? (params.tab as TabId) : "profile",
  );
  // where each tab sits in the bar, so the underline can slide to it
  const [spots, setSpots] = useState<
    Record<string, { x: number; width: number }>
  >({});
  const lineX = useSharedValue(0);
  const lineWidth = useSharedValue(0);
  const spot = spots[tab];
  const placed = useRef(false);
  useEffect(() => {
    if (!spot) return;
    // the first time it appears under its tab; after that it slides
    if (!placed.current) {
      placed.current = true;
      lineX.set(spot.x);
      lineWidth.set(spot.width);
      return;
    }
    lineX.set(withTiming(spot.x, { duration: 220 }));
    lineWidth.set(withTiming(spot.width, { duration: 220 }));
  }, [spot, lineX, lineWidth]);
  const underline = useAnimatedStyle(() => ({
    width: lineWidth.value,
    transform: [{ translateX: lineX.value }],
  }));
  const account = useAccount((s) => s.account);
  const loadFailed = useAccount((s) => s.loadFailed);
  const load = useAccount((s) => s.load);
  const page = useRef<ComponentRef<typeof ScrollView>>(null);
  useEffect(() => {
    void load();
  }, [load]);
  const needsAccount = tab === "profile" || tab === "account";

  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <Backdrop />
      <View className="h-[62px] flex-row items-center gap-3 px-2">
        <Pressable
          onPress={() => router.back()}
          hitSlop={8}
          className="p-2"
          accessibilityLabel="Back"
        >
          <ChevronLeftIcon color={c.ink} width={24} height={24} />
        </Pressable>
        <Text className="flex-1 font-brand pr-[6px] text-[24px] tracking-[1px] text-ink uppercase">
          Settings
          {"\u00A0"}
        </Text>
      </View>
      <DoubleRule />
      {/* the tabs, as Android lays them along the top: the open one underlined */}
      <View className="h-[52px] border-b border-line-soft">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-2"
        >
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => {
                setTab(t.id);
                page.current?.scrollTo({ y: 0, animated: false });
              }}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                setSpots((now) => ({ ...now, [t.id]: { x, width } }));
              }}
              accessibilityRole="tab"
              accessibilityState={{ selected: t.id === tab }}
              className="h-[52px] justify-center px-4"
            >
              {/* the same weight picked or not, so no tab changes width */}
              <Text
                className={`font-body-semibold text-[16px] ${t.id === tab ? "text-ink" : "text-ink-soft"}`}
              >
                {t.label}
              </Text>
            </Pressable>
          ))}
          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                bottom: 0,
                left: 0,
                height: 3,
                backgroundColor: c.accent,
              },
              underline,
            ]}
          />
        </ScrollView>
      </View>
      <ScrollView
        ref={page}
        contentContainerClassName="gap-7 px-4 pt-5 pb-16"
        keyboardShouldPersistTaps="handled"
      >
        {needsAccount && !account ? (
          loadFailed ? (
            <Text className="font-body text-[15px] text-accent">
              Couldn't load your account. Pull to try again.
            </Text>
          ) : null
        ) : (
          <>
            {tab === "profile" && account ? (
              <ProfileTab
                account={account}
                scrollTo={params.at === "share" ? "share" : undefined}
                page={page}
              />
            ) : null}
            {tab === "appearance" ? <AppearanceTab /> : null}
            {tab === "new-releases" ? <NewReleasesTab /> : null}
            {tab === "shelf" ? <ShelfSettingsTab /> : null}
            {tab === "prices" ? <PricesTab /> : null}
            {tab === "account" && account ? (
              <AccountTab account={account} />
            ) : null}
          </>
        )}
      </ScrollView>
    </Safe>
  );
}
