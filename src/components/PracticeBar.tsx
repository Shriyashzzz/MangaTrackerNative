// A strip along the foot of the app while the practice shelf is on: says
// that nothing here is kept, with the two ways out (an account of their
// own, or just leaving). Gone otherwise
import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { inPractice, leavePractice } from "@/lib/practice";
import Tap from "./Tap";

export default function PracticeBar({ signedIn }: { signedIn: boolean }) {
  const insets = useSafeAreaInsets();
  // the practice account is "signed in": the strip follows that
  if (!signedIn || !inPractice()) return null;
  return (
    <View
      className="flex-row items-center gap-3 border-t border-line-soft bg-accent-wash px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 8) }}
    >
      <Text className="min-w-0 flex-1 font-body text-[13.5px] text-ink">
        Practice shelf. Nothing here is kept.
      </Text>
      <Tap onPress={() => leavePractice("/sign-up")} hitSlop={8}>
        <Text className="font-body-semibold text-[13.5px] text-accent-ink">
          Start mine
        </Text>
      </Tap>
      <Tap onPress={() => leavePractice("/")} hitSlop={8}>
        <Text className="font-body-semibold text-[13.5px] text-ink-soft">
          Leave
        </Text>
      </Tap>
    </View>
  );
}
