// Prices: built in phase 3
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AppHeader from "@/components/AppHeader";

const Safe = withUniwind(SafeAreaView);

export default function PricesScreen() {
  return (
    <Safe edges={["top"]} className="flex-1 bg-paper">
      <AppHeader />
      <View className="flex-1 items-center justify-center px-8">
        <Text className="font-brand text-[30px] text-ink uppercase">
          Prices
        </Text>
        <Text className="text-center font-body text-[15px] text-ink-soft">
          Coming in phase 3.
        </Text>
      </View>
    </Safe>
  );
}
