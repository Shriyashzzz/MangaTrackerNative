// Light, dark, or the device's own (the web's AppearanceTab). The website
// also picks a background drawing; the app's screens have none
import { usePrefs } from "@/store/prefs";
import { Radios, Section } from "./parts";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Same as my device" },
] as const;

export default function AppearanceTab() {
  const theme = usePrefs((s) => s.prefs.theme ?? "system");
  const save = usePrefs((s) => s.save);
  return (
    <Section title="Theme">
      <Radios
        label="Theme"
        options={THEMES}
        value={theme}
        onChange={(value) => void save({ theme: value }).catch(() => {})}
      />
    </Section>
  );
}
