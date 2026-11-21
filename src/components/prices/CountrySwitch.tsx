// US or Canada, on the price pages (the web's canada/CountrySwitch): which
// country's prices, saved on the account
import { usePrefs } from "@/store/prefs";
import Segmented from "../Segmented";

const COUNTRIES = [
  { value: "us", label: "US" },
  { value: "ca", label: "Canada" },
] as const;

export default function CountrySwitch() {
  const country = usePrefs((s) => (s.prefs.country === "ca" ? "ca" : "us"));
  const save = usePrefs((s) => s.save);
  return (
    <Segmented
      label="Country"
      options={COUNTRIES}
      value={country}
      onChange={(value) => void save({ country: value }).catch(() => {})}
    />
  );
}
