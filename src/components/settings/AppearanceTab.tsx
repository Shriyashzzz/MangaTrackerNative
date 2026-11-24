// Light, dark, or the device's own, and the drawing behind the pages (the
// web's AppearanceTab; the drawings are components/Backdrop.tsx). On an
// iPhone, Premium's manga themes too (lib/mangaThemes.ts): a whole look
// each, which stands in for both while it's worn
import { BACKGROUNDS, DEFAULT_BACKGROUND } from "@/components/Backdrop";
import Tap from "@/components/Tap";
import {
  MANGA_THEMES,
  THEMES_HERE,
  useLook,
  useWornTheme,
  type MangaTheme,
} from "@/lib/mangaThemes";
import { usePlan } from "@/store/plan";
import { usePrefs } from "@/store/prefs";
import { Text, View } from "react-native";
import { Help, Radios, Section } from "./parts";

const THEMES = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "Same as my device" },
] as const;

// one theme's card: its paper, its ink lettering its name, its accent as a
// bar, and a PREMIUM stamp where it isn't theirs
function ThemeCard({
  id,
  on,
  locked,
  onPress,
}: {
  id: MangaTheme;
  on: boolean;
  locked: boolean;
  onPress: () => void;
}) {
  const t = MANGA_THEMES.find((m) => m.id === id)!;
  const [paper, ink, accent] = t.swatch;
  return (
    <Tap
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: on }}
      accessibilityLabel={`${t.name}: ${t.tagline}${locked ? ". Premium" : ""}`}
      className={`w-[48%] overflow-hidden rounded-[10px] ${on ? "border-[3px] border-accent" : "border-2 border-line"}`}
      // its own corners, as it would wear them
      style={{ backgroundColor: paper, borderRadius: t.corners.panel }}
    >
      {/* where it's locked, room under the words for the PREMIUM stamp on
          the bar, so the line keeps the card's whole width */}
      <View className={`gap-1 px-3 pt-3 ${locked ? "pb-5" : "pb-2.5"}`}>
        <Text
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
          className="pr-[4px] text-[22px] tracking-[0.5px] uppercase"
          style={{ color: ink, fontFamily: t.font }}
        >
          {t.name}
          {" "}
        </Text>
        <Text
          numberOfLines={2}
          className="font-body text-[12px] leading-[16px]"
          style={{ color: ink, opacity: 0.75 }}
        >
          {t.tagline}
        </Text>
      </View>
      <View style={{ height: 8, backgroundColor: accent }} />
      {locked ? (
        <View
          className="absolute right-2 bottom-1 border-[1.5px] border-ink bg-accent px-1.5 pt-[1px]"
          style={{ transform: [{ rotate: "4deg" }] }}
        >
          <Text className="font-brand pr-[3px] text-[11px] tracking-[0.5px] text-on-accent uppercase">
            Premium{" "}
          </Text>
        </View>
      ) : null}
    </Tap>
  );
}

export default function AppearanceTab() {
  const theme = usePrefs((s) => s.prefs.theme ?? "system");
  const background = usePrefs((s) => s.prefs.background ?? DEFAULT_BACKGROUND);
  const save = usePrefs((s) => s.save);
  const picked = useLook((s) => s.picked);
  const pick = useLook((s) => s.pick);
  const worn = useWornTheme();
  const premium = usePlan((s) => !s.plan.limited);
  const tryOn = useLook((s) => s.tryOn);
  const takeOff = useLook((s) => s.takeOff);
  return (
    <>
      {THEMES_HERE ? (
        <Section first title="Manga themes">
          <Help>
            {premium
              ? "A whole new look for the app, each one a manga genre."
              : "A whole new look for the app, each one a manga genre. Part of Premium: tap one to try it for 2 minutes."}
          </Help>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {MANGA_THEMES.map((t) => (
              <ThemeCard
                key={t.id}
                id={t.id}
                on={worn === t.id}
                locked={!premium}
                // without Premium: worn for two minutes to try it on
                onPress={() =>
                  premium
                    ? pick(picked === t.id ? null : t.id)
                    : worn === t.id
                      ? takeOff()
                      : tryOn(t.id)
                }
              />
            ))}
          </View>
        </Section>
      ) : null}
      <Section first={!THEMES_HERE} title="Theme">
        {worn ? (
          <Help>Wearing a manga theme. Pick one of these to go back.</Help>
        ) : null}
        <Radios
          label="Theme"
          options={THEMES}
          value={worn ? ("" as never) : theme}
          onChange={(value) => {
            pick(null);
            takeOff();
            void save({ theme: value }).catch(() => {});
          }}
        />
      </Section>
      {worn ? null : (
        <Section title="Background">
          <Radios
            label="Background"
            options={BACKGROUNDS}
            value={background}
            onChange={(value) =>
              void save({ background: value }).catch(() => {})
            }
          />
        </Section>
      )}
    </>
  );
}
