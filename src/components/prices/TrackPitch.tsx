// Where the shelf buttons go for someone not signed in (the web's
// ShelfAction pitch): a ticket like Buy next's, with a tear-off stub to tap.
// It promises a phone alert: push must be set up before this ships (the
// owner's call, 2026-11-21)
import { useCorners } from "@/lib/mangaThemes";
import Tap from "@/components/Tap";
import { router } from "expo-router";
import { Text, View } from "react-native";
import { useRipple } from "@/lib/press";

// a long name is cut to its first two words: "Frieren: Beyond.."
function shortName(name: string) {
  const words = name.trim().split(/\s+/);
  return words.length > 2 ? `${words.slice(0, 2).join(" ")}..` : name.trim();
}

// Two things to offer, and only the true one is said. A series with more
// to come: a nudge when its next volume is out. One with every volume out
// (`finished`): there's no next volume to promise, so it's the shelf itself
const PITCH = {
  coming: {
    label: "Next volume",
    question: (name: string) =>
      `Want a nudge when the next volume for ${name} comes out?`,
    how: "Phone alert, New tab, weekly email",
  },
  finished: {
    label: "Your shelf",
    question: (name: string) =>
      `Collecting ${name}? Keep track of the volumes you own.`,
    how: "What's left to get, price alerts, your place",
  },
};

export default function TrackPitch({
  name,
  finished = false,
}: {
  name: string;
  // nothing more is coming: every volume is out
  finished?: boolean;
}) {
  const corners = useCorners();
  const ripple = useRipple();
  const pitch = PITCH[finished ? "finished" : "coming"];
  const question = pitch.question(shortName(name));
  return (
    <View className="gap-2">
      {/* a solid card under the tinted stub, so the page's background
          drawing never shows through */}
      <Tap
        onPress={() => router.push("/sign-up")}
        android_ripple={ripple}
        accessibilityRole="button"
        accessibilityLabel={`${question} Track this series`}
        className="flex-row overflow-hidden rounded-[12px] border-[1.5px] border-accent bg-card active:opacity-90"
        style={corners.box}
      >
        <View className="min-w-0 flex-1 gap-1 px-3 py-2.5">
          <Text className="font-mono-medium text-[11.5px] tracking-[1.5px] text-accent-ink uppercase">
            {pitch.label}
          </Text>
          <Text className="font-body-semibold text-[15.5px] leading-[21px] text-ink">
            {question}
          </Text>
          <Text className="font-body text-[13px] text-ink-soft">
            {pitch.how}
          </Text>
        </View>
        <View className="w-[84px] items-center justify-center border-l-[1.5px] border-dashed border-accent bg-accent-wash">
          <Text className="font-brand pr-[5px] text-[20px] tracking-[1px] text-accent-ink uppercase">
            Track
            {"\u00A0"}
          </Text>
        </View>
      </Tap>
      {/* in line with the ticket's own words, not the ticket's edge */}
      <Text className="px-3 font-body text-[13px] text-ink-soft">
        <Text
          onPress={() => router.push("/sign-in")}
          className="font-body-semibold text-ink"
        >
          Sign in
        </Text>{" "}
        if you have a shelf.
      </Text>
    </View>
  );
}
