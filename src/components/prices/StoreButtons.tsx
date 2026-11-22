// The stores to look in, as buttons in two even columns (an odd last one
// takes the whole row, so no row is ragged): a volume's "More places to
// look" and a series' "More box sets at". `lead` makes the first the main
// action ("Preorder on Amazon")
import { openOutside } from "@/lib/openOutside";
import { Text, View } from "react-native";
import { look } from "@/lib/platformLook";
import PressScale from "../PressScale";

export default function StoreButtons({
  links,
  lead = false,
  describe = (store) => `${store}. Opens the store`,
}: {
  links: { store: string; url: string }[];
  lead?: boolean;
  describe?: (store: string) => string;
}) {
  const lastAlone = links.length % 2 === 1;
  return (
    <View className="flex-row flex-wrap" style={{ gap: 8 }}>
      {links.map((s, i) => {
        const main = lead && i === 0;
        const wide = lastAlone && i === links.length - 1;
        return (
          <PressScale
            key={s.store}
            onPress={() => openOutside(s.url)}
            accessibilityRole="link"
            accessibilityLabel={describe(s.store)}
            style={{ flexBasis: wide ? "100%" : "47%", flexGrow: 1 }}
            className={`min-h-[44px] items-center justify-center overflow-hidden px-3 ${look.buttonRadius} ${main ? "bg-accent" : "bg-ink/10"}`}
          >
            <Text
              numberOfLines={1}
              className={`font-body-semibold text-[14.5px] ${main ? "text-on-accent" : "text-ink"}`}
            >
              {main ? `Preorder on ${s.store}` : s.store}
            </Text>
          </PressScale>
        );
      })}
    </View>
  );
}
