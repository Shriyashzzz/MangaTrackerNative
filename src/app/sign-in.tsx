// Signing in, as the web's pages/SignIn: username and password, the
// server's own words when it says no
import AuthArt from "@/components/AuthArt";
import GoogleButton from "@/components/GoogleButton";
import { useAuth } from "@/store/auth";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, Pressable, Text, TextInput, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";

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
        <AuthArt
          sfx="Welcome back!"
          chapter="374"
          line="Your shelf is right where you left it."
        />

        <GoogleButton onBusy={setLoading} onError={setError} />
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
          <Text
            onPress={() => router.push("/forgot-password")}
            className="self-end font-body-medium text-[13.5px] text-ink-soft underline"
          >
            Forgot password?
          </Text>
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
          <Text className="font-brand pr-[5px] text-[22px] tracking-[1px] text-on-accent uppercase">
            {loading ? "Signing in…" : "Sign in"}
          </Text>
        </Pressable>
        <Text className="text-center font-body text-[14.5px] text-ink-soft">
          Don't have an account?{" "}
          <Text
            onPress={() => router.push("/sign-up")}
            className="font-body-semibold text-ink underline"
          >
            Sign up
          </Text>
        </Text>
      </KeyboardAvoidingView>
    </Safe>
  );
}
