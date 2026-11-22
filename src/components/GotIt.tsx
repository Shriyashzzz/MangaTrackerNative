// Buy next's "I've got this one", as the Android app's (web pages/Details/
// GotIt.tsx): two pills on the ticket, one tap each. On my shelf records it
// (and its volumes); Ordered keeps it on its way, so Buy next moves past it
import Tap from "@/components/Tap";
import { Text, View } from "react-native";

export default function GotIt({
  name,
  onShelf,
  onOrdered,
  owning,
  ordering,
}: {
  // what it's about, for screen readers: "Vol. 7", "Deluxe 3"
  name: string;
  // missing when the page can't put it on the shelf from here
  onShelf?: () => void;
  onOrdered?: () => void;
  owning: boolean;
  ordering: boolean;
}) {
  const choices = [
    onShelf && {
      label: owning ? "Saving…" : "On my shelf",
      said: `${name}: on my shelf`,
      busy: owning,
      run: onShelf,
    },
    onOrdered && {
      label: ordering ? "Saving…" : "Ordered",
      said: `${name}: ordered`,
      busy: ordering,
      run: onOrdered,
    },
  ].filter((c): c is Exclude<typeof c, false | undefined> => Boolean(c));
  if (!choices.length) return null;
  return (
    <View className="flex-row gap-1.5">
      {choices.map((c) => (
        <Tap
          key={c.said}
          onPress={c.run}
          disabled={c.busy}
          accessibilityLabel={c.said}
          className={`rounded-full border-[1.5px] border-accent bg-card px-2.5 py-1.5 active:bg-accent ${c.busy ? "opacity-50" : ""}`}
        >
          <Text className="font-mono-medium text-[11px] tracking-[0.5px] text-accent-ink uppercase">
            {c.label}
          </Text>
        </Tap>
      ))}
    </View>
  );
}
