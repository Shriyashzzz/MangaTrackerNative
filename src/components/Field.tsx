// A form field's frame, as the web forms draw one (styles/form.ts): the
// label, "(optional)" when it is, the control, and what's wrong under it
import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { SheetTextInput, useInSheet } from "./Sheet";
import { useColors } from "@/lib/colors";
import { look } from "@/lib/platformLook";

export function Field({
  label,
  optional = false,
  required = false,
  error,
  aside,
  children,
}: {
  label: string;
  optional?: boolean;
  required?: boolean;
  error?: string;
  // on the label's line, right: "120/450"
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="gap-1.5">
      <View className="flex-row items-baseline justify-between gap-3">
        <Text className="font-body-semibold text-[14.5px] text-ink">
          {label}
          {required ? <Text className="text-accent"> *</Text> : null}
          {optional ? (
            <Text className="font-body text-[13px] text-muted">
              {" "}
              (optional)
            </Text>
          ) : null}
        </Text>
        {aside}
      </View>
      {children}
      {error ? (
        <Text className="font-body-medium text-[13.5px] text-accent">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// the web's .input: a box with an inked border, red when it's wrong
export function Input({
  invalid = false,
  className = "",
  ...props
}: TextInputProps & { invalid?: boolean }) {
  const c = useColors();
  // in a sheet, the sheet's own kind of box (it lifts over the keyboard)
  const inSheet = useInSheet();
  const box = {
    placeholderTextColor: c.muted,
    ...props,
    className: `min-h-[48px] px-3.5 py-2.5 font-body text-[16px] text-ink ${look.input} ${invalid ? "border-accent" : look.inputEdge} ${className}`,
  };
  return inSheet ? <SheetTextInput {...box} /> : <TextInput {...box} />;
}
