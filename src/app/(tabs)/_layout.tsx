// The three halves of the app along the bottom: My shelf, New, Prices
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { usePrefs } from "@/store/prefs";
import BottomBar from "@/components/BottomBar";

export default function TabsLayout() {
  // the account's settings, once they're signed in
  const loadPrefs = usePrefs((s) => s.load);
  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);
  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="new" />
      <Tabs.Screen name="prices" />
    </Tabs>
  );
}
