// A new collector's first look at their shelf (the web's ShelfStates
// EmptyShelf): Kenji, "Start your shelf", and the ways to fill it, each
// drawn alike so none hides the others. A phone has its camera to hand, so
// scanning comes first. In a paper box with an ink border, as on the web.
// (The web's "Take the tour" isn't here: the app's practice shelf signs the
// reader out when it ends, so it's offered only before an account exists)
import { router } from "expo-router";
import { Text, View } from "react-native";
import Button from "./Button";
import Mascot from "./Mascot";
import { useCorners } from "@/lib/mangaThemes";

const WAYS = [
  {
    label: "Scan barcodes",
    hint: "Point your camera at the back of each volume.",
    to: "/scan",
  },
  {
    label: "Add by name",
    hint: "Search for a series and tick what you own.",
    to: "/add",
  },
  {
    label: "Import a list",
    hint: "MyAnimeList, AniList, Kitsu, Goodreads or a spreadsheet.",
    to: "/import",
  },
] as const;

export default function EmptyShelf() {
  const corners = useCorners();
  return (
    <View
      className="w-full max-w-[480px] items-center self-center border-2 border-line bg-paper px-6 py-8"
      style={corners.panel}
    >
      <Mascot mood="happy" width={76} />
      {/* one line in every theme's lettering: a wide face shrinks to fit */}
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.6}
        className="mt-3 self-stretch text-center font-brand pr-[6px] text-[36px] leading-[40px] tracking-[1px] text-ink uppercase"
      >
        Start your shelf{" "}
      </Text>
      <View className="mt-6 w-full max-w-[340px] gap-5">
        {WAYS.map((way) => (
          <View key={way.label} className="gap-2">
            <Button
              wide
              label={way.label}
              onPress={() => router.push(way.to)}
            />
            {/* the reading face, a step down and softer than the
                button's words, centred under it: a caption, not a code */}
            <Text className="px-2 text-center font-body text-[14px] leading-[20px] text-ink-soft">
              {way.hint}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
