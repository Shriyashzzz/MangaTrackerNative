// A tab that's an account's, for someone signed out: what it's for, and
// the way in. In a paper box with an ink border, like the signed-out shelf's,
// so on a wide screen it's a card in the middle, not buttons edge to edge
import { router } from "expo-router";
import { Text, View } from "react-native";
import Backdrop from "@/components/Backdrop";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";
import { useCorners } from "@/lib/mangaThemes";

export default function SignInPrompt({
  title,
  line,
}: {
  title: string;
  line: string;
}) {
  const corners = useCorners();
  return (
    <View className="flex-1 items-center justify-center bg-paper px-5">
      <Backdrop />
      <View
        className="w-full max-w-[440px] items-center gap-4 border-2 border-line bg-paper px-6 py-8"
        style={corners.panel}
      >
        <Mascot mood="happy" width={88} />
        <Text className="font-brand pr-[7px] text-[30px] tracking-[1px] text-ink uppercase">
          {title}
          {" "}
        </Text>
        <Text className="text-center font-body text-[15px] leading-[22px] text-ink-soft">
          {line}
        </Text>
        <View className="mt-1 w-full gap-3">
          <Button
            kind="primary"
            wide
            label="Start your shelf"
            onPress={() => router.push("/sign-up")}
          />
          <Text className="text-center font-body text-[14px] text-ink-soft">
            Already have a shelf?{"  "}
            <Text
              onPress={() => router.push("/sign-in")}
              accessibilityRole="link"
              className="font-body-semibold text-accent"
            >
              Sign in
            </Text>
          </Text>
        </View>
      </View>
    </View>
  );
}
