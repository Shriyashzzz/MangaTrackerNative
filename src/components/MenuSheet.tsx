// The ⋮ menu's actions, as an Android sheet from the foot of the screen (the
// web's AppBarMenu and .app-sheet): what they're about said quietly above,
// then each action a row, with its icon when it has one, a dangerous one in
// the accent colour
import type { ComponentType } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useColors } from "@/lib/colors";

type Icon = ComponentType<{ color?: string; width?: number; height?: number }>;
export type MenuItem = {
  label: string;
  onPress: () => void;
  icon?: Icon;
  danger?: boolean;
  disabled?: boolean;
};

export default function MenuSheet({
  open,
  title,
  items,
  onClose,
}: {
  open: boolean;
  title?: string;
  items: MenuItem[];
  onClose: () => void;
}) {
  const c = useColors();
  return (
    <Modal
      visible={open}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/40"
        onPress={onClose}
        accessibilityLabel="Close"
      />
      <View className="rounded-t-2xl bg-card px-2 pt-2 pb-8">
        <View className="mb-2 h-1 w-9 self-center rounded-full bg-muted/50" />
        {title ? (
          <Text
            numberOfLines={1}
            className="px-4 pt-1 pb-2 font-body text-[13px] text-muted"
          >
            {title}
          </Text>
        ) : null}
        {items.map((item) => (
          <Pressable
            key={item.label}
            disabled={item.disabled}
            onPress={() => {
              onClose();
              item.onPress();
            }}
            className={`flex-row items-center gap-3 rounded-lg px-4 py-3.5 active:bg-accent-wash ${item.disabled ? "opacity-40" : ""}`}
          >
            {item.icon ? (
              <item.icon
                color={item.danger ? c.accent : c.inkSoft}
                width={20}
                height={20}
              />
            ) : null}
            <Text
              className={`font-body-medium text-[16px] ${item.danger ? "text-accent" : "text-ink"}`}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
