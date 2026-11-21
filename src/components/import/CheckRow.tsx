// A tick box with its words beside it, as the import pages' lists have (the
// web's checkboxes there): the box is the shelf's select box
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { CheckIcon } from "@/core/components/icons/Icons";
import { useColors } from "@/lib/colors";

export function TickBox({
  checked,
  disabled = false,
}: {
  checked: boolean;
  disabled?: boolean;
}) {
  const c = useColors();
  return (
    <View
      className={`h-5 w-5 items-center justify-center rounded-[3px] border-[1.5px] ${checked ? "border-accent bg-accent" : "border-line bg-card"} ${disabled ? "opacity-40" : ""}`}
    >
      {checked ? <CheckIcon color={c.paper} width={14} height={14} /> : null}
    </View>
  );
}

export default function CheckRow({
  checked,
  disabled = false,
  onToggle,
  label,
  children,
}: {
  checked: boolean;
  disabled?: boolean;
  onToggle: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <Pressable
      onPress={onToggle}
      disabled={disabled}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked, disabled }}
      className="flex-row items-start gap-3 py-2 active:opacity-70"
    >
      <View className="pt-[2px]">
        <TickBox checked={checked} disabled={disabled} />
      </View>
      <View className="min-w-0 flex-1">{children}</View>
    </Pressable>
  );
}
