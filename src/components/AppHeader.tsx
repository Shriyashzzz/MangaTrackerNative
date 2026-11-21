// The top bar, as the Android app's masthead (web layouts/header): the logo
// and name, To buy's bag, and their picture, over a double rule
import { Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { LOGO_SVG } from "@/core/assets/logo";
import { BagIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import DoubleRule from "./DoubleRule";

export default function AppHeader() {
  const c = useColors();
  return (
    <View className="bg-paper">
      <View className="h-[62px] flex-row items-center gap-4 px-4">
        <View className="mr-auto flex-row items-center gap-2">
          <SvgXml xml={LOGO_SVG} width={30} height={30} />
          <Text
            numberOfLines={1}
            className="font-brand pr-1 text-[26px] tracking-[1px] text-ink uppercase"
          >
            Manga Tracker
          </Text>
        </View>
        <BagIcon color={c.inkSoft} width={24} height={24} />
        {/* their picture: drawn with Settings (phase 4) */}
        <View className="size-9 rounded-full border-[2.5px] border-line bg-card" />
      </View>
      <DoubleRule />
    </View>
  );
}
