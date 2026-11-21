// A form field's frame, as the web forms draw one (styles/form.ts): the
// label, "(optional)" when it is, the control, and what's wrong under it
import type { ReactNode } from "react";
import { Text, TextInput, View, type TextInputProps } from "react-native";
import { useColors } from "@/lib/colors";

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
  return (
    <TextInput
      placeholderTextColor={c.muted}
      {...props}
      className={`min-h-[46px] rounded-[2px] border-[1.5px] bg-paper px-3 py-2.5 font-body text-[16px] text-ink ${invalid ? "border-accent" : "border-line-soft"} ${className}`}
    />
  );
}
