// New releases (the web's NewReleasesTab): checks on or off, and what New
// lists when they're on
import { useAccount } from "@/store/account";
import WeeklyEmail from "./WeeklyEmail";
import PhoneAlerts from "./PhoneAlerts";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { usePrefs } from "@/store/prefs";
import ReleaseControls from "./ReleaseControls";
import { Help, Section, Tick } from "./parts";

export default function NewReleasesTab() {
  const account = useAccount((st) => st.account);
  const checksOn = usePrefs((s) => s.prefs.releaseChecks !== "off");
  const save = usePrefs((s) => s.save);
  return (
    <>
      <Section first title="New releases">
        <Tick
          label="Check for new volumes and chapters"
          value={checksOn}
          onChange={(on) =>
            void save({ releaseChecks: on ? "on" : "off" }).catch(() => {})
          }
        />
        {!checksOn ? (
          <Help>
            Off. Your shelf has no New tab, and manga pages don't show new
            releases or next chapter dates. Prices still work.
          </Help>
        ) : null}
        {/* how they're told, right under the switch: on this phone, and by
            email */}
        <PhoneAlerts />
        {account ? <WeeklyEmail account={account} /> : null}
      </Section>
      {/* what counts as new, for volumes and for chapters: a box each */}
      {checksOn ? (
        <View className="mt-6 gap-3">
          <Help>
            What your shelf's New tab lists.{" "}
            <Text
              className="font-body-semibold text-ink underline"
              onPress={() => router.push("/new-releases")}
            >
              How this works
            </Text>
          </Help>
          <ReleaseControls />
        </View>
      ) : null}
    </>
  );
}
