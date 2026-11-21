// Prices settings (the web's PricesTab): ebooks hidden on volume pages, and
// which country's prices
import { usePrefs } from "@/store/prefs";
import { Radios, Section, Tick } from "./parts";

const COUNTRIES = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada: every price in Canadian dollars" },
] as const;

export default function PricesTab() {
  const prefs = usePrefs((s) => s.prefs);
  const save = usePrefs((s) => s.save);
  return (
    <>
      <Section title="Ebooks">
        <Tick
          label="Hide ebooks on volume pages"
          value={prefs.hideEbooks === "yes"}
          onChange={(on) =>
            void save({ hideEbooks: on ? "yes" : "no" }).catch(() => {})
          }
        />
      </Section>
      <Section title="Where you buy">
        <Radios
          label="Country"
          options={COUNTRIES}
          value={prefs.country === "ca" ? "ca" : "us"}
          onChange={(value) => void save({ country: value }).catch(() => {})}
        />
      </Section>
    </>
  );
}
