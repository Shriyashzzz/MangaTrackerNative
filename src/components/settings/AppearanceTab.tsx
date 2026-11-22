// Light, dark, or the device's own, and the drawing behind the pages (the
// web's AppearanceTab; the drawings are components/Backdrop.tsx)
import { BACKGROUNDS, DEFAULT_BACKGROUND } from "@/components/Backdrop";
import { usePrefs } from "@/store/prefs";
import { Radios, Section } from "./parts";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Same as my device" },
] as const;

export default function AppearanceTab() {
  const theme = usePrefs((s) => s.prefs.theme ?? "system");
  const background = usePrefs((s) => s.prefs.background ?? DEFAULT_BACKGROUND);
  const save = usePrefs((s) => s.save);
  return (
    <>
      <Section first title="Theme">
        <Radios
          label="Theme"
          options={THEMES}
          value={theme}
          onChange={(value) => void save({ theme: value }).catch(() => {})}
        />
      </Section>
      <Section title="Background">
        <Radios
          label="Background"
          options={BACKGROUNDS}
          value={background}
          onChange={(value) => void save({ background: value }).catch(() => {})}
        />
      </Section>
    </>
  );
}
