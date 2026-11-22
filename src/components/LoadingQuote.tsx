// What a slow load shows, a copy of the web's components/slowLoadQuote
// (same panel, sizes, words and timing): nothing for
// the first second, so a quick load never flashes it, then Kenji and a line
// from a manga to read while waiting, a new one every few seconds
import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import Animated, { Easing, FadeIn, FadeInDown } from "react-native-reanimated";
import { QUOTES } from "@/core/lib/content/quotes";
import { PRINTED } from "@/lib/printed";
import Mascot from "./Mascot";

// the web's --ease-ink
const INK_EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
const SHOW_AFTER_MS = 1000;
const NEXT_QUOTE_MS = 5000;

export default function LoadingQuote() {
  const [shown, setShown] = useState(false);
  const [index, setIndex] = useState(() =>
    Math.floor(Math.random() * QUOTES.length),
  );
  useEffect(() => {
    const timer = setTimeout(() => setShown(true), SHOW_AFTER_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    if (!shown) return;
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % QUOTES.length),
      NEXT_QUOTE_MS,
    );
    return () => clearInterval(timer);
  }, [shown]);

  if (!shown) return null;
  const quote = QUOTES[index]!;
  return (
    // the web's panel, piece for piece: floating in the middle of the
    // screen, Kenji in a ring on the left (printed: ink on paper in either
    // theme), the words on the right, the quote in comic lettering
    <View
      pointerEvents="none"
      className="absolute inset-0 z-40 items-center justify-center px-4"
    >
      <Animated.View
        entering={FadeInDown.duration(400).easing(INK_EASE)}
        accessibilityRole="progressbar"
        accessibilityLabel="Loading"
        className="w-full max-w-[460px] flex-row items-center gap-3.5 rounded-[4px] border-[2.5px] border-line bg-card py-3.5 pr-4 pl-3.5"
        style={{ boxShadow: "0px 18px 40px -18px rgba(20, 14, 8, 0.55)" }}
      >
        <View
          className="h-16 w-16 items-center justify-end overflow-hidden rounded-full border-2 border-line"
          style={{ backgroundColor: PRINTED.paper }}
        >
          <Mascot mood="happy" width={52} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="font-body text-[16px] leading-[22px] text-muted">
            Taking a moment. One to read while you wait:
          </Text>
          <Animated.View
            key={index}
            entering={FadeIn.duration(450).easing(INK_EASE)}
            className="mt-1"
          >
            <Text className="font-letter text-[16px] leading-[21px] tracking-[0.3px] text-ink uppercase">
              {quote.text}
            </Text>
            <Text className="mt-1 font-mono text-[11.5px] text-ink-soft">
              {quote.who}, <Text className="text-accent">{quote.series}</Text>
            </Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}
