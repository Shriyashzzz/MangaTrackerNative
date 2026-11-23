// Me, on an iPhone: everything the menu holds, as a page (Android keeps the
// menu behind the picture at the top). Signed out, the way to an account
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Backdrop from "@/components/Backdrop";
import DoubleRule from "@/components/DoubleRule";
import SignInPrompt from "@/components/SignInPrompt";
import { MenuList } from "@/components/SettingsMenu";
import { useHasYear } from "@/core/lib/year";
import { useTabFoot } from "@/lib/tabHeader";
import { columnStyle } from "@/lib/wide";
import { useAuth } from "@/store/auth";

export default function MeTab() {
  const isSignedIn = useAuth((s) => s.isSignedIn);
  const hasYear = useHasYear(Boolean(isSignedIn));
  const insets = useSafeAreaInsets();
  const foot = useTabFoot(40);
  if (!isSignedIn)
    return (
      <SignInPrompt
        title="Me"
        line="Your profile, your settings and your shelf, kept across your devices."
      />
    );
  return (
    <View className="flex-1 bg-paper">
      <Backdrop />
      <ScrollView
        contentContainerStyle={{
          ...columnStyle,
          paddingTop: insets.top + 8,
          paddingBottom: foot,
          paddingHorizontal: 16,
          gap: 10,
        }}
      >
        <Text className="font-brand pr-[7px] text-[30px] tracking-[1px] text-ink uppercase">
          Me{" "}
        </Text>
        <DoubleRule />
        <View className="rounded-[14px] border border-line-soft bg-card px-1 py-2">
          <MenuList onClose={() => {}} hasYear={hasYear} />
        </View>
      </ScrollView>
    </View>
  );
}
