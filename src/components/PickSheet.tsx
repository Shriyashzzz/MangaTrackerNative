// The app's one pick-one list: a sheet from the foot of the screen, as
// Android's, with the picked one in bold and an optional count on the right.
// Anywhere something is picked from a short list uses it (the shelf's tab,
// its sort), as the web reuses its SortMenu
import { Modal, Pressable, Text, View } from "react-native";

export type PickOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export default function PickSheet<T extends string>({
  open,
  title,
  options,
  picked,
  onPick,
  onClose,
}: {
  open: boolean;
  // said above the list: "Sort by"
  title?: string;
  options: readonly PickOption<T>[];
  picked: T;
  onPick: (value: T) => void;
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
        {title ? (
          <Text className="px-4 pt-1 pb-2 font-body-semibold text-[13px] tracking-[1px] text-muted uppercase">
            {title}
          </Text>
        ) : null}
        {options.map((o) => (
          <Pressable
            key={o.value}
            onPress={() => {
              onPick(o.value);
              onClose();
            }}
            accessibilityState={{ selected: o.value === picked }}
            className="flex-row items-center justify-between rounded-lg px-4 py-3.5 active:bg-accent-wash"
          >
            <Text
              className={`text-[16px] ${o.value === picked ? "font-body-semibold text-ink" : "font-body text-ink-soft"}`}
            >
              {o.label}
            </Text>
            {o.count !== undefined ? (
              <Text className="font-mono text-[14px] text-muted">
                {o.count.toLocaleString()}
              </Text>
            ) : null}
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
