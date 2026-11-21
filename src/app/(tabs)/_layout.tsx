// The three halves of the app along the bottom: My shelf, New, Prices. A
// change of tab slides the pages sideways, the way an iPhone's do: the one
// leaving goes out the far side from the one coming in
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { Easing, useWindowDimensions } from "react-native";
import { usePrefs } from "@/store/prefs";
import BottomBar from "@/components/BottomBar";

export default function TabsLayout() {
  // the account's settings, once they're signed in
  const loadPrefs = usePrefs((s) => s.load);
  useEffect(() => {
    void loadPrefs();
  }, [loadPrefs]);
  const { width } = useWindowDimensions();
  return (
    <Tabs
      tabBar={(props) => <BottomBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "shift",
        transitionSpec: {
          animation: "timing",
          config: { duration: 260, easing: Easing.out(Easing.cubic) },
        },
        // progress: -1 for a tab to the left of the one shown, 1 to the right
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            transform: [
              {
                translateX: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: [-width, 0, width],
                }),
              },
            ],
          },
        }),
      }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="new" />
      <Tabs.Screen name="prices" />
    </Tabs>
  );
}
