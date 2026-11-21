// Forgot password, as the web's pages/ForgotPassword/ForgotPassword.tsx: the
// recovery email gets a reset link (it opens the website's reset page, or
// this app's when the link is set up to open it)
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AuthArt from "@/components/AuthArt";
import Button from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { apiFetch, errorMessages } from "@/core/lib/api";
import { orOffline } from "@/core/lib/offline";

const Safe = withUniwind(SafeAreaView);

const BackToSignIn = ({ words }: { words: string }) => (
  <Text className="font-body text-[14.5px] text-ink-soft">
    {words}{" "}
    <Text
      onPress={() => router.back()}
      className="font-body-semibold text-ink underline"
    >
      Sign in
    </Text>
  </Text>
);

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [sentAgain, setSentAgain] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const send = async (address: string) => {
    setError("");
    setLoading(true);
    try {
      const result = await apiFetch("/api/auth/initiatePassReset", {
        method: "POST",
        body: { email: address },
      });
      if (result.ok) return true;
      setError((await errorMessages(result))[0] ?? "That didn't send.");
    } catch {
      setError(orOffline("We couldn't send it. Try again in a minute."));
    } finally {
      setLoading(false);
    }
    return false;
  };

  const submit = async () => {
    const address = email.trim();
    if (!address) {
      setError("Enter your recovery email.");
      return;
    }
    if (await send(address)) setSentTo(address);
  };

  return (
    <Safe className="flex-1 bg-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="gap-5 px-6 pt-6 pb-10"
        >
          {sentTo ? (
            <>
              <AuthArt
                sfx="Sent!"
                line="Check your inbox. The link works for 15 minutes."
              />
              <Text className="font-body text-[15px] leading-[22px] text-ink">
                If <Text className="font-body-semibold">{sentTo}</Text> is an
                account's recovery email, a reset link is on its way.
              </Text>
              <View className="gap-1">
                <Text className="font-body text-[14.5px] text-ink-soft">
                  • The link works for 15 minutes.
                </Text>
                <Text className="font-body text-[14.5px] text-ink-soft">
                  • Nothing there? Look in spam.
                </Text>
              </View>
              {error ? (
                <Text className="font-body-medium text-[14.5px] text-accent">
                  {error}
                </Text>
              ) : null}
              <Button
                disabled={loading}
                label={loading ? "Sending…" : "Send it again"}
                onPress={() => void send(sentTo).then(setSentAgain)}
              />
              {sentAgain && !loading ? (
                <Text className="font-body text-[14px] text-ink-soft">
                  Sent again.
                </Text>
              ) : null}
              <BackToSignIn words="Back to" />
            </>
          ) : (
            <>
              <AuthArt
                sfx="Lost it?"
                line="It happens to every hero. We'll send you a way back in."
              />
              <Text className="font-body text-[15px] leading-[22px] text-ink-soft">
                Enter your recovery email. We'll send a link to choose a new
                password.
              </Text>
              <Field label="Recovery email" error={error || undefined}>
                <Input
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  invalid={Boolean(error)}
                  onSubmitEditing={() => void submit()}
                />
                <Text className="font-body text-[13px] text-muted">
                  The one you saved in Settings, under Account.
                </Text>
              </Field>
              <Button
                kind="primary"
                wide
                disabled={loading}
                label={loading ? "Sending…" : "Send reset link"}
                onPress={() => void submit()}
              />
              <BackToSignIn words="Remembered it?" />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Safe>
  );
}
