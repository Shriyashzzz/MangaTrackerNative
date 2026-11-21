// The ⋮ menu's actions, as an Android sheet from the foot of the screen (the
// web's AppBarMenu): each a row, a dangerous one in the accent colour
import { Modal, Pressable, Text, View } from "react-native";

export type MenuItem = {
  label: string;
  onPress: () => void;
  danger?: boolean;
  disabled?: boolean;
};

export default function MenuSheet({
  open,
  items,
  onClose,
}: {
  open: boolean;
  items: MenuItem[];
  onClose: () => void;
}) {
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
        {items.map((item) => (
          <Pressable
            key={item.label}
            disabled={item.disabled}
            onPress={() => {
              onClose();
              item.onPress();
            }}
            className={`rounded-lg px-4 py-3.5 active:bg-accent-wash ${item.disabled ? "opacity-40" : ""}`}
          >
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
