// The weekly email, on or off, beside the phone's alerts (the web's
// AccountTab section): sent to the account's email once its link is pressed
import { useState } from "react";
import { Text, View } from "react-native";
import type { Account } from "@/core/lib/account";
import { useAccount } from "@/store/account";
import Button from "../Button";
import { Help, Note, Tick } from "./parts";

const LINK_NOT_SENT = "We couldn't send the link. Try again in a minute.";
type NoteOf = { text: string; failed?: boolean } | null;

export default function WeeklyEmail({ account }: { account: Account }) {
  const setWeeklyEmail = useAccount((s) => s.weeklyEmail);
  const [weeklyNote, setWeeklyNote] = useState<NoteOf>(null);
  const [weeklySaving, setWeeklySaving] = useState(false);

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

  // no address to send to: said, with where to add one
  if (!account.recoveryEmail)
    return (
      <Help>
        A weekly email too, once you add an email under Account: new volumes for
        your shelf and price drops on your To buy list.
      </Help>
    );
  return (
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
      <Help>
        New volumes for your shelf, and price drops on your To buy list. Only
        sent when there's news.
      </Help>
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
  );
}
