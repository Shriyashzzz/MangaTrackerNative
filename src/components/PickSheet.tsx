// The app's one pick-one list: a sheet with the picked one in bold and an
// optional count on the right. Anywhere something is picked from a short
// list uses it (the shelf's tab, its sort), as the web reuses its SortMenu
import * as Haptics from "expo-haptics";
import { Pressable, Text } from "react-native";
import { useRipple } from "@/lib/press";
import Sheet from "./Sheet";

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
  title?: string;
  options: readonly PickOption<T>[];
  picked: T;
  onPick: (value: T) => void;
  onClose: () => void;
}) {
  const ripple = useRipple();
  return (
    <Sheet open={open} onClose={onClose} contentClassName="px-2 pb-8">
      {title ? (
        <Text className="px-4 pt-1 pb-2 font-body-semibold text-[13px] tracking-[1px] text-muted uppercase">
          {title}
        </Text>
      ) : null}
      {options.map((o) => (
        <Pressable
          key={o.value}
          android_ripple={ripple}
          onPress={() => {
            void Haptics.selectionAsync();
            onPick(o.value);
            onClose();
          }}
          accessibilityState={{ selected: o.value === picked }}
          className="flex-row items-center justify-between overflow-hidden rounded-lg px-4 py-3.5 active:bg-accent-wash"
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
    </Sheet>
  );
}
