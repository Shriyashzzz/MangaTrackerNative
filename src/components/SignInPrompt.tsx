// A tab that's an account's, for someone signed out: what it's for, and
// the way in
import { router } from "expo-router";
import { Text, View } from "react-native";
import Backdrop from "@/components/Backdrop";
import Button from "@/components/Button";
import Mascot from "@/components/Mascot";

export default function SignInPrompt({
  title,
  line,
}: {
  title: string;
  line: string;
}) {
  return (
    <View className="flex-1 items-center justify-center gap-4 bg-paper px-8">
      <Backdrop />
      <Mascot mood="happy" width={96} />
      <Text className="font-brand pr-[7px] text-[30px] tracking-[1px] text-ink uppercase">
        {title}
        {" "}
      </Text>
      <Text className="text-center font-body text-[15px] leading-[22px] text-ink-soft">
        {line}
      </Text>
      <View className="w-full gap-2.5">
        <Button
          kind="primary"
          wide
          label="Start your shelf"
          onPress={() => router.push("/sign-up")}
        />
        <Button wide label="Sign in" onPress={() => router.push("/sign-in")} />
      </View>
    </View>
  );
}
