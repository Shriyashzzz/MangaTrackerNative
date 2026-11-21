// The small pieces every settings tab is made of: a section with its
// heading, a radio list, a tick row, and the note that says a save went
import type { ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { CheckIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";
import Switch from "../Switch";

export const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <View className="gap-3">
    <Text className="font-brand pr-1 text-[20px] tracking-[1px] text-ink uppercase">
      {title}
    </Text>
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
  const c = useColors();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      className="rounded-[4px] border-[1.5px] border-line-soft"
    >
      {options.map((o, i) => {
        const on = o.value === value;
        return (
          <Pressable
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
            {on ? <CheckIcon color={c.accent} width={16} height={16} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

export const Tick = Switch;
