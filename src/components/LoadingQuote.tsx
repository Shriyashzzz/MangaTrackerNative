// What a slow load shows (the web's components/slowLoadQuote): nothing for
// the first second, so a quick load never flashes it, then Kenji and a line
// from a manga to read while waiting, a new one every few seconds
import { useEffect, useState } from "react";
import { Text } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { QUOTES } from "@/core/lib/content/quotes";
import Mascot from "./Mascot";

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
    <Animated.View
      entering={FadeIn.duration(250)}
      accessibilityRole="progressbar"
      accessibilityLabel="Loading"
      className="mx-4 mt-10 items-center gap-4 rounded-[16px] border border-line-soft bg-card px-5 py-6"
    >
      <Mascot mood="happy" width={84} />
      <Text className="text-center font-body text-[13.5px] text-muted">
        Taking a moment. One to read while you wait:
      </Text>
      <Animated.View
        key={index}
        entering={FadeIn.duration(300)}
        className="items-center gap-2"
      >
        <Text className="text-center font-display text-[18px] leading-[25px] text-ink">
          {quote.text}
        </Text>
        <Text className="text-center font-body text-[13px] text-ink-soft">
          {quote.who}, {quote.series}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}
