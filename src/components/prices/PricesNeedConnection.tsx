// A price page with no connection. Prices are live checks of the stores,
// so offline there are none to show; the links to a price page are greyed
// then (lib/needsConnection.ts), and the Prices tab opens on this. Kenji
// says so in a paper box in the middle of the page, the heading in the
// app's lettering, as the signed-out pages have it (SignInPrompt.tsx)
import { Text, View } from "react-native";
import Mascot from "@/components/Mascot";
import { useCorners } from "@/lib/mangaThemes";

export default function PricesNeedConnection() {
  const corners = useCorners();
  return (
    <View className="flex-1 items-center justify-center px-5 py-10">
      <View
        className="w-full max-w-[440px] items-center gap-3 border-2 border-line bg-paper px-6 py-8"
        style={corners.panel}
      >
        <Mascot mood="confused" width={88} />
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.6}
          className="self-stretch text-center font-brand pr-[7px] text-[30px] tracking-[1px] text-ink uppercase"
        >
          You're offline{" "}
        </Text>
        <Text className="text-center font-body text-[15px] leading-[22px] text-ink-soft">
          Prices need a connection. They're back when you are.
        </Text>
      </View>
    </View>
  );
}
