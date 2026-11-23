// Choosing a new password from a reset link, as the web's pages/
// ResetPassword/ResetPassword.tsx: the link is checked first, then the
// password twice. Opened by the link itself (mangatracker://reset-password/
// <token>, or the website's address once the app is set to open it)
import { columnStyle } from "@/lib/wide";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, ScrollView, Text } from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { withUniwind } from "uniwind";
import { Spread } from "@/components/AuthArt";
import Button from "@/components/Button";
import { Field } from "@/components/Field";
import PasswordInput from "@/components/PasswordInput";
import { apiFetch, errorMessages } from "@/core/lib/api";
import { orOffline } from "@/core/lib/offline";
import { NEW_PASSWORD_MIN } from "@/core/lib/passwordRule";

const Safe = withUniwind(SafeAreaView);
const LINK_GONE = 410;

type Stage = "checking" | "ready" | "gone" | "unreachable" | "done";

const toSignIn = () => router.replace("/sign-in");
const BackToSignIn = () => (
  <Text
    onPress={toSignIn}
    className="self-start font-body-semibold text-[15px] text-ink underline"
  >
    Back to sign in
  </Text>
);
const Words = ({ children }: { children: string }) => (
  <Text className="font-body text-[15px] leading-[22px] text-ink-soft">
    {children}
  </Text>
);

export default function ResetPassword() {
  const { token = "" } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [stage, setStage] = useState<Stage>("checking");
  const [checks, setChecks] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [wrongBox, setWrongBox] = useState<"password" | "again" | null>(null);

  useEffect(() => {
    const stop = new AbortController();
    apiFetch(`/api/auth/verifytoken/${encodeURIComponent(token)}`, {
      signal: stop.signal,
    })
      .then((result) => {
        if (result.ok) setStage("ready");
        else setStage(result.status === LINK_GONE ? "gone" : "unreachable");
      })
      .catch(() => {
        if (!stop.signal.aborted) setStage("unreachable");
      });
    return () => stop.abort();
  }, [token, checks]);

  const submit = async () => {
    setError("");
    setWrongBox(null);
    const refuse = (box: "password" | "again", message: string) => {
      setWrongBox(box);
      setError(message);
    };
    if (password.length < NEW_PASSWORD_MIN)
      return refuse(
        "password",
        `Passwords need at least ${NEW_PASSWORD_MIN} characters.`,
      );
    if (!password.trim())
      return refuse("password", "A password needs more than spaces.");
    if (password !== again)
      return refuse("again", "The two passwords don't match.");

    setSaving(true);
    try {
      const result = await apiFetch(
        `/api/auth/resetPassword/${encodeURIComponent(token)}`,
        {
          method: "POST",
          body: { newPassword: password, confirmPassword: again },
        },
      );
      if (result.ok) setStage("done");
      else if (result.status === LINK_GONE) setStage("gone");
      else setError((await errorMessages(result))[0] ?? "That didn't save.");
    } catch {
      setError(orOffline("We couldn't save it. Try again in a minute."));
    } finally {
      setSaving(false);
    }
  };

  let body;
  if (stage === "done")
    body = (
      <Spread
        sfx="You're back!"
        chapter="374"
        line="Your shelf is right where you left it."
        title="Password changed"
      >
        <Words>
          Your new password is saved. Other devices were signed out, to be safe.
        </Words>
        <Button kind="primary" label="Sign in" onPress={toSignIn} />
      </Spread>
    );
  else if (stage === "gone")
    body = (
      <Spread
        sfx="Too late!"
        line="Reset links only last 15 minutes, and work once."
        title="Link ran out"
      >
        <Words>
          This reset link has run out or was already used. Your password hasn't
          changed.
        </Words>
        <Button
          kind="primary"
          label="Send a new link"
          onPress={() => router.replace("/forgot-password")}
        />
        <BackToSignIn />
      </Spread>
    );
  else if (stage === "unreachable")
    body = (
      <Spread
        sfx="Hold on!"
        line="Your link is fine. We just couldn't check it."
        title="Couldn't check"
      >
        <Words>
          We couldn't reach Manga Tracker to check your link. Your password
          hasn't changed.
        </Words>
        <Button
          label="Try again"
          onPress={() => {
            setStage("checking");
            setChecks((n) => n + 1);
          }}
        />
        <BackToSignIn />
      </Spread>
    );
  else
    body = (
      <Spread
        sfx="New page!"
        line="Pick a password you'll remember this time."
        title="New password"
      >
        <Field
          label="New password"
          error={wrongBox === "password" ? error : undefined}
        >
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={wrongBox === "password"}
            editable={stage === "ready"}
          />
          <Text className="font-body text-[13px] text-muted">
            At least {NEW_PASSWORD_MIN} characters.
          </Text>
        </Field>
        <Field
          label="Type it again"
          error={wrongBox === "again" ? error : undefined}
        >
          <PasswordInput
            value={again}
            onChangeText={setAgain}
            autoComplete="new-password"
            textContentType="newPassword"
            invalid={wrongBox === "again"}
            editable={stage === "ready"}
            onSubmitEditing={() => void submit()}
          />
        </Field>
        {error && !wrongBox ? (
          <Text className="font-body-medium text-[14.5px] text-accent">
            {error}
          </Text>
        ) : null}
        <Button
          kind="primary"
          wide
          disabled={saving || stage !== "ready"}
          label={
            stage === "checking"
              ? "Checking your link…"
              : saving
                ? "Saving…"
                : "Save new password"
          }
          onPress={() => void submit()}
        />
      </Spread>
    );

  return (
    <Safe className="flex-1 bg-paper">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-6 pt-6 pb-10"
          contentContainerStyle={columnStyle}
        >
          {body}
        </ScrollView>
      </KeyboardAvoidingView>
    </Safe>
  );
}
