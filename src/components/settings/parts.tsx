// The small pieces every settings tab is made of: a section with its
// heading, a radio list, a tick row, and the note that says a save went
import Tap from "@/components/Tap";
import type { ReactNode } from "react";
import { Text, View } from "react-native";
import { H2 } from "@/components/Page";
import Switch from "../Switch";

export const Section = ({
  title,
  children,
  // the first section sits under the tabs with no rule above it
  first = false,
}: {
  title: string;
  children: ReactNode;
  first?: boolean;
}) => (
  <View className={`gap-3 ${first ? "" : "border-t-[1.5px] border-line pt-6"}`}>
    <H2>{title}</H2>
    {children}
  </View>
);

export const Note = ({
  text,
  failed = false,
}: {
  text?: string | null;
  failed?: boolean;
}) =>
  text ? (
    <Text
      className={`font-body text-[13.5px] ${failed ? "text-accent" : "text-ok"}`}
    >
      {text}
    </Text>
  ) : null;

export const Help = ({ children }: { children: ReactNode }) => (
  <Text className="font-body text-[14px] text-ink-soft">{children}</Text>
);

export function Radios<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="overflow-hidden rounded-[14px] border border-line-soft bg-card"
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Tap
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            className={`min-h-[46px] flex-row items-center gap-3 px-3 ${i ? "border-t border-line-soft" : ""}`}
          >
            <View
              className={`h-5 w-5 items-center justify-center rounded-full border-2 ${on ? "border-accent" : "border-line"}`}
            >
              {on ? (
                <View className="h-2.5 w-2.5 rounded-full bg-accent" />
              ) : null}
            </View>
            <Text
              className={`flex-1 text-[15px] ${on ? "font-body-semibold text-ink" : "font-body text-ink-soft"}`}
            >
              {o.label}
            </Text>
          </Tap>
        );
      })}
    </View>
  );
}

export const Tick = Switch;
