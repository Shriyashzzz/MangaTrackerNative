// A password box with Show / Hide (the web's components/passwordInput)
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Input } from "./Field";

export default function PasswordInput(
  props: Omit<React.ComponentProps<typeof Input>, "secureTextEntry">,
) {
  const [shown, setShown] = useState(false);
  return (
    <View>
      <Input
        {...props}
        secureTextEntry={!shown}
        autoCapitalize="none"
        autoCorrect={false}
        className={`pr-16 ${props.className ?? ""}`}
      />
      <Pressable
        onPress={() => setShown(!shown)}
        hitSlop={8}
        className="absolute top-0 right-3 h-[46px] justify-center"
        accessibilityLabel={shown ? "Hide the password" : "Show the password"}
      >
        <Text className="font-body-medium text-[13.5px] text-ink-soft">
          {shown ? "Hide" : "Show"}
        </Text>
      </Pressable>
    </View>
  );
}
