// Settings, New releases: alerts on this phone, on or off (lib/phoneAlerts)
import { useState } from "react";
import { Linking } from "react-native";
import {
  phoneAlertsAvailable,
  phoneAlertsOn,
  turnOffPhoneAlerts,
  turnOnPhoneAlerts,
} from "@/lib/phoneAlerts";
import { Help, Tick } from "./parts";
import Button from "../Button";

const SAID = {
  denied: "Your phone has alerts for Manga Tracker switched off.",
  failed: "That didn't switch on. Try again in a moment.",
} as const;

export default function PhoneAlerts() {
  const [on, setOn] = useState(phoneAlertsOn);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<keyof typeof SAID | null>(null);
  // a build with no push project (a plain development build): no switch
  if (!phoneAlertsAvailable()) return null;

  const change = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    setProblem(null);
    if (!next) {
      setOn(false);
      await turnOffPhoneAlerts();
    } else {
      const result = await turnOnPhoneAlerts();
      setOn(result === "on");
      if (result === "denied" || result === "failed") setProblem(result);
    }
    setBusy(false);
  };

  return (
    <>
      <Tick label="Alerts on this phone" value={on} onChange={change} />
      <Help>
        {problem
          ? SAID[problem]
          : "A notification when a volume or chapter you're waiting for is out."}
      </Help>
      {problem === "denied" ? (
        <Button
          small
          label="Open phone settings"
          onPress={() => void Linking.openSettings()}
        />
      ) : null}
    </>
  );
}
