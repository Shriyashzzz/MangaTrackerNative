// Creating an account, as the web's pages/SignUp/SignUp.tsx: username,
// password and an optional recovery email, the form's own checks first, then
// the server's words. The picks a shared shelf gave go on the new shelf
import { columnStyle } from "@/lib/wide";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, ScrollView, Text, View } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import AuthArt from "@/components/AuthArt";
import GoogleButton from "@/components/GoogleButton";
import Button from "@/components/Button";
import { Field, Input } from "@/components/Field";
import PasswordInput from "@/components/PasswordInput";
import { NEW_PASSWORD_MIN } from "@/core/lib/passwordRule";
import { addPicksToShelf } from "@/core/lib/sharePicks";
import { useAuth } from "@/store/auth";

const Safe = withUniwind(SafeAreaView);

export default function SignUp() {
  const signUp = useAuth((s) => s.signUp);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [passwordShort, setPasswordShort] = useState(false);
  const hasError = (about: RegExp) => errors.some((e) => about.test(e));

  const submit = async () => {
    setErrors([]);
    const name = username.trim();
    if (!name || !password) {
      setErrors(["Username and password are required."]);
      return;
    }
    const usernameSlip = !/^[a-z0-9]+$/i.test(name)
      ? "Usernames are letters and numbers only."
      : (name.length < 4 || name.length > 40) &&
        "Usernames need 4 to 40 letters or numbers.";
    const slips = [
      usernameSlip,
      password.length >= NEW_PASSWORD_MIN &&
        !password.trim() &&
        "A password needs more than spaces.",
    ].filter((slip): slip is string => Boolean(slip));
    const short = password.length < NEW_PASSWORD_MIN;
    setPasswordShort(short);
    if (slips.length || short) {
      setErrors(slips);
      return;
    }
    setLoading(true);
    try {
      const said = await signUp(name, password, email.trim());
      if (said.length) setErrors(said);
      else await addPicksToShelf();
      // signed in: the protected routes take over and show the shelf
    } catch {
      setErrors(["Something went wrong. Please try again."]);
    } finally {
      setLoading(false);
    }
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
          contentContainerStyle={columnStyle}
        >
          <AuthArt
            sfx="A new series begins!"
            chapter="1"
            line="Volume 1 of your shelf starts here."
          />
          <GoogleButton
            onBusy={setLoading}
            onError={(message) => setErrors(message ? [message] : [])}
          />
          <Field
            label="Username"
            error={hasError(/name/i) ? undefined : undefined}
          >
            <Input
              value={username}
              onChangeText={setUsername}
              placeholder="yourusername"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="username-new"
              textContentType="username"
              invalid={hasError(/name/i)}
            />
            <Text className="font-body text-[13px] text-muted">
              4–40 letters or numbers
            </Text>
          </Field>
          <Field label="Password">
            <PasswordInput
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (text.length >= NEW_PASSWORD_MIN) setPasswordShort(false);
              }}
              autoComplete="new-password"
              textContentType="newPassword"
              invalid={passwordShort || hasError(/password|secret/i)}
            />
            <Text
              accessibilityRole={passwordShort ? "alert" : undefined}
              className={`font-body text-[13px] ${passwordShort ? "text-accent" : "text-muted"}`}
            >
              At least {NEW_PASSWORD_MIN} characters.
            </Text>
          </Field>
          <Field label="Email" optional>
            <Input
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              invalid={hasError(/email/i)}
              onSubmitEditing={() => void submit()}
            />
            <Text className="font-body text-[13px] text-muted">
              Handy if you forget passwords.
            </Text>
          </Field>
          {errors.length ? (
            <View accessibilityRole="alert" className="gap-1">
              {errors.map((e) => (
                <Text
                  key={e}
                  className="font-body-medium text-[14.5px] text-accent"
                >
                  {e}
                </Text>
              ))}
            </View>
          ) : null}
          <Button
            kind="primary"
            wide
            disabled={loading}
            label={loading ? "Creating account…" : "Create account"}
            onPress={() => void submit()}
          />
          <Text className="text-center font-body text-[14.5px] text-ink-soft">
            Already have an account?{" "}
            <Text
              onPress={() => router.replace("/sign-in")}
              className="font-body-semibold text-ink underline"
            >
              Sign in
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </Safe>
  );
}
