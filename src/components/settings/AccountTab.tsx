// The account (the web's AccountTab): who's signed in, how they sign in,
// their email, the weekly email, export, and deleting
// the account with its confirmation
import { router } from "expo-router";
import { useState } from "react";
import { Share, Text, View } from "react-native";
import { deleteAccount, shelfToCsv, type Account } from "@/core/lib/account";
import { apiFetch, getJson } from "@/core/lib/api";
import type { OwnedBook } from "@/core/lib/books";
import type { Manga } from "@/core/lib/types";
import { useAccount } from "@/store/account";
import { useAuth } from "@/store/auth";
import { usePrefs } from "@/store/prefs";
import { useShelf } from "@/store/shelf";
import Button from "../Button";
import { Input } from "../Field";
import PasswordInput from "../PasswordInput";
import { Help, Note, Section, Tick } from "./parts";

const LINK_NOT_SENT = "We couldn't send the link. Try again in a minute.";
type NoteOf = { text: string; failed?: boolean } | null;

function SignInSection({ account }: { account: Account }) {
  const firstPassword = useAccount((s) => s.firstPassword);
  const [password, setPassword] = useState("");
  const [passwordNote, setPasswordNote] = useState<NoteOf>(null);
  const [saving, setSaving] = useState(false);
  const savePassword = async () => {
    setPasswordNote(null);
    setSaving(true);
    try {
      await firstPassword(password);
      setPassword("");
      setPasswordNote({ text: "Saved." });
    } catch (error) {
      setPasswordNote({ text: (error as Error).message, failed: true });
    } finally {
      setSaving(false);
    }
  };
  return (
    <Section first title="Signing in">
      {account.google ? (
        <Help>You can sign in with Google.</Help>
      ) : (
        <Help>
          Linking Google to this account is done on the website for now.
        </Help>
      )}
      {!account.hasPassword ? (
        <>
          <Help>Add a password to sign in without Google</Help>
          <PasswordInput
            value={password}
            onChangeText={setPassword}
            placeholder="A password"
          />
          <View className="flex-row items-center gap-3">
            <Button
              label="Save password"
              kind="primary"
              small
              disabled={saving || !password}
              onPress={() => void savePassword()}
            />
            <Note text={passwordNote?.text} failed={passwordNote?.failed} />
          </View>
        </>
      ) : null}
    </Section>
  );
}

export default function AccountTab({ account }: { account: Account }) {
  const logOut = useAuth((s) => s.logOut);
  const saveAccount = useAccount((s) => s.save);
  const setWeeklyEmail = useAccount((s) => s.weeklyEmail);
  const [weeklyNote, setWeeklyNote] = useState<NoteOf>(null);
  const [weeklySaving, setWeeklySaving] = useState(false);
  const [email, setEmail] = useState(account.recoveryEmail ?? "");
  const [emailNote, setEmailNote] = useState<NoteOf>(null);
  const [exportFailed, setExportFailed] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const switchWeekly = async (on: boolean, said: string) => {
    setWeeklyNote(null);
    setWeeklySaving(true);
    try {
      await setWeeklyEmail(on);
      if (useAccount.getState().account?.confirmNotSent)
        setWeeklyNote({ text: LINK_NOT_SENT, failed: true });
      else setWeeklyNote({ text: said });
    } catch (error) {
      setWeeklyNote({ text: (error as Error).message, failed: true });
    } finally {
      setWeeklySaving(false);
    }
  };
  const waitingToConfirm =
    account.weeklyEmail && !account.emailConfirmed && !account.confirmNotSent;
  const saveEmail = async () => {
    setEmailNote(null);
    try {
      await saveAccount({ recoveryEmail: email.trim() || null });
      setEmailNote({ text: email.trim() ? "Saved." : "Removed." });
      if (useAccount.getState().account?.confirmNotSent)
        setWeeklyNote({ text: LINK_NOT_SENT, failed: true });
    } catch (error) {
      setEmailNote({ text: (error as Error).message, failed: true });
    }
  };
  // the spreadsheet of their shelf, handed to whatever they pick on the
  // phone's share sheet (a file app, email, Drive)
  const exportList = async () => {
    setExportFailed(false);
    try {
      const res = await apiFetch("/api/manga");
      if (!res.ok) throw new Error(res.statusText);
      const { manga } = (await res.json()) as { manga: Manga[] };
      const { books } = await getJson<{
        books: (OwnedBook & { mangaId: number })[];
      }>("/api/manga/books").catch(() => ({ books: [] }));
      const bySeries: Record<number, OwnedBook[]> = {};
      for (const book of books) (bySeries[book.mangaId] ??= []).push(book);
      await Share.share({
        title: "manga-tracker-shelf.csv",
        message: shelfToCsv(manga, bySeries),
      });
    } catch {
      setExportFailed(true);
    }
  };
  const confirmDelete = async () => {
    setDeleteError("");
    setDeleting(true);
    try {
      await deleteAccount(
        account.hasPassword ? { password } : { username: password },
      );
      await logOut();
      useShelf.getState().reset();
      usePrefs.getState().reset();
      useAccount.getState().clear();
      router.dismissAll();
    } catch (error) {
      setDeleteError((error as Error).message);
      setDeleting(false);
    }
  };

  return (
    <View className="gap-7">
      <Text className="font-body text-[15px] text-ink">
        Signed in as{" "}
        <Text className="font-body-semibold">{account.username}</Text>.
      </Text>
      <SignInSection account={account} />
      <Section title="Email">
        <Input
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Email (optional)"
        />
        <Help>For password resets and the weekly email.</Help>
        <View className="flex-row items-center gap-3">
          <Button
            label="Save email"
            kind="primary"
            small
            onPress={() => void saveEmail()}
          />
          <Note text={emailNote?.text} failed={emailNote?.failed} />
        </View>
      </Section>
      <Section title="Weekly email">
        <Help>
          New volumes for your shelf, and price drops on your To buy list. Only
          sent when there's news.
        </Help>
        {account.recoveryEmail ? (
          <>
            <Tick
              label="Send me the weekly email"
              value={account.weeklyEmail}
              onChange={(on) =>
                void switchWeekly(
                  on,
                  on
                    ? account.emailConfirmed
                      ? "It's on."
                      : "Check your inbox."
                    : "It's off.",
                )
              }
            />
            {waitingToConfirm ? (
              <Help>
                Almost there: press Start my weekly email in the email to{" "}
                <Text className="font-body-semibold text-ink">
                  {account.recoveryEmail}
                </Text>
                . No email? Send the link again.
              </Help>
            ) : null}
            {account.weeklyEmail && account.emailConfirmed ? (
              <Help>
                Sent to{" "}
                <Text className="font-body-semibold text-ink">
                  {account.recoveryEmail}
                </Text>
                .
              </Help>
            ) : null}
            <View className="flex-row flex-wrap items-center gap-3">
              {account.weeklyEmail && !account.emailConfirmed ? (
                <Button
                  label="Send the link again"
                  small
                  disabled={weeklySaving}
                  onPress={() => void switchWeekly(true, "Sent again.")}
                />
              ) : null}
              <Note text={weeklyNote?.text} failed={weeklyNote?.failed} />
            </View>
          </>
        ) : (
          <Help>Add an email above to get it.</Help>
        )}
      </Section>
      {/* Alerts on this device: back once the server sends to the app's own
          push tokens (README, Not done yet) */}
      <Section title="Export my list">
        <Help>
          A spreadsheet file of everything on your shelf, notes included.
        </Help>
        <View className="flex-row items-center gap-3">
          <Button
            label="Download my list"
            small
            onPress={() => void exportList()}
          />
          {exportFailed ? (
            <Note text="That didn't work. Try again." failed />
          ) : null}
        </View>
      </Section>
      <Section title="Delete my account">
        <Help>
          This removes your account and your whole shelf for good. There's no
          undo, so download your list first if you might want it.
        </Help>
        {confirming ? (
          <View className="gap-2">
            <Help>
              {account.hasPassword
                ? "Enter your password to confirm"
                : `Type your username, ${account.username}, to confirm`}
            </Help>
            {account.hasPassword ? (
              <PasswordInput
                value={password}
                onChangeText={setPassword}
                autoFocus
                invalid={Boolean(deleteError)}
              />
            ) : (
              <Input
                value={password}
                onChangeText={setPassword}
                autoFocus
                autoCapitalize="none"
                invalid={Boolean(deleteError)}
              />
            )}
            <Note text={deleteError || null} failed />
            <View className="flex-row flex-wrap gap-3">
              <Button
                label={deleting ? "Deleting…" : "Delete everything"}
                kind="danger"
                small
                disabled={deleting || !password}
                onPress={() => void confirmDelete()}
              />
              <Button
                label="Keep my account"
                small
                disabled={deleting}
                onPress={() => {
                  setConfirming(false);
                  setPassword("");
                  setDeleteError("");
                }}
              />
            </View>
          </View>
        ) : (
          <Button
            label="Delete my account"
            kind="danger"
            small
            onPress={() => setConfirming(true)}
          />
        )}
      </Section>
    </View>
  );
}
