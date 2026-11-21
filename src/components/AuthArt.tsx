// The manga panel over the account pages (the web's components/authArt/
// AuthArt.tsx and Spread.tsx): speed lines with a chapter number, a sound
// effect lettered across them, and the line a speech bubble says
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { useColors } from "@/lib/colors";

const LINES = 9;

export default function AuthArt({
  sfx,
  line,
  chapter,
}: {
  // the big sound effect lettered across the panel
  sfx: string;
  // what the speech bubble says
  line: string;
  // a chapter number drawn in the speed lines, if any
  chapter?: string | number;
}) {
  const c = useColors();
  return (
    <View className="gap-3">
      <View className="overflow-hidden rounded-[4px] border-2 border-line bg-card px-4 py-5">
        {/* the speed lines, thinner towards the middle */}
        <View className="absolute inset-0 justify-around py-3 opacity-60">
          {Array.from({ length: LINES }, (_, i) => (
            <View
              key={i}
              style={{
                height: 1 + Math.abs(i - LINES / 2) / 3,
                backgroundColor: c.lineSoft,
                marginLeft: `${(i * 37) % 30}%`,
                marginRight: `${(i * 53) % 25}%`,
              }}
            />
          ))}
        </View>
        {chapter ? (
          <Text className="font-mono text-[12px] tracking-[1px] text-muted uppercase">
            ch.{" "}
            <Text className="font-mono-medium text-[14px] text-ink">
              {chapter}
            </Text>
          </Text>
        ) : null}
        <Text
          className="font-brand pr-1 text-[44px] leading-[50px] tracking-[1px] text-ink uppercase"
          style={{ transform: [{ rotate: "-2deg" }] }}
        >
          {sfx}
        </Text>
      </View>
      {/* the speech bubble */}
      <View className="self-start rounded-[16px] border-2 border-line bg-card px-4 py-2.5">
        <Text className="font-display text-[16px] text-ink">{line}</Text>
      </View>
    </View>
  );
}

// a one-job page: the art, then a card with its title and what to do
export function Spread({
  sfx,
  line,
  chapter,
  title,
  children,
}: {
  sfx: string;
  line: string;
  chapter?: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <View className="gap-5">
      <AuthArt sfx={sfx} line={line} chapter={chapter} />
      <View className="gap-4 rounded-[4px] border-2 border-line bg-card p-4">
        <Text className="font-brand pr-1 text-[24px] tracking-[1px] text-ink uppercase">
          {title}
        </Text>
        {children}
      </View>
    </View>
  );
}
