// Signing in, as the web's pages/SignIn: username and password, the
// server's own words when it says no
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { useAuth } from "@/store/auth";

const Safe = withUniwind(SafeAreaView);

const field =
  "rounded-[4px] border-[1.5px] border-line bg-card px-3 py-3 font-body text-[16px] text-ink";

export default function SignIn() {
  const signIn = useAuth((s) => s.signIn);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username.trim() || !password) {
      setError("Username and password are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const said = await signIn(username.trim(), password);
      if (said.length) setError(said[0] ?? "Check your details.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Check your details.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Safe className="flex-1 bg-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-center gap-5 px-6"
      >
        <View className="gap-1">
          <Text className="font-brand pr-1 text-[44px] tracking-[1px] text-ink uppercase">
            Welcome back!
          </Text>
          <Text className="font-body text-[16px] text-ink-soft">
            Your shelf is right where you left it.
          </Text>
        </View>
        <View className="gap-1.5">
          <Text className="font-body-medium text-[15px] text-ink">
            Username
          </Text>
          <TextInput
            className={field}
            value={username}
            onChangeText={setUsername}
            placeholder="yourusername"
            placeholderTextColorClassName="accent-muted"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            textContentType="username"
          />
        </View>
        <View className="gap-1.5">
          <Text className="font-body-medium text-[15px] text-ink">
            Password
          </Text>
          <TextInput
            className={field}
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            placeholderTextColorClassName="accent-muted"
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            onSubmitEditing={submit}
          />
        </View>
        {error ? (
          <Text className="font-body-medium text-[15px] text-accent">
            {error}
          </Text>
        ) : null}
        <Pressable
          onPress={submit}
          disabled={loading}
          className="items-center rounded-[4px] border-2 border-line bg-accent py-3.5 active:opacity-80 disabled:opacity-60"
        >
          <Text className="font-brand pr-1 text-[22px] tracking-[1px] text-on-accent uppercase">
            {loading ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
      </KeyboardAvoidingView>
    </Safe>
  );
}
